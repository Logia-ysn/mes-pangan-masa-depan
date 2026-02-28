#!/bin/bash
set -e

APP_DIR="/home/yayang/erp-pangan-masa-depan"
LOG="[DEPLOY $(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG Starting deployment..."
cd "$APP_DIR"

# 1. Pull latest code
echo "$LOG Pulling from GitHub..."
git pull origin main

# 2. Rebuild & restart containers
echo "$LOG Rebuilding containers..."
docker compose up -d --build --remove-orphans

# 3. Jalankan migrasi database jika ada yang baru
echo "$LOG Running database migrations..."
docker compose exec -T naiv npx prisma migrate deploy 2>&1 || true

# 4. Hapus image lama
echo "$LOG Cleaning up..."
docker image prune -f

echo "$LOG Deployment complete!"
docker compose ps
