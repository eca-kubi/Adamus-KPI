# Use Python 3.11 slim as the base image
FROM python:3.11-slim

# Set research working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    mariadb-client \    
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend and frontend code bases
COPY backend/ ./backend/
COPY frontend/ ./frontend/
# Copy the .env.coolify file as the default .env for the container
# This is optional if you pass all environment variables via Docker/Coolify
#COPY .env.coolify .env

COPY alembic.ini .
COPY start.sh .
COPY init-db.sh .

# Force Linux to make the script executable inside the image
RUN chmod +x start.sh init-db.sh    

# Expose the API port
EXPOSE 8000

# Run the application
CMD ["./start.sh"]
