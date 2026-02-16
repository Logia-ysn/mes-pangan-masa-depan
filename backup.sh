#!/bin/bash

# Configuration
PROJECT_DIR="/Users/yay/Project/erp-pangan-masa-depan"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_erp_${TIMESTAMP}.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Navigate to project directory
cd "$PROJECT_DIR" || exit

# Create tarball excluding heavy folders
echo "Creating backup: $BACKUP_DIR/$BACKUP_FILE"
tar --exclude='node_modules' \
    --exclude='frontend/node_modules' \
    --exclude='dist' \
    --exclude='frontend/dist' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='uploads' \
    -czf "$BACKUP_DIR/$BACKUP_FILE" .

echo "Backup completed successfully!"
ls -lh "$BACKUP_DIR/$BACKUP_FILE"
