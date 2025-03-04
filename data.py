import json
import os
import re
import time
import base64
from datetime import datetime, timedelta

import emoji
import pandas as pd
import requests
from dotenv import load_dotenv
from langdetect import detect
from supabase import create_client
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Load NLP tools
analyzer = SentimentIntensityAnalyzer()


# Load External Disaster Keyword List
def load_disaster_words(filename="disaster_words.txt"):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, filename)
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            disaster_words = [line.strip().lower() for line in file if line.strip()]
        print(f"Loaded {len(disaster_words)} disaster keywords from {file_path}")
        return disaster_words
    except FileNotFoundError:
        print(f"Disaster word list file not found at {file_path}! Using crisis keywords only.")
        return []


# Load External Crisis Word List
def load_crisis_words(filename="crisis_words.txt"):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, filename)
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            crisis_words = [line.strip().lower() for line in file if line.strip()]
        print(f"Loaded {len(crisis_words)} crisis keywords from {file_path}")
        return crisis_words
    except FileNotFoundError:
        print(f"Crisis word list file not found at {file_path}! Using disaster keywords only.")
        return []


disaster_keywords = load_disaster_words()
crisis_keywords = load_crisis_words()

# Directories for CSV and JSON 
csv_directory = os.path.join(current_dir, "tweet_analysis_app", "public", "csv")
json_directory = os.path.join(current_dir, "tweet_analysis_app", "public", "json")
images_directory = os.path.join(current_dir, "tweet_analysis_app", "public", "images")

# Ensure directories exist
for directory in [csv_directory, json_directory, images_directory]:
    os.makedirs(directory, exist_ok=True)

# Generate filenames with MM-DD-YYYY format
current_date = datetime.now().strftime("%m-%d-%Y")
csv_filename = os.path.join(csv_directory, f"bluesky_disaster_data_{current_date}.csv")
json_filename = os.path.join(json_directory, f"bluesky_raw_data_{current_date}.json")

# Calculate 24-hour time window
cutoff_time = datetime.utcnow() - timedelta(days=1)

# Data directories dictionary for easy reference
data_dirs = {
    'csv': csv_directory,
    'json': json_directory,
    'images': images_directory
}

# Function to download and save an image
def download_image(img_url, img_path):
    try:
        response = requests.get(img_url, stream=True)
        response.raise_for_status()
        
        # Save the image to disk
        with open(img_path, 'wb') as img_file:
            for chunk in response.iter_content(chunk_size=8192):
                img_file.write(chunk)
        
        # Create a base64 representation for embedding in JSON/database
        with open(img_path, 'rb') as img_file:
            img_data = img_file.read()
            base64_data = base64.b64encode(img_data).decode('utf-8')
            
        print(f"Successfully downloaded image to {img_path}")
        return base64_data
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None


# Function to clean tweet text
def clean_text(text):
    try:
        # Check if the text is in English
        if detect(text) != 'en':
            return None

        # Convert emojis to text
        text = emoji.demojize(text, delimiters=("", " "))

        # Remove URLs, mentions, and special characters
        text = re.sub(r"http\S+|www\S+|https\S+", '', text, flags=re.MULTILINE)  # URLs
        text = re.sub(r'@\w+', '', text)  # Mentions
        text = re.sub(r'#\w+', '', text)  # Hashtags
        text = re.sub(r'[^\w\s]', '', text)  # Special characters

        # Standardize text: Lowercase, strip whitespace
        text = text.lower().strip()

        return text if text else None
    except Exception as e:
        print(f"Error cleaning text: {e}")
        return None


