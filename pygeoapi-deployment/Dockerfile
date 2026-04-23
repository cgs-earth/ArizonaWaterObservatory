# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

FROM ghcr.io/astral-sh/uv:python3.12-trixie-slim AS builder

# Copy from the cache into container and the use system Python interpreter
# Set no cache to true so we don't use the uv cache but instead use the docker layer cache
# this is since we are not using buildkit and thus cannot cache to a mount dir on the host
ENV UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0 UV_NO_CACHE=true

WORKDIR /opt/pygeoapi

# System dependencies for GDAL and others
RUN apt-get update && apt-get install -y --no-install-recommends libgdal-dev git build-essential \
    && apt-get clean && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy project metadata for dependency resolution
COPY pyproject.toml uv.lock /opt/pygeoapi/

COPY packages /opt/pygeoapi/packages/
# Install all local integrations
# --inexact makes it so the deployment packages we just copied aren't removed
# --no-group makes it so etl code that isn't at runtime is skipped
ENV NUMCODECS_NO_EXTENSION=1

RUN uv sync --no-group etl --all-groups --all-packages

COPY pygeoapi-deployment/ /opt/pygeoapi/pygeoapi-deployment/

COPY pygeoapi.config.yml /opt/pygeoapi/pygeoapi.config.yml

# Set up environment
ENV PATH="/opt/pygeoapi/.venv/bin:$PATH"

# AWO uses a custom event loop; we define the
# import path here
ENV PYGEOAPI_CUSTOM_EVENT_LOOP_MODULE=com.env
ENV PYGEOAPI_CUSTOM_EVENT_LOOP_GETTER=get_loop
ENV PYGEOAPI_CACHE_PLUGINS=true
# Enable redis cache for items/ and collections/ endpoints
ENV PYGEOAPI_FLASK_CACHE_TYPE=REDIS
# AWO Ontology mapping
ENV PYGEOAPI_ONTOLOGY_GRAPH=/opt/pygeoapi/pygeoapi-deployment/ontology.ttl
ENV PYGEOAPI_ONTOLOGY_DEFAULT_PREFIX="http://lincolninst.edu/cgs/vocabularies/asu/awo#"
ENV PYGEOAPI_ONTOLOGY_CONCEPT_SCHEME=:conceptScheme_7a2617b0

# Entrypoint for running the app
ENTRYPOINT [ "/opt/pygeoapi/pygeoapi-deployment/entrypoint.sh" ]
