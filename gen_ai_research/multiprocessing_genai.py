import csv
import pandas as pd
import requests
import time
import re
from pydantic import BaseModel, Field
from supabase import create_client, Client
from llm import OllamaClient, Model
from multiprocessing import Pool

llm = Model.LLAMA_3_2
client = OllamaClient(llm)

def get_user_inputs():
    # Get user inputs
    input_date = input("Enter the input date (yyyy-mm-dd): ").strip()
    output_filename = input("Enter the name of the output CSV file (e.g., output.csv): ").strip()
    return input_date, output_filename

def fetch_from_supabase(input_date):
    SUPABASE_URL = "https://opehiyxkmvneeggatqoj.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZWhpeXhrbXZuZWVnZ2F0cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzQyNjMsImV4cCI6MjA1NTI1MDI2M30.MszUsOz_eOOEE0Ldg-6_uh3zPmZoF32t5JHK1a9WhiA"

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = (
        supabase
        .table("bluesky_api_data")
        .select("*")
        .gte("timestamp", f"{input_date}T00:00:00+00:00")
        .lt("timestamp", f"{input_date}T23:59:59+00:00")
        .execute()
    )

    data = response.data
    df = pd.DataFrame(data)
    df.to_csv("test.csv", index=False)

    with open('test.csv', newline='') as csvfile:
        reader = csv.reader(csvfile)
        row_count = sum(1 for row in reader) - 1
        print("Number of rows:", row_count)

    with open("test.csv", "r") as csvfile:
        csv_reader = csv.reader(csvfile)
        tweet_list = list(map(tuple, csv_reader))
    
    return row_count, tweet_list

