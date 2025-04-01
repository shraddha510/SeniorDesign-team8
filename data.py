# -*- coding: utf-8 -*-
import json
import os
import re
import time
from datetime import datetime, timedelta

import emoji
import pandas as pd
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL =  os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

current_dir = os.path.dirname(os.path.abspath(__file__))

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

# Ensure directories exist
for directory in [csv_directory, json_directory]:
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
}
    
# Function to check if the string contains only English characters
def isEnglish(s):
    try:
        s.encode(encoding='utf-8').decode('ascii')
    except UnicodeDecodeError:
        return False
    else:
        return True

# Function to clean tweet text
def clean_text(text):
    try:
        # First, check if the text is English using the isEnglish function
        if not isEnglish(text):
            # If it's not English, remove non-English characters
            text = ''.join([char for char in text if char.isascii()])  # Remove non-ASCII characters

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

            results.append({
                "tweet_id": tweet_id,
                "timestamp": formatted_timestamp,
                "tweet_text": text,
                "matched_disaster_keywords": ", ".join(matched_disaster_words) if matched_disaster_words else "None",
                "matched_crisis_keywords": ", ".join(matched_crisis_words) if matched_crisis_words else "None",
                "hashtags": hashtags,
                "post_url": post_url,
                "sentiment_score": sentiment_score,
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

# Upload CSV file to Supabase 
def upload_to_supabase(csv_path):
    df = pd.read_csv(csv_path)

    # Convert DataFrame to a list of dictionaries (records)
    records = df.to_dict(orient="records")

    for record in records:
        try:
            # Insert each record into the 'bluesky_api_data' table
            response = supabase.table("bluesky_api_data").insert(record).execute()
            if response.get('error'):
                print(f"Error inserting record: {response['error']}")
        except Exception as e:
            print(f"Insert failed for record {record['tweet_id']}: {e}")

# Main execution
if __name__ == "__main__":
    all_data_dict = {}

    for keyword in disaster_keywords:
        print(f"Searching for posts with keyword: {keyword}")
        posts_data = fetch_bluesky_posts(keyword)

        for post in posts_data:
            all_data_dict[post['tweet_id']] = post  # Deduplicate by tweet_id

        time.sleep(1)

    all_data = list(all_data_dict.values())

    if all_data:
        save_data(all_data)
        upload_to_supabase(csv_filename)
    else:
        print("No disaster-related posts were found.")