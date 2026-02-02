#!/bin/sh
# ==================================
# Docker Entrypoint Script
# ==================================
# Script ini dijalankan saat container start
# 1. Tunggu database ready
# 2. Jalankan migrasi database
# 3. Seed admin user
# 4. Start aplikasi
# ==================================

echo "🚀 Starting ERP Pangan Masa Depan..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "📦 Running database migrations..."
npm run migrate || true

# Seed admin user
echo "👤 Seeding admin user..."
npm run seed-admin || true

# Start the application
echo "✅ Starting server..."
exec node dist/index.js
