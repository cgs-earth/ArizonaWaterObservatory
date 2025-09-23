precommit:
	pre-commit install
	pre-commit run 

check:
	uv run ruff check && uv run pyright && cd packages/crawler && dg check defs --verbose

dev:
	uv run pygeoapi openapi generate pygeoapi-deployment/pygeoapi.config.yml --output-file pygeoapi-deployment/local.openapi.yml
	PYGEOAPI_CONFIG=pygeoapi-deployment/pygeoapi.config.yml PYGEOAPI_OPENAPI=pygeoapi-deployment/local.openapi.yml uv run pygeoapi serve --starlette

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