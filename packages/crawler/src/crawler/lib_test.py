# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from pathlib import Path

import pytest
from testcontainers.minio import MinioContainer
import xarray as xr

from crawler.lib import (
    add_shapefile_info_to_dataset,
    get_adwr_link,
    upload_xlsx_to_s3,
    xlsx_to_xarray,
)


def test_find_link():
    with pytest.raises(RuntimeError):
        get_adwr_link("dummy")

    text = r"""<a data-entity-substitution="file" data-entity-type="file" data-entity-uuid="16a4abe5-b765-4c1e-9adf-55a4a6fcb947" href="/sites/default/files/zip/GWSI_ZIP_20250714.zip" style="color:#a00;">Groundwater Site Inventory</a>"""
    assert (
        get_adwr_link(text) == "/sites/default/files/zip/GWSI_ZIP_20250714.zip"
    )


def test_read_xlsx_as_xarray():
    path = (
        Path(__file__).parent / "testdata" / "GWSI_WW_LEVELS_abbreviated.xlsx"
    )
    result = xlsx_to_xarray(path)
    assert result
    assert len(result.dims) == 3
    assert result.dims.get("WLWA_SITE_WELL_SITE_ID")


def test_xlsx_to_s3():
    with MinioContainer() as minio:
        conf = minio.get_config()
        client = minio.get_client()
        client.make_bucket("testbucket")

        endpoint = f"http://{conf['endpoint']}"
        upload_xlsx_to_s3(
            Path(__file__).parent
            / "testdata"
            / "GWSI_WW_LEVELS_abbreviated.xlsx",
            "testbucket",
            conf["access_key"],
            conf["secret_key"],
            endpoint,
        )

        ds = xr.open_zarr(
            "s3://testbucket/GWSI_WW_LEVELS_abbreviated.zarr",
            storage_options={
                "key": conf["access_key"],
                "secret": conf["secret_key"],
                "client_kwargs": {"endpoint_url": endpoint},
            },
        )
        assert "WLWA_SITE_WELL_SITE_ID" in ds.variables


def test_add_shapefile():
    path = (
        Path(__file__).parent / "testdata" / "GWSI_WW_LEVELS_abbreviated.xlsx"
    )
    dataset = xlsx_to_xarray(path)

    add_shapefile_info_to_dataset(
        Path(__file__).parent
        / "defs"
        / "assets"
        / "GWSI_ZIP_20250714"
        / "Shape",
        dataset,
        path.name,
    )
