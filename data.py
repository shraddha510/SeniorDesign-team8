import requests
import csv
import json
import os
import re
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Load NLP tools
# Analyze Sentiment of the Post
# pip install nltk vaderSentiment

# Positive Sentiment → Score: 0.5 to 1.0
# Neutral Sentiment → Score: -0.5 to 0.5
# Negative Sentiment → Score: -1.0 to -0.5
analyzer = SentimentIntensityAnalyzer()

# Load External Disaster Keyword List
def load_disaster_words(filename="disaster_words.txt"):
    try:
        with open(filename, "r", encoding="utf-8") as file:
            disaster_words = [line.strip().lower() for line in file if line.strip()]
        print(f"Loaded {len(disaster_words)} disaster keywords.")
        return disaster_words
    except FileNotFoundError:
        print("Disaster word list file not found! Using crisis keywords only.")
        return []

# Load External Crisis Word List 
def load_crisis_words(filename="crisis_words.txt"):
    try:
        with open(filename, "r", encoding="utf-8") as file:
            crisis_words = [line.strip().lower() for line in file if line.strip()]
        print(f"Loaded {len(crisis_words)} crisis keywords.")
        return crisis_words
    except FileNotFoundError:
        print("Crisis word list file not found! Using disaster keywords only.")
        return []

disaster_keywords = load_disaster_words()
crisis_keywords = load_crisis_words()

# File paths
csv_filename = "bluesky_disaster_data.csv"
json_filename = "bluesky_raw_data.json"

# Function to fetch Bluesky posts
def fetch_bluesky_posts(keyword):
    url = f"https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q={keyword}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        # Extract relevant fields
        posts = data.get("posts", [])
        results = []
        
        for post in posts:
            author = post.get("author", {}).get("handle", "Unknown")  # Author handle
            text = post.get("record", {}).get("text", "No content").lower()  # Convert to lowercase
            raw_timestamp = post.get("indexedAt", "Unknown")  # Original timestamp
            
            # Convert timestamp format
            try:
                formatted_timestamp = datetime.strptime(raw_timestamp, "%Y-%m-%dT%H:%M:%S.%fZ").strftime("%Y-%m-%d %H:%M:%S")
            except ValueError:
                formatted_timestamp = raw_timestamp  # If conversion fails, keep original
            
            hashtags = " ".join([word for word in text.split() if word.startswith("#")])
            
            # Extract tweet ID
            post_uri = post.get("uri", "")
            tweet_id = re.sub(r'\D', '', post_uri)[-20:] 
            
            post_url = f"https://bsky.app/profile/{author}/post/{post_uri.split('/')[-1]}"

            # Extract sentiment score
            sentiment_score = analyzer.polarity_scores(text)["compound"]

            # Find matches in disaster and crisis keyword lists
            matched_disaster_words = [word for word in disaster_keywords if word in text]
            matched_crisis_words = [word for word in crisis_keywords if word in text]

            # Exclude tweets that don't match any keywords
            if not matched_disaster_words and not matched_crisis_words:
                continue  # Skip tweet if it doesn't match any keywords

            # Store filtered data
            results.append({
                "tweet_id": tweet_id,
                "timestamp": formatted_timestamp,
                "tweet_text": text,
                "matched_disaster_keywords": ", ".join(matched_disaster_words) if matched_disaster_words else "None",
                "matched_crisis_keywords": ", ".join(matched_crisis_words) if matched_crisis_words else "None",
                "hashtags": hashtags,
                "post_url": post_url,
                "sentiment_score": sentiment_score
            })
        
        return results

    except requests.exceptions.RequestException as e:
        print("Error fetching data:", e)
        return []

# Function to save data to CSV
def save_to_csv(data):
    if not data:
        return
    
    file_exists = os.path.exists(csv_filename)

    with open(csv_filename, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=[
            "tweet_id", "timestamp", "tweet_text", "matched_disaster_keywords",
            "matched_crisis_keywords", "hashtags", "post_url", "sentiment_score"
        ])
        
        # Write header only if file does not exist
        if not file_exists:
            writer.writeheader()
        
        writer.writerows(data)
    
    print(f"Data appended to {csv_filename}")

# Function to save data to JSON
def save_to_json(data):
    if not data:
        return

    if os.path.exists(json_filename):
        with open(json_filename, "r+", encoding="utf-8") as json_file:
            try:
                existing_data = json.load(json_file)
                existing_data.extend(data)
                json_file.seek(0)
                json.dump(existing_data, json_file, indent=4)
            except json.JSONDecodeError:
                json.dump(data, json_file, indent=4)
    else:
        with open(json_filename, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=4)

    print(f"Data appended to {json_filename}")

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

    if all_data:
        save_to_csv(all_data)
        save_to_json(all_data)
    else:
        print("No disaster-related posts were found.")