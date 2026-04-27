#!/bin/bash
# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

# Run POST and capture headers + body in variables
RESPONSE=$(curl -s -D - -o >(cat >&2) \
  -X POST "http://localhost:5005/processes/config-store/execution?f=json" \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"name": "test_config"}}')

printf "%s" "$RESPONSE" 

# Extract job URL from Location header
JOB_URL=$(printf "%s" "$RESPONSE" | grep -i '^location:' | awk '{print $2}' | tr -d '\r')

# ensure Access-Control-Expose-Headers is set
EXPOSE_HEADERS=$(printf "%s" "$RESPONSE" | grep -i '^access-control-expose-headers:' | awk '{print $2}' | tr -d '\r')
if [ -z "$EXPOSE_HEADERS" ]; then
    echo "Access-Control-Expose-Headers not found in headers!"
    exit 1
fi

if [ -z "$JOB_URL" ]; then
    echo "No job URL found in headers!"
    exit 1
fi

echo "Job submitted. URL: $JOB_URL"

echo "Fetching job details..."
curl -s "$JOB_URL/results?f=json" | jq .
