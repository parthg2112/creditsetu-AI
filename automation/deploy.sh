#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

echo "$(date --utc +%FT%TZ): Starting deployment..."

# Pull latest changes
git pull origin main

BUILD_VERSION=$(git rev-parse HEAD)
echo "$(date --utc +%FT%TZ): Releasing new version: $BUILD_VERSION"

# Build and restart services
docker compose up --build -d

echo "$(date --utc +%FT%TZ): Deployment successful."
