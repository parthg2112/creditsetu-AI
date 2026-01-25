#!/bin/bash

# Configuration
PROJECT_DIR="/home/pablo/creditsetu-AI"
LOCK_FILE="/tmp/deploy-creditsetu.lock"

# Ensure we are in the right directory
cd "$PROJECT_DIR"

# Use flock to ensure only one instance runs
(
  flock -n 200 || { echo "Another deployment is already in progress. Exiting."; exit 1; }
  
  echo "$(date --utc +%FT%TZ): Lock acquired. Running deployment check..."
  ./automation/deploy-if-changed.sh
  
) 200>"$LOCK_FILE"
