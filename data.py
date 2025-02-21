import requests
import csv
import json
import os
import re
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from supabase import create_client
from dotenv import load_dotenv

# Temporary direct environment variable setting for testing
os.environ["SUPABASE_URL"] = "https://opehiyxkmvneeggatqoj.supabase.co"
os.environ["SUPABASE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZWhpeXhrbXZuZWVnZ2F0cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzQyNjMsImV4cCI6MjA1NTI1MDI2M30.MszUsOz_eOOEE0Ldg-6_uh3zPmZoF32t5JHK1a9WhiA"

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

print(f"Loaded Supabase URL: {supabase_url[:8]}...") # Print first 8 chars for verification
print(f"Loaded Supabase Key: {supabase_key[:8]}...") # Print first 8 chars for verification

# Initialize Supabase client
try:
    supabase = create_client(supabase_url, supabase_key)
    print("Successfully initialized Supabase client")
except Exception as e:
    raise Exception(f"Failed to initialize Supabase client: {str(e)}")

# Load NLP tools
# Analyze Sentiment of the Post
# pip install nltk vaderSentiment

# Positive Sentiment → Score: 0.5 to 1.0
# Neutral Sentiment → Score: -0.5 to 0.5
# Negative Sentiment → Score: -1.0 to -0.5
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

# File paths
csv_filename = "tweet_analysis_app/public/bluesky_disaster_data.csv"
json_filename = "tweet_analysis_app/public/bluesky_raw_data.json"

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

# Add new function to save data to Supabase
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

    if all_data:
        save_to_csv(all_data)
        save_to_json(all_data)
        save_to_supabase(all_data)
    else:
        print("No disaster-related posts were found.")