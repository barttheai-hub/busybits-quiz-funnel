FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY viralreels .
RUN chmod +x viralreels

# Create output directory
RUN mkdir -p output

# Set entrypoint
ENTRYPOINT ["python3", "./viralreels"]
