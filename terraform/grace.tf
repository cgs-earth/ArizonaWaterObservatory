# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

resource "google_storage_bucket" "grace_data_bucket" {
  name = "grace_data_bucket"
  location = var.region
  force_destroy = true
  storage_class = "STANDARD"
}

resource "google_service_account" "grace_data_bucket_account" {
  account_id = "grace-data-bucket-account"
  display_name = "grace-data-bucket-account"
}

resource "google_storage_bucket_iam_member" "write_access" {
  bucket = google_storage_bucket.grace_data_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.grace_data_bucket_account.email}"
}

resource "google_cloud_run_v2_job" "gracedownloadjob" {
  name     = "gracedownloadjob"
  location = var.region
  template {
    template {
    service_account = google_service_account.grace_data_bucket_account.email
      # 18 hour timeout since the first time you download the data, there will be 
      # a significant amount of network io with zarr conversion against a remote object store
      # in the follow up crawls, it should be significantly faster
      timeout = "64800s"
      containers {
        image = "ghcr.io/cgs-earth/asu-awo-grace-etl:latest"
        env {
          name = "S3_BUCKET"
          value = google_storage_bucket.grace_data_bucket.name
        }
        # We don't need to set these since the service account already has access
        # env {
        #   name = "S3_ACCESS_KEY"
        #   value = google_service_account.grace_data_bucket_account.email
        # }
        # env {
        #   name = "S3_SECRET_KEY"
        #   value = google_service_account.grace_data_bucket_account.private_key
        # }
        env {
          name = "S3_ENDPOINT"
          value = "https://storage.googleapis.com"
        }
      }
    }
  }
  deletion_protection = false
}