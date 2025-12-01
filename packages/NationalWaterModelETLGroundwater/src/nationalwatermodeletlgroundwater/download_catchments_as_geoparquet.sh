#!/bin/bash
# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

# A simple script for downloading NHDPlusV21_CatchmentSP.parquet
# We usse the version hosted from the epa website since that
# link is explicitly referenced by the USGS

wget https://dmap-data-commons-ow.s3.amazonaws.com/NHDPlusV21/Data/NationalData/NHDPlusV21_NationalData_Seamless_Geodatabase_Lower48_07.7z

unzip NHDPlusV21_NationalData_Seamless_Geodatabase_Lower48_07.7z

cd NHDPlusV21_NationalData_Seamless_Geodatabase_Lower48_07/

ogr2ogr -f "Parquet" NHDPlusV21_CatchmentSP.parquet NHDPlusV21_National_Seamless_Flattened_Lower48.gdb/ CatchmentSP