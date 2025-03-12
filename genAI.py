from pydantic import BaseModel, Field
from llm import OllamaClient, Model
import csv

llm = Model.LLAMA_3_2
client = OllamaClient(llm)

with open("test.csv", "r") as csvfile:
    csv_reader = csv.reader(csvfile)
    tweet_list = list(map(tuple, csv_reader))

header = ['Tweet ID', 'Timestamp', 'Tweet', 'Genuine Disaster', 'Disaster Type', 'Location', 'Severity Score']

with open('output.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(header)
    file.close()


for i in range(1, len(tweet_list)):
    tweet_id = tweet_list[i][0]
    timestamp = tweet_list[i][1]
    tweet_text = tweet_list[i][2]

    class ClassifyDisaster(BaseModel):
        genuine_disaster: bool

    prompt0 = (
        "You are a social media analyst who is an expert on natural disaster recovery."
        "\nDetermine whether the following tweet genuinely reports an ongoing or recent natural disaster."
        "\n-If the tweet provides specific details about an event such as warnings, location, impact, emergency response, and information on disasters, classify it as True."
        "\n-If the tweet uses exaggeration, humor, or metaphorical language (e.g., 'This traffic is a total tornado'), classify it as False."
        "\n-Use linguistic cues, context, and common patterns found in real-time disaster reporting."
        f"\n\nTweet: {tweet_text}"
    )

    genuine_response = client.generate_json(
        prompt=prompt0,
        schema=ClassifyDisaster,
    )

    genuine = str(genuine_response[0]["arguments"]["genuine_disaster"])

    if genuine.lower() == "false":
        row = [tweet_id, timestamp, tweet_text, genuine, 'None', 'None', 'None']
        with open('output.csv', 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(row)
            file.close()

    if genuine.lower() == "true":
        prompt1 = (
            "You are a social media analyst who is an expert on natural disaster recovery."
            "\nA user inputted this tweet:\n"
            f"'{tweet_text}' "
            "\n\nBased on only the tweet information, answer the following questions:"
            "\n1. What type of natural disaster occurred? You must provide a brief justification first. "
            "If a disaster type is specified in the tweet text, output the disaster type, else output 'Not Specified'."
            "\n2. What is the location of the natural disaster? You must provide a brief justification first. "
            "If a location is specified in the tweet text, output the location, else output 'Not Specified'. "
            "\nDo not make up facts. Only analyze based on the tweet text provided. "
        )

        class DisasterSchema(BaseModel):
            disaster_type: str = Field(..., min_length=1)
            disaster_location: str = Field(..., min_length=1, description="Start with a capital letter")

        response = client.generate_json(
            prompt=prompt1,
            schema=DisasterSchema,
        )

        disaster_type = str(response[0]["arguments"]["disaster_type"])
        disaster_location = str(response[0]["arguments"]["disaster_location"])

        class SeverityScoreSchema(BaseModel):
            daily_living_impact_justification: str = Field(..., min_length=1)
            daily_living_impact_score: int = Field(..., ge=0, le=10)
            infrastructure_impact_justification: str = Field(..., min_length=1)
            infrastructure_impact_score: int = Field(..., ge=0, le=10)
            loss_of_life_justification: str = Field(..., min_length=1)
            loss_of_life_score: int = Field(..., ge=0, le=10)
            emergency_response_justification: str = Field(..., min_length=1)
            emergency_response_score: int = Field(..., ge=0, le=10)
        
        if disaster_type.lower() == "not specified":
            row = [tweet_id, timestamp, tweet_text, genuine, disaster_type, disaster_location, 'None']
            with open('output.csv', 'a', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(row)
                file.close()

        if disaster_type.lower() != "not specified":
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

            response = client.generate_json(
                prompt=prompt2,
                schema=SeverityScoreSchema,
            )

            daily_living_score_str = str(response[0]["arguments"]["daily_living_impact_score"])
            infrastructure_score_str = str(response[0]["arguments"]["infrastructure_impact_score"])
            loss_of_life_score_str = str(response[0]["arguments"]["loss_of_life_score"])
            emergency_response_score_str = str(response[0]["arguments"]["emergency_response_score"])

            daily_living_score_int = int(response[0]["arguments"]["daily_living_impact_score"])
            infrastructure_score_int = int(response[0]["arguments"]["infrastructure_impact_score"])
            loss_of_life_score_int = int(response[0]["arguments"]["loss_of_life_score"])
            emergency_response_score_int = int(response[0]["arguments"]["emergency_response_score"])

            severity_score = ((daily_living_score_int + infrastructure_score_int + loss_of_life_score_int + emergency_response_score_int) / 40) * 10

            row = [tweet_id, timestamp, tweet_text, genuine, disaster_type, disaster_location, severity_score]
            with open('output.csv', 'a', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(row)
                file.close()
