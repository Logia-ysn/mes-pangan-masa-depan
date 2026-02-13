#!/bin/sh
# ==================================
# Docker Entrypoint Script
# ==================================
# 1. Wait for database to be ready
# 2. Run Prisma migrations
# 3. Seed admin user
# 4. Start application
# ==================================

set -e

echo "Starting ERP Pangan Masa Depan..."

# Wait for database to be ready (active polling instead of blind sleep)
echo "Waiting for database..."
MAX_RETRIES=30
RETRY_COUNT=0
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database not ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Database not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done
echo "Database is ready."

# Run Prisma migrations - fail loudly if this fails
echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "ERROR: Database migration failed. Check your schema and DATABASE_URL."
  exit 1
}

# Seed admin user (non-critical, continue if fails)
echo "Seeding admin user..."
npm run seed-admin || echo "WARNING: Admin seed failed (may already exist)."

# Start the application with graceful shutdown support
echo "Starting server..."
exec node dist/index.js
