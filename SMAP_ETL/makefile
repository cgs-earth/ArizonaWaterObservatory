# remove existing data in the iow test bucket and ingest a subset of the smap data
test:
	mc rm -r --force local/iow || true && uv run src/main.py --test-mode