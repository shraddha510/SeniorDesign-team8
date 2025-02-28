import json
import os
import re
import time
from datetime import datetime, timedelta

import emoji
import pandas as pd
import requests
from dotenv import load_dotenv
from langdetect import detect
from supabase import create_client
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Temporary direct environment variable setting for testing
os.environ["SUPABASE_URL"] = "https://opehiyxkmvneeggatqoj.supabase.co"
os.environ[
    "SUPABASE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZWhpeXhrbXZuZWVnZ2F0cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzQyNjMsImV4cCI6MjA1NTI1MDI2M30.MszUsOz_eOOEE0Ldg-6_uh3zPmZoF32t5JHK1a9WhiA"

# Load environment variables with explicit path - point to the correct .env file
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '.env')
print(f"Looking for .env file at: {env_path}")  # Debug print

# Check if .env file exists
if not os.path.exists(env_path):
    raise FileNotFoundError(f".env file not found at {env_path}")

# Print .env file contents (be careful with this in production!)
print("Contents of .env file:")
with open(env_path, 'r') as f:
    print(f.read())

# Load the environment variables
load_dotenv(env_path)

# Debug logging for environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print("Environment variables after loading:")
print(f"SUPABASE_URL: {supabase_url}")
print(f"SUPABASE_KEY: {supabase_key}")

if not supabase_url or not supabase_key:
    raise ValueError(
        "Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_KEY "
        "are set in your .env file and the file is in the correct location: "
        f"{env_path}"
    )

print(f"Loaded Supabase URL: {supabase_url[:8]}...")
print(f"Loaded Supabase Key: {supabase_key[:8]}...")

# Initialize Supabase client
try:
    supabase = create_client(supabase_url, supabase_key)
    print("Successfully initialized Supabase client")
except Exception as e:
    raise Exception(f"Failed to initialize Supabase client: {str(e)}")

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
csv_directory = "tweet_analysis_app/public/csv"
json_directory = "tweet_analysis_app/public/json"

# Generate filenames with MM-DD-YYYY format
current_date = datetime.now().strftime("%m-%d-%Y")
csv_filename = os.path.join(csv_directory, f"bluesky_disaster_data_{current_date}.csv")
json_filename = os.path.join(json_directory, f"bluesky_raw_data_{current_date}.json")

# Calculate 24-hour time window
cutoff_time = datetime.utcnow() - timedelta(days=1)


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
    url = f"https://public.api.bsky.app/xrpc/app.bsky.feed.searchposts?q={keyword}"

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
                "sentiment_score": sentiment_score
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


# Save data to Supabase
def save_to_supabase(data):
    if not data:
        return

    try:
        # Format the data to match the table structure
        formatted_data = []
        for item in data:
            formatted_item = {
                'tweet_id': item['tweet_id'],
                'timestamp': item['timestamp'],
                'tweet_text': item['tweet_text'],
                'matched_disaster_keywords': item['matched_disaster_keywords'],
                'matched_crisis_keywords': item['matched_crisis_keywords'],
                'hashtags': item['hashtags'],
                'post_url': item['post_url'],
                'sentiment_score': float(item['sentiment_score'])  # Ensure this is a float
            }
            formatted_data.append(formatted_item)

        # Insert data into the 'disaster_posts' table
        result = supabase.table('disaster_posts').insert(formatted_data).execute()
        print(f"Successfully stored {len(formatted_data)} records in Supabase")
        return result
    except Exception as e:
        print(f"Error storing data in Supabase: {e}")
        return None


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
        save_to_supabase(all_data)
    else:
        print("No disaster-related posts were found.")
