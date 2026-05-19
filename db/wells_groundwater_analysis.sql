-- Copyright 2026 Lincoln Institute of Land Policy
-- SPDX-License-Identifier: Apache-2.0

-- Make the tables for groundwater analysis always fresh so that the data is always up to date
DROP TABLE IF EXISTS edr_quickstart.yearly_index_well_depths;
DROP TABLE IF EXISTS edr_quickstart.index_well_locations;
DROP TABLE IF EXISTS edr_quickstart.index_well_parameter_info;


-- Create a table for just index wells
CREATE TABLE edr_quickstart.index_well_locations AS
SELECT
    location_id,
    geometry,
    properties
FROM edr_quickstart.locations
WHERE properties->>'WELL_TYPE' = 'INDEX';

-- Ensure the location_id is a primary key for sanity / joining
ALTER TABLE edr_quickstart.index_well_locations
ADD PRIMARY KEY (location_id);

-- Create a table for just index well parameter info
CREATE TABLE edr_quickstart.index_well_parameter_info (
    parameter_id          TEXT PRIMARY KEY,
    parameter_name        TEXT,
    unit                  TEXT,
    parameter_description TEXT
);

-- Insert a special parameter for groundwater median depth
-- this is since in the original data there is not one good parameter for
-- groundwater depth and there are two parameters for groundwater depth; 
-- so we need to aggregate and create a new one
INSERT INTO edr_quickstart.index_well_parameter_info (
    parameter_id,
    parameter_name,
    unit,
    parameter_description
)
VALUES (
    'GROUNDWATER_MEDIAN_DEPTH',
    'GROUNDWATER_MEDIAN_DEPTH',
    'ft',
    'Median annual groundwater depth-to-water derived from DEPTH_TO_WATER and WLWA_DEPTH_TO_WATER observations for INDEX wells.'
);


CREATE TABLE edr_quickstart.yearly_index_well_depths AS
WITH combined AS (
    SELECT
        o.location_id,
        DATE_TRUNC('year', o.observation_time) AS year,
        o.observation_value
    FROM edr_quickstart.observations o
    JOIN edr_quickstart.index_well_locations iw
        ON o.location_id = iw.location_id
    WHERE o.parameter_id IN (
        'DEPTH_TO_WATER',
        'WLWA_DEPTH_TO_WATER'
    )
    -- don't include NULL values in the media
      AND o.observation_value IS NOT NULL
)

SELECT
    location_id,
    'GROUNDWATER_MEDIAN_DEPTH'::TEXT AS parameter_id,
    year,
    -- this is equivalent to the median of DEPTH_TO_WATER and WLWA_DEPTH_TO_WATER
    -- within each year since we are grouping by year
    PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY observation_value
    ) AS median_depth_to_water,
    COUNT(*) AS n_observations
FROM combined
GROUP BY location_id, year
ORDER BY location_id, year;

-- Set up key relationships so pgedr can join on them
ALTER TABLE edr_quickstart.yearly_index_well_depths
ADD CONSTRAINT fk_index_well_location
FOREIGN KEY (location_id)
REFERENCES edr_quickstart.index_well_locations(location_id);

ALTER TABLE edr_quickstart.yearly_index_well_depths
ADD CONSTRAINT fk_parameter_info
FOREIGN KEY (parameter_id)
REFERENCES edr_quickstart.index_well_parameter_info(parameter_id);