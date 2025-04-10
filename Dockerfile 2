# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python scripts and supporting files into the container
COPY data.py .
COPY disaster_words.txt .
COPY crisis_words.txt .
COPY gen_ai_research/ gen_ai_research/

# Environment variables needed by the scripts (will be provided at runtime)
# ENV SUPABASE_URL="your_supabase_url"
# ENV SUPABASE_KEY="your_supabase_key"
# Ollama URL - Assuming running on host network, localhost should work if Ollama is on the VM
# ENV OLLAMA_URL="http://localhost:11434"

# Command to run both scripts sequentially when the container launches
# NOTE: If genAI.py depends on data.py finishing *completely* (e.g., data in Supabase),
# this sequential execution within one container run is appropriate.
CMD python data.py && python gen_ai_research/genAI.py 