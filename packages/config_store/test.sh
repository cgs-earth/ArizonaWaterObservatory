#!/bin/bash
# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

curl -X POST "http://localhost:5005/processes/config-store/execution?f=json" \
        -H "Content-Type: application/json" \
        -d '{"inputs": {"action": "store", "config": {
                "name": "test"
            }}}'
