# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from pathlib import Path

import pytest
import s3fs
from testcontainers.minio import MinioContainer

from crawler.lib import get_adwr_link, upload_dataset_to_s3, xlsx_to_xarray


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
    assert xlsx_to_xarray(path)


def test_xlsx_to_s3():
    with MinioContainer() as minio:
        conf = minio.get_config()
        client = minio.get_client()
        upload_dataset_to_s3(
            Path(__file__).parent
            / "testdata"
            / "GWSI_WW_LEVELS_abbreviated.xlsx",
            s3fs.S3FileSystem(
                endpoint_url="s3://" + conf["endpoint"],
                key=conf["access_key"],
                secret=conf["secret_key"],
            ),
        )
