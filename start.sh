#!/bin/bash
# start.sh

# Initialize database users
echo "Initializing database users..."
./init-db.sh
if [ $? -ne 0 ]; then
  echo "Database initialization failed! Exiting..."
  exit 1
fi

# Run migrations first
echo "Running Database Migrations..."
alembic upgrade head

# Check if migrations were successful
if [ $? -ne 0 ]; then
  echo "Database migration failed! Exiting..."
  exit 1
fi

# Seed database if requested
if [ "${SEED_DB}" = "true" ] || [ "${SEED_DB}" = "1" ]; then
  echo "Seeding database..."
  python backend/seed_kpi_2026.py
  if [ $? -ne 0 ]; then
    echo "Database seeding failed! Exiting..."
    exit 1
  fi
fi

echo "Starting Uvicorn..."
# Start the application
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000