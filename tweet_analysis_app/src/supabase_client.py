import pandas as pd
import numpy as np
from supabase import create_client

SUPABASE_URL = "https://opehiyxkmvneeggatqoj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZWhpeXhrbXZuZWVnZ2F0cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzQyNjMsImV4cCI6MjA1NTI1MDI2M30.MszUsOz_eOOEE0Ldg-6_uh3zPmZoF32t5JHK1a9WhiA"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def push_to_supabase(data: dict):
    """Push data to Supabase table"""
    try:
        response = supabase.table("gen_ai_output").insert(data).execute()
        print("Response:", response)
        if hasattr(response, "data") and response.data:
            print("Insert successful:", response.data)
        else:
            print("Insert failed:", getattr(response, "error_message", "Unknown error"))
    except Exception as e:
        print(f"Error: {str(e)}")

def push_csv_to_supabase(csv_file_path: str):
    """Read CSV file, handle NaN values, and push data to Supabase"""
    df = pd.read_csv(csv_file_path)

    # Replace NaN values with None
    df = df.replace({pd.NA: None, np.nan: None})

    # Convert dataframe to list of dictionaries and insert in bulk
    data_list = df.to_dict(orient="records")

    for data in data_list:
        push_to_supabase(data)

csv_file_path = "../../gen_ai_research/output.csv"
push_csv_to_supabase(csv_file_path)
