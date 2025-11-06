#!/bin/bash
# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

set -e  # stop on first error

# Load environment variables
source ../.env

# Start Cloud SQL Auth Proxy in the background
echo "Starting Cloud SQL Auth Proxy..."
cloud-sql-proxy asu-awo:us-south1:postgis --port=5432 &
PROXY_PID=$!

# Wait a few seconds to ensure proxy is ready
sleep 3

# Run pg_restore through the local proxy
echo "Running pg_restore..."
set "PGPASSWORD=$TF_VAR_POSTGRES_PASSWORD"
pg_restore \
  --host=127.0.0.1 \
  --port=5432 \
  --username="$TF_VAR_POSTGRES_USER" \
  --dbname="$TF_VAR_POSTGRES_TABLE" \
  --verbose \
  edr_backup.dump

# Clean up proxy after restore completes
echo "Stopping Cloud SQL Auth Proxy..."
kill $PROXY_PID
wait $PROXY_PID 2>/dev/null || true

echo "Restore completed successfully."
