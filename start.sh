#!/bin/bash
# start.sh

# Run migrations first
echo "Running Database Migrations..."
alembic upgrade head

# Check if migrations were successful
if [ $? -ne 0 ]; then
  echo "Database migration failed! Exiting..."
  exit 1
fi

echo "Starting Uvicorn..."
# Start the application
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000