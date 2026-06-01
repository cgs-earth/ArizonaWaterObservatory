#!/bin/bash
# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f GWS.csv ]; then
    echo "GWS.csv not found; you must download the source data for this script to work"
    exit 1
fi

if [ -z "${PGPASSWORD:-}" ]; then
    read -s -p "Postgres password: " PGPASSWORD
    echo
    export PGPASSWORD
fi

curl -s "https://reference.geoconnex.us/collections/hu02/items/15?f=json" \
    | jq '{type:"FeatureCollection",features:[.]}' \
    > /tmp/lower_colorado_river_basin.geojson

ogr2ogr \
    -f PostgreSQL \
    PG:"host=127.0.0.1 port=5432 dbname=edr user=postgres password=${PGPASSWORD}" \
    /tmp/lower_colorado_river_basin.geojson \
    -nln edr_quickstart.lower_colorado_river_basin_asu_grace \
    -lco GEOMETRY_NAME=geom \
    -nlt PROMOTE_TO_MULTI \
    -makevalid \
    -overwrite

psql -h 127.0.0.1 -U postgres -d edr <<'SQL'

-- 1. Spatial table

-- ensure the id is an integer so we can join on it in the observations table
ALTER TABLE edr_quickstart.lower_colorado_river_basin_asu_grace
ALTER COLUMN id TYPE INTEGER
USING id::INTEGER;

-- drop the datasets column since it is geoconnex related and we don't need it (adds a lot of noise)
ALTER TABLE edr_quickstart.lower_colorado_river_basin_asu_grace
DROP COLUMN datasets;
-- drop the loaddate column since it isn't relevant to this integration
ALTER TABLE edr_quickstart.lower_colorado_river_basin_asu_grace
DROP COLUMN loaddate;


-- 2. Parameter metadata table

DROP TABLE IF EXISTS edr_quickstart.asu_grace_parameter_info;

CREATE TABLE edr_quickstart.asu_grace_parameter_info (
    parameter_id          TEXT PRIMARY KEY,
    parameter_name        TEXT,
    unit                  TEXT,
    parameter_description TEXT
);

INSERT INTO edr_quickstart.asu_grace_parameter_info (
    parameter_id,
    parameter_name,
    unit,
    parameter_description
)
VALUES (
    'AVERAGE_GROUNDWATER_STORAGE_VARIATION',
    'AVERAGE_GROUNDWATER_STORAGE_VARIATION',
    'Km3',
    'Monthly nonseasonal variations in groundwater storage averaged over the Lower Colorado River Basin'
);

-- 3. Observations table 

DROP TABLE IF EXISTS edr_quickstart.asu_grace_observations;

CREATE TABLE edr_quickstart.asu_grace_observations (
    observation_date TEXT,
    value       NUMERIC
);

\copy edr_quickstart.asu_grace_observations FROM 'GWS.csv' CSV HEADER;

ALTER TABLE edr_quickstart.asu_grace_observations
    ADD COLUMN parameter_id TEXT;

UPDATE edr_quickstart.asu_grace_observations
SET parameter_id = 'AVERAGE_GROUNDWATER_STORAGE_VARIATION';

ALTER TABLE edr_quickstart.asu_grace_observations
ADD COLUMN id BIGSERIAL;

ALTER TABLE edr_quickstart.asu_grace_observations
ADD PRIMARY KEY (id);

ALTER TABLE edr_quickstart.asu_grace_observations
ADD COLUMN location_id INTEGER;

UPDATE edr_quickstart.asu_grace_observations
SET location_id = 15;
SQL