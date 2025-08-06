# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from crawler.defs.assets.lib import get_adwr_link
import pytest


def test_find_link():
    with pytest.raises(RuntimeError):
        get_adwr_link("dummy")

    text = r"""<a data-entity-substitution="file" data-entity-type="file" data-entity-uuid="16a4abe5-b765-4c1e-9adf-55a4a6fcb947" href="/sites/default/files/zip/GWSI_ZIP_20250714.zip" style="color:#a00;">Groundwater Site Inventory</a>"""
    assert get_adwr_link(text) == "/sites/default/files/zip/GWSI_ZIP_20250714.zip"
