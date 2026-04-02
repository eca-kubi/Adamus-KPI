# Use Python 3.11 slim as the base image
FROM python:3.11-slim

# Set research working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
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

# Expose the API port
EXPOSE 8000

# Start the application using uvicorn
# We run it as a module to handle relative imports correctly
CMD sh -c "alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port 8000"