def write_output_file(output_filename):
    header = ['Tweet ID', 'Timestamp', 'Tweet', 'Genuine Disaster', 'Disaster Type', 'Location', 'Severity Score']

    with open(output_filename, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(header)

def safe_generate_json(prompt, schema, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = client.generate_json(prompt=prompt, schema=schema)
            return response
        except Exception as e:
            print(f"Retrying... Error: {e}")
            time.sleep(1)  # Wait a bit before retrying
    return None  # Return None if all retries fail

# ---------------------------- Core Classification Function ----------------------------

def classify_tweet(tweet_data):
    print(tweet_data)
    tweet_id = tweet_data[0]
    timestamp = tweet_data[1]
    hashtags = tweet_data[5]
    tweet_text = tweet_data[2] + f" {hashtags}"
    print(tweet_text)

    class ClassifyDisaster(BaseModel):
        genuine_disaster: bool

    prompt0 = f"""
    You are a social media analyst who is an expert on natural disaster recovery.  
    Determine whether the following tweet genuinely reports an ongoing or recent natural disaster.  
    
    ### Classification Rules:  
    ✅ **Classify as True** if the tweet:  
    - Provides specific details about an ongoing or recent natural disaster, including locations, victims, warnings, emergency response, aid efforts, or official updates.  
    - Is a news headline or report about a real natural disaster, even if it doesn't contain personal narratives.  
    - Mentions verifiable entities (e.g., government officials, emergency agencies) discussing natural disaster impact or response.  
    - Is NOT discussing a natural disaster that happened in the past.
    
    ❌ **Classify as False** if the tweet:  
    - Uses metaphorical language (e.g., “This traffic is a tornado”).  
    - Mentions a natural disaster in a non-literal way, such as referencing past events without new developments.  
    - Is purely emotional, symbolic, or does not provide any verifiable disaster-related information. 

    ### Examples: 

    1. **Tweet:** "California wildfires: winds die down, helping containment efforts https://t.co/3asXQsQZgM https://t.co/b89SKa3Tuw"  
       **Output:** True ✅ *(Specific disaster details, containment efforts mentioned)*  
    
    2. **Tweet:** "Flood Death rate increases in Sri Lanka has been published on Liveonchennai - https://t.co/GmM2ENO8Mb https://t.co/WYe0eGoZlw"  
       **Output:** True ✅ *(Verifiable disaster impact—death toll rising)* 

    3. **Tweet:** "Blue heart yellow heart please help flood social media with this message"  
       **Output:** False ❌ *(No disaster details—just symbolic language)* 
    
    4. **Tweet:** "the day over and the adrenaline of a job well done flooding their bodies and minds the sisters celebrate"  
       **Output:** False ❌ *(No disaster details—just symbolic language)* 
    
    ### Final Classification Task:  
    Now, classify the following tweet:  
    **Tweet:** "{tweet_text}"  
    **Output:** (True/False)
    """
    genuine_response = safe_generate_json(prompt=prompt0, schema=ClassifyDisaster)
    genuine = str(genuine_response[0]["arguments"]["genuine_disaster"])

    print(genuine)

    if genuine.lower() != "true":
        return [tweet_id, timestamp, tweet_text, genuine, 'None', 'None', 'None']

    if genuine.lower() == "true":
        class DisasterSchema(BaseModel):
            disaster_type: str = Field(..., min_length=1)
            disaster_location: str = Field(..., min_length=1)

        prompt1 = (
                "You are a social media analyst who is an expert on natural disaster recovery."
                "\nA user inputted this tweet:\n"
                f"'{tweet_text}' "
                "\n\nBased on only the tweet information, answer the following questions:"
                "\n1. What type of natural disaster occurred? You must provide a brief justification first. "
                "If a disaster type is specified in the tweet text, output the disaster type, else output 'Not Specified'."
                "\n2. What is the location of the natural disaster? You must provide a brief justification first. "
                "If a location is specified in the tweet text, output a map-friendly location, else output 'Not Specified'. "
                "\nDo not make up facts. Only analyze based on the tweet text provided. "
            )
        response = safe_generate_json(prompt=prompt1, schema=DisasterSchema)

        disaster_type = response[0]["arguments"]["disaster_type"]
        disaster_location = response[0]["arguments"]["disaster_location"]

        print(disaster_type)
        print(disaster_location)

        if disaster_type.lower() == "not specified":
            return [tweet_id, timestamp, tweet_text, genuine, disaster_type, disaster_location, 'None']

        class SeverityScoreSchema(BaseModel):
            daily_living_impact_justification: str
            daily_living_impact_score: int
            infrastructure_impact_justification: str
            infrastructure_impact_score: int
            loss_of_life_justification: str
            loss_of_life_score: int
            emergency_response_justification: str
            emergency_response_score: int

        try:
            prompt2 = (
                        "You are a social media analyst who is an expert on natural disaster recovery. "
                        "Do not make up facts. Only analyze based on the tweet text provided. "
                        "\nA user inputted this tweet:\n"
                        f"'{tweet_text}'"
                        f"\n\nNatural Disaster Type: {disaster_type}. "
                        "\nBased on only the tweet information, answer the following questions:"
                        "\n1. Assess the impact of the natural disaster specified in the tweet on daily living on a scale from 0 to 10 where 0 is no impact "
                        "and 10 is complete disruption of daily life. You must provide a concise justification on the impact on daily living first before providing the score. "
                        "\n2. Assess the impact of the natural disaster specified in the tweet on infrastructure from 0 to 10 where 0 is no impact "
                        "and 10 is life-threatening infrastructure damage. You must provide a concise justification on the impact on infrastructure first before providing the score. "
                        "\n3. Assess the loss of life specified in the tweet on a scale from 0 to 10 where 0 is no loss of life and 10 is a death toll greater than 5. "
                        "This means that if the death toll is greater than 5, the score must be 10. "
                        "You must provide a concise justification on the loss of life first before providing the score. "
                        "\n4. Assess the need for emergency response measures on a scale from 0 to 10 where 0 is no need for emergency responses "
                        "and 10 involves mandatory evacuations and rescue efforts. You must provide a concise justification on the emergency responses score first before providing the score. "
                    )
            response = safe_generate_json(prompt=prompt2, schema=SeverityScoreSchema)

            daily_living_score_int = int(response[0]["arguments"]["daily_living_impact_score"])
            infrastructure_score_int = int(response[0]["arguments"]["infrastructure_impact_score"])
            loss_of_life_score_int = int(response[0]["arguments"]["loss_of_life_score"])
            emergency_response_score_int = int(response[0]["arguments"]["emergency_response_score"])
        except (ValueError, KeyError, TypeError) as e:
            daily_living_score_int = 5
            infrastructure_score_int = 5
            loss_of_life_score_int = 5
            emergency_response_score_int = 5


        severity_score = ((daily_living_score_int + infrastructure_score_int + loss_of_life_score_int + emergency_response_score_int) / 40) * 10

        return [tweet_id, timestamp, tweet_text, genuine, disaster_type, disaster_location, severity_score]

# ---------------------------- Multiprocessing for Batch ----------------------------

def run_multiprocessing(start, end, tweet_list, batch_size=5):
    print(f"Start: {start}, End: {end}")
    data_to_process = tweet_list[start:end]  # skip header
    with Pool(processes=batch_size) as pool:
        results = pool.map(classify_tweet, data_to_process)

    with open(output_filename, 'a', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(results)

# ---------------------------- Geocoding Locations ----------------------------

def get_location_data(city_name):
    url = f"https://geocode.xyz/{city_name}?json=1"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else {}

def enrich_location():
    with open(output_filename, "r") as csvfile:
        csv_reader = csv.reader(csvfile)
        tweet_list = [list(row) for row in csv_reader]
        tweet_list[0].extend(["Latitude", "Longitude"])

    for i in range(1, len(tweet_list)):
        location = tweet_list[i][5]
        if location != "None" and location.lower() != "not specified":
            location_data = get_location_data(location)

            if location_data.get('code') != '018':
                latitude = location_data.get('latt', 'None')
                longitude = location_data.get('longt', 'None')
                if latitude == "None":
                    location_parts = re.split(r", | and ", location)
                    first_item = location_parts[0]
                    last_item = location_parts[-1]
                    first_location_data = get_location_data(first_item)
                    last_location_data = get_location_data(last_item)
                    print(first_item)
                    print(last_item)

                    if first_location_data.get('code') != '018':
                        latitude = first_location_data.get('latt', 'None')
                        longitude = first_location_data.get('longt', 'None')
                        if last_location_data.get('code') != '018' and latitude == "None":
                            latitude = last_location_data.get('latt', 'None')
                            longitude = last_location_data.get('longt', 'None')
            print(f"Location: {location}, Latitude: {latitude}, Longitude: {longitude}\n")

            tweet_list[i].extend([latitude, longitude])
            time.sleep(5)

    with open(output_filename, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(tweet_list)

# ---------------------------- Run All ----------------------------

if __name__ == "__main__":
    input_date, output_filename = get_user_inputs()
    row_count, tweet_list = fetch_from_supabase(input_date)
    write_output_file(output_filename)
    start = 1
    end = start + 99
    while end < row_count:
        if end > row_count:
            end = row_count
        run_multiprocessing(start, end, tweet_list, batch_size=5)
        start = end + 1
        end = start + 99
        time.sleep(300)
    enrich_location()
    print("CSV file updated successfully!")
