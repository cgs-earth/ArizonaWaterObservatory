# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0


from main import main
from minio import Minio
import pytest
from testcontainers.minio import MinioContainer


@pytest.fixture(scope="module")
def minio_container():
    """Start a temporary MinIO container for testing real uploads."""
    with MinioContainer(
        "minio/minio:latest",
        access_key="testaccess",
        secret_key="testsecret",
    ) as mc:
        mc.start()
        # get_exposed_port returns the mapped port on localhost
        port = mc.get_exposed_port(9000)
        endpoint = f"localhost:{port}"  # only one scheme, no double http://
        yield {
            "endpoint": endpoint,
            "access_key": "testaccess",
            "secret_key": "testsecret",
            "bucket": "testbucket",
        }


def test_main_integration(minio_container):
    """
    Integration test for main() using real NASA GRACE data.
    Uploads GeoTIFFs to a temporary MinIO container.
    """

    access_key = minio_container["access_key"]
    secret_key = minio_container["secret_key"]
    endpoint = minio_container["endpoint"]
    bucket = minio_container["bucket"]

    print(f"Posting data to minio at {endpoint}")

    # Run main function (real download + upload)
    # Set insecure=True because testcontainers MinIO uses HTTP
    main(
        access_key=access_key,
        secret_key=secret_key,
        endpoint=endpoint,
        bucket=bucket,
        test_mode=True,
        s3_store_path=f"{bucket}/grace_data.zarr",
    )

    # Connect to MinIO to verify at least one file was uploaded
    client = Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=False,
    )

    # List objects in the bucket
    objects = list(client.list_objects(bucket, recursive=True))
    assert len(objects) > 0, "No files were uploaded to MinIO"

    # Check the first object for correct structure
    first_obj = objects[0]

    obj_name = first_obj.object_name
    assert obj_name
    # Expected path structure: PARAMETER/DATE/data.tif
    parts = obj_name.split("/")
    assert parts[-1] == "data.tif"
    assert len(parts) == 3, f"Unexpected folder structure: {obj_name}"

    # Read a small sample of content
    obj = client.get_object(bucket, obj_name)
    content = obj.read(1024)  # read first KB
    obj.close()
    obj.release_conn()
    assert len(content) > 0, "Uploaded file is empty"
