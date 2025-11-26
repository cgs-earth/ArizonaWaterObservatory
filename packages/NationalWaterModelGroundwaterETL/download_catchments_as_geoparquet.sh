#!/bin/bash
# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

wget https://dmap-data-commons-ow.s3.amazonaws.com/NHDPlusV21/Data/NationalData/NHDPlusV21_NationalData_Seamless_Geodatabase_Lower48_07.7z

unzip NHDPlusV21_NationalData_Seamless_Geodatabase_Lower48_07.7z

cd NHDPlusV21_NationalData_Seamless_Geodatabase_Lower48_07/

ogr2ogr -f "Parquet" NHDPlusV21_CatchmentSP.parquet NHDPlusV21_National_Seamless_Flattened_Lower48.gdb/ CatchmentSP