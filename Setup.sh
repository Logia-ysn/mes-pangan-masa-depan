#!/bin/bash

# Setup database initial configuration for ERP Pangan Masa Depan
echo "Starting Database Setup..."

# Ensure dependencies are installed (optional, usually done by npm install)
# npm install

# Run Prisma Generation to stay up to date
echo "Generating Prisma Client..."
npx prisma generate

# Run the Moisture Level Seeder
echo "Seeding Moisture Level Configurations (General)..."
npx ts-node seed-moisture-general.ts

echo "Setup Finished Successfully."
