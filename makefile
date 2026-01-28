export UV_ENV_FILE=.env

precommit:
	pre-commit install
	pre-commit run 

check:
	uv run ruff check && uv run pyright && cd packages/crawler && dg check defs --verbose

dev:
	test -f local.openapi.yml || uv run pygeoapi openapi generate pygeoapi.config.yml --output-file local.openapi.yml
	PYGEOAPI_CONFIG=pygeoapi.config.yml PYGEOAPI_OPENAPI=local.openapi.yml uv run pygeoapi serve

deps:
	# Using uv, install all Python dependencies needed for local development and spin up necessary docker services
	uv sync --all-groups --all-packages

test:
	# Run pyright to validate types, then spin up pydist with xdist to run tests in parallel
	uv run pyright && uv run pytest -n 20 -x --maxfail=1 -vv --durations=5

cov:
	# Run pytest with coverage and output the results to stdout
	uv run pytest -n 20 -x --maxfail=1 -vv --durations=5 --cov

clean:
	# Remove artfiacts from local dagster runs, tests, or python installs
	rm -f .coverage
	rm -f coverage.xml
	rm -rf htmlcov
	rm -rf storage
	rm -rf .logs_queue
	rm -rf .venv/

# To pull the latest groundwater data and restore it into the db
# you can run the following
restore_db_dump_locally:
	./db/restore.sh

# If you wish to query the production db you can use the following
proxy_db:
	cloud-sql-proxy asu-awo:us-south1:postgis --port=5432

# For adwr we ocassionally update the data. since it is not a crawl
# and is a manual download we also have to do a manual update with a command
# like this and put it in the yml
adwr_wells_temporal_extent:
	psql "host=127.0.0.1 port=5432 dbname=edr user=postgres" -t -A -c \
	"SELECT TO_CHAR(MIN(observation_time AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS earliest_observation_utc, TO_CHAR(MAX(observation_time AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS latest_observation_utc FROM edr_quickstart.observations;"
