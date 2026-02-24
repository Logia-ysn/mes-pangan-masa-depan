#!/bin/bash

# ERP Pangan Masa Depan - Deployment Script
# v2.23.0

echo "🚀 Starting Deployment Process..."

# 1. Frontend Build Verification
echo "📦 Verifying Frontend Build..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend Build Failed. Deployment Aborted."
    exit 1
fi
cd ..

# 2. Git Automation
echo "git adding changes..."
git add .

echo "💾 Committing changes..."
# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git commit -m "chore: deployment v2.23.0 - worksheet workflow & production refactor"

echo "📤 Pushing to GitHub ($BRANCH)..."
git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo "✅ Deployment Successful! Changes are being processed by Railway & Vercel."
else
    echo "❌ Push Failed. Please check your connection or git configuration."
    exit 1
fi
