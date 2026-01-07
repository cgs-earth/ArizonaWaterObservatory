#!/bin/sh
# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

set -e

# This script will restore the database from the backup
# and create the jobs table that is necessary for the postgres
# job manager in pygeoapi
# this is mainly just for local testing

# set the cwd to this script's directory
cd "$(dirname "$0")"

# prompt if you want to download the backup; if yes then download; else no 

read -p "Do you want to download a new backup? (y/n) " -n 1 -r
echo    
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Downloading backup"
  oras pull ghcr.io/cgs-earth/arizona-groundwater-dump:latest
fi

export PGPASSWORD="changeMe"


psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS edr;"
psql -h localhost -U postgres -c "CREATE DATABASE edr;"

echo "Restoring database"
pg_restore \
  -h localhost \
  -U postgres \
  -d edr \
  -j 8 \
  edr_backup.dump

echo "Database restored. Creating jobs table"
psql -h localhost -U postgres -d edr -f jobs.sql
echo "Done"

