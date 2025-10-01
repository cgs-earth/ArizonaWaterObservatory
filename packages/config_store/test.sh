#!/bin/bash
# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0
RESPONSE=$(curl -X POST "http://localhost:5005/processes/config-store/execution?f=json" \
        -H "Content-Type: application/json" \
        -d '{"inputs": {"name": "test_config"}}')

ID=$(echo "$RESPONSE" | jq -r '.id')

echo "Response: $RESPONSE"
curl -X GET "http://localhost:5005/jobs/$ID/results?f=json"

