#!/bin/bash
# start.sh

# Initialize database users
echo "Initializing database users..."
if ! ./init-db.sh; then
  echo "Database initialization skipped (users may already exist or root remote access is disabled). Continuing startup..."
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

echo "Starting Gunicorn with Uvicorn workers..."
# --forwarded-allow-ips is set via FORWARDED_ALLOW_IPS so Uvicorn workers
# trust X-Forwarded-For / X-Real-IP headers from the Coolify reverse proxy.
# This ensures rate-limiting and access logs show real client IPs instead of
# the Docker gateway (172.x).
#
# DDoS hardening (2026-07-24):
#   --workers 8             doubled from 4 to handle more concurrent connections
#   --backlog 2048          queue up to 2048 connections at the OS level
#   --timeout 60            reduced from 120 so hung workers recover faster
#   --limit-request-line 4090   drop requests with oversized request lines
#   --limit-request-field_size 8190  drop requests with oversized headers
#   --worker-connections 500     limit concurrent clients per worker
export FORWARDED_ALLOW_IPS='*'
exec gunicorn backend.main:app \
    --workers 8 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 60 \
    --backlog 2048 \
    --limit-request-line 4090 \
    --limit-request-field_size 8190 \
    --worker-connections 500 \
    --access-logformat '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s' \
    --access-logfile -