# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from html.parser import HTMLParser


class TopLevelFolderParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_link = False
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "table" and attrs.get("id") == "folder-table":
            self.in_table = True
        if self.in_table and tag == "a" and "href" in attrs:
            self.in_link = True
            self.current_href = attrs["href"]

    def handle_data(self, data):
        if self.in_link:
            self.links.append(
                {"text": data.strip(), "href": self.current_href}
            )

    def handle_endtag(self, tag):
        if tag == "a" and self.in_link:
            self.in_link = False
        if tag == "table" and self.in_table:
            self.in_table = False


class FileParser(HTMLParser):
    """Extract all GeoTIFF (.tif) links from the file table"""

    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_link = False
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "table" and attrs.get("id") == "file-table":
            self.in_table = True
        if self.in_table and tag == "a" and "href" in attrs:
            href = attrs["href"]
            assert href
            if href.lower().endswith(".tif"):  # only keep GeoTIFFs
                self.links.append(href)

    def handle_endtag(self, tag):
        if tag == "table" and self.in_table:
            self.in_table = False
