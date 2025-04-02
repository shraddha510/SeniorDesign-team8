import csv
import requests
import time

def get_location_data(city_name):
    url = f"https://geocode.xyz/{city_name}?json=1"
    response = requests.get(url)
    
    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        return data
    else:
        return f"Error: {response.status_code}"

with open("output.csv", "r") as csvfile:
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
        else:
            latitude = "None"
            longitude = "None"
        print(f"Location: {location}, Latitude: {latitude}, Longitude: {longitude}\n")

        tweet_list[i].extend([latitude, longitude])
        time.sleep(2)

with open("output.csv", "w", newline="", encoding="utf-8") as csvfile:
    csv_writer = csv.writer(csvfile)
    csv_writer.writerows(tweet_list)

print("CSV file updated successfully!")
