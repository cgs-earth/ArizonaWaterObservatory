deps:
	# Using uv, install all Python dependencies needed for local development and spin up necessary docker services
	uv sync --all-groups --locked

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