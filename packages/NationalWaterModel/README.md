An integration for the NOAA national water model dataset

To determine which variables are available, you can use ``zarrdump` like the following

```
uvx --with requests --with aiohttp zarrdump "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com/CONUS/zarr/chrtout.zarr/"
```