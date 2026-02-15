#!/bin/bash

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ROOT="backups"
BACKUP_NAME="full_v2.6.0_factory_filter_$TIMESTAMP"
BACKUP_DIR="$BACKUP_ROOT/$BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup in: $BACKUP_DIR"

# 1. Database Backup
echo "🗄️  Backing up database..."
source .env 2>/dev/null

if command -v pg_dump &> /dev/null; then
    # Try local pg_dump
    if pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql" 2>/dev/null; then
        echo "✅ Database backup successful (local pg_dump)"
    else
        echo "⚠️  Local pg_dump failed. Trying Docker..."
        # Fallback to Docker
        CONTAINER=$(docker ps -qf "name=erp_pangan_db")
        if [ -n "$CONTAINER" ]; then
            docker exec "$CONTAINER" pg_dump -U postgres erp_pangan_masa_depan > "$BACKUP_DIR/database.sql"
            echo "✅ Database backup successful (Docker)"
        else
            echo "❌ Failed to backup database: No running container or pg_dump access."
        fi
    fi
else
    # Try Docker directly
    CONTAINER=$(docker ps -qf "name=erp_pangan_db")
    if [ -n "$CONTAINER" ]; then
        docker exec "$CONTAINER" pg_dump -U postgres erp_pangan_masa_depan > "$BACKUP_DIR/database.sql"
        echo "✅ Database backup successful (Docker)"
    else
        echo "❌ Failed to backup database: pg_dump not installed and no Docker container found."
    fi
fi

# 2. Source Code Backup
echo "Cw  Zipping source code..."
# Use tar as it's more universally available on Unix-like systems
tar -czf "$BACKUP_DIR/source_code.tar.gz" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude=".git" \
    --exclude=".next" \
    --exclude="backups" \
    --exclude="frontend/node_modules" \
    --exclude="frontend/dist" \
    .

echo "✅ Source code archived: source_code.tar.gz"
echo "🎉 Backup complete!"