# Function to fetch Bluesky posts
def fetch_bluesky_posts(keyword):
    url = f"https://api.bsky.app/xrpc/app.bsky.feed.searchposts?q={keyword}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        posts = data.get("posts", [])
        results = []
        
        for post in posts:
            author = post.get("author", {}).get("handle", "Unknown")
            text = post.get("record", {}).get("text", "No content").lower()
            raw_timestamp = post.get("indexedAt", "Unknown")
            
            # Extract images if they exist - improved image extraction
            images = []
            record = post.get("record", {})
            embed = record.get("embed", {})
            
            # Handle different embed types
            if isinstance(embed, dict):
                # Handle $type: app.bsky.embed.images
                if embed.get("$type") == "app.bsky.embed.images":
                    for img in embed.get("images", []):
                        if img.get("image", {}).get("ref"):
                            img_url = f"https://bsky.social/xrpc/com.atproto.sync.getBlob?did={post.get('author', {}).get('did')}&cid={img['image']['ref']['$link']}"
                            tweet_id = re.sub(r'\D', '', post.get("uri", ""))[-20:]
                            img_filename = f"{tweet_id}_{len(images)}.jpg"
                            img_path = os.path.join(data_dirs['images'], img_filename)
                            
                            img_base64 = download_image(img_url, img_path)
                            if img_base64:
                                images.append({
                                    "url": img_url,
                                    "local_path": f"/images/{img_filename}",
                                    "base64": img_base64,
                                    "alt": img.get("alt", "")
                                })
                
                # Handle embedded external images
                elif embed.get("$type") == "app.bsky.embed.external":
                    external = embed.get("external", {})
                    if external.get("thumb"):
                        img_url = external.get("thumb")
                        tweet_id = re.sub(r'\D', '', post.get("uri", ""))[-20:]
                        img_filename = f"{tweet_id}_external.jpg"
                        img_path = os.path.join(data_dirs['images'], img_filename)
                        
                        img_base64 = download_image(img_url, img_path)
                        if img_base64:
                            images.append({
                                "url": img_url,
                                "local_path": f"/images/{img_filename}",
                                "base64": img_base64,
                                "alt": external.get("title", "")
                            })
                
                # Handle embedded posts with images
                elif embed.get("$type") == "app.bsky.embed.record":
                    record_embed = embed.get("record", {}).get("embed", {})
                    if isinstance(record_embed, dict) and record_embed.get("$type") == "app.bsky.embed.images":
                        for img in record_embed.get("images", []):
                            if img.get("image", {}).get("ref"):
                                img_url = f"https://bsky.social/xrpc/com.atproto.sync.getBlob?did={post.get('author', {}).get('did')}&cid={img['image']['ref']['$link']}"
                                tweet_id = re.sub(r'\D', '', post.get("uri", ""))[-20:]
                                img_filename = f"{tweet_id}_{len(images)}_embed.jpg"
                                img_path = os.path.join(data_dirs['images'], img_filename)
                                
                                img_base64 = download_image(img_url, img_path)
                                if img_base64:
                                    images.append({
                                        "url": img_url,
                                        "local_path": f"/images/{img_filename}",
                                        "base64": img_base64,
                                        "alt": img.get("alt", "")
                                    })

            # Convert and filter by timestamp (last 24 hours)
            try:
                post_timestamp = datetime.strptime(raw_timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
                if post_timestamp < cutoff_time:
                    continue  # Skip posts older than 24 hours
                formatted_timestamp = post_timestamp.strftime("%Y-%m-%d %H:%M:%S")
            except ValueError:
                formatted_timestamp = raw_timestamp

            hashtags = " ".join([word for word in text.split() if word.startswith("#")])

            # Extract tweet ID
            post_uri = post.get("uri", "")
            tweet_id = re.sub(r'\D', '', post_uri)[-20:]

            post_url = f"https://bsky.app/profile/{author}/post/{post_uri.split('/')[-1]}"

            # Extract sentiment score
            sentiment_score = analyzer.polarity_scores(text)["compound"]

            # Match keywords
            matched_disaster_words = [word for word in disaster_keywords if word in text]
            matched_crisis_words = [word for word in crisis_keywords if word in text]

            # Exclude tweets with no matched keywords
            if not matched_disaster_words and not matched_crisis_words:
                continue

            # Create a simplified image data structure for storage
            image_data = []
            for img in images:
                image_data.append({
                    "url": img["url"],
                    "local_path": img["local_path"],
                    "alt": img["alt"]
                })

            results.append({
                "tweet_id": tweet_id,
                "timestamp": formatted_timestamp,
                "tweet_text": text,
                "matched_disaster_keywords": ", ".join(matched_disaster_words) if matched_disaster_words else "None",
                "matched_crisis_keywords": ", ".join(matched_crisis_words) if matched_crisis_words else "None",
                "hashtags": hashtags,
                "post_url": post_url,
                "sentiment_score": sentiment_score,
                "images": image_data
            })

        return results

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return []


# Function to save data to CSV and JSON
def save_data(data):
    if not data:
        print("No data to save.")
        return

    df = pd.DataFrame(data)
    
    # Convert images list to string representation for CSV
    if 'images' in df.columns:
        df['images'] = df['images'].apply(lambda x: json.dumps(x) if x else "[]")

    # Apply cleaning only for CSV, not JSON
    df['tweet_text'] = df['tweet_text'].apply(clean_text)

    # Drop rows with None (invalid or non-English data)
    df = df.dropna(subset=['tweet_text'])

    if os.path.exists(csv_filename):
        df.to_csv(csv_filename, mode='a', index=False, header=False)
    else:
        df.to_csv(csv_filename, mode='w', index=False)

    # Save to CSV
    df.to_csv(csv_filename, mode='w', index=False)
    print(f"Data saved to CSV: {csv_filename}")

    # Save to JSON (raw data, no cleaning)
    with open(json_filename, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4)
    print(f"Data saved to JSON: {json_filename}")

# Main execution
if __name__ == "__main__":
    all_data = []

    for keyword in disaster_keywords:
        print(f"Searching for posts with keyword: {keyword}")
        posts_data = fetch_bluesky_posts(keyword)

        if posts_data:
            all_data.extend(posts_data)
        else:
            print(f"No results found for '{keyword}', skipping...")

        time.sleep(1)

    if all_data:
        save_data(all_data)
    else:
        print("No disaster-related posts were found.")
