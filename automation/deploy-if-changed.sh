#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

echo "$(date --utc +%FT%TZ): Fetching remote repository..."
git fetch origin main

UPSTREAM='@{u}'
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "$(date --utc +%FT%TZ): No changes detected in git."
elif [ "$LOCAL" = "$BASE" ]; then
    echo "$(date --utc +%FT%TZ): Changes detected, deploying new version..."
    ./automation/deploy.sh
elif [ "$REMOTE" = "$BASE" ]; then
    echo "$(date --utc +%FT%TZ): Local changes detected, stashing and deploying..."
    git stash
    ./automation/deploy.sh
else
    echo "$(date --utc +%FT%TZ): Git is diverged, this is unexpected."
    exit 1
fi
