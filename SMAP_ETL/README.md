# SMAP ETL

This directory contains all logic for ingesting SMAP data into the AWO object store in zarr format. It is very similar to the process for ingesting GRACE data.

This workflow should be ran on a schedule at least once a day to ensure that the latest data is present. There is checkpoint metadata uploaded and stored within the JSON file `stored_smap_files.json` to ensure that old data is not re-downloaded and re-uploaded. 

In order to use this workflow within gcp, you must set the following variables either as CLI arguments or env variables. 

- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_ENDPOINT`
- `EARTHDATA_USERNAME`
- `EARTHDATA_PASSWORD`

To get an earthdata username and password, go to https://urs.earthdata.nasa.gov/home and sign up for an account. You can also use an access token and instead set the variable `EARTHDATA_TOKEN` but this will be reset every 60 days without a way to programmatically refresh it (as far as I can tell), so it is best to use a username and password.

To run the workflow you can run the container `ghcr.io/cgs-earth/asu-awo-smap-etl:latest` which is built from the [Dockerfile](Dockerfile) in this directory and uploaded with the [github actions workflow](../.github/workflows/push_smap_workflow.yml). We also have a [cloudbuild workflow](./cloudbuild.yaml) set up to push the same container to GCP. This is only since cloud run jobs require a container hosted on GCP.

## Setting up the workflow in GCP

`S3_ENDPOINT=storage.googleapis.com` (Note that you must not set the protocol i.e. not http/https at the start)
`S3_BUCKET=your-bucket-name`

To retrieve the values for `S3_ACCESS_KEY` and `S3_SECRET_KEY`, create a bucket then go into `settings` -> `interoperability` -> `Access keys for your user account`. Then select the user account that should perform the etl upload operations, and copy the values for `Access Key` and `Secret`. 

![gcp](docs/gcp.png)