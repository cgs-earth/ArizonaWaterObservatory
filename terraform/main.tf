# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

provider "google" {
  project = var.project
  region  = var.region
}

terraform {
  required_providers {
    # must have a newish version of the google provider
    # in order to set the max instances on the cloud run instance
    google = {
      source  = "hashicorp/google"
      version = ">= 7.9"
    }
  }
}

resource "google_redis_instance" "redis" {
  name = "redis"
  location_id = var.region
  # minimum memory
  memory_size_gb = 1
  replica_count = 0
  deletion_protection = false
  connect_mode = "DIRECT_PEERING"
  lifecycle {
    prevent_destroy = false
  }
  tier = "BASIC"
}


# Cloud SQL Instance
resource "google_sql_database_instance" "postgis" {
  name             = var.instance_name
  database_version = var.POSTGRES_VERSION
  region           = var.region
  root_password = var.POSTGRES_PASSWORD
  settings {

    tier = "db-f1-micro"
    # There is a bug in gcp where you need to explicitly set this https://github.com/hashicorp/terraform-provider-google/issues/20498
    # otherwise it will default to ENTERPRISE PLUS which is too much for us; ENTERPRISE is the lowest tier
    edition = "ENTERPRISE"
    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled = false
    }

    availability_type = "ZONAL"
    disk_autoresize   = false
    # smallest size possible
    disk_size         = 10
    # cheapest persistent disk type
    disk_type         = "PD_HDD"
  }

  deletion_protection = false
}

resource "google_sql_database" "postgis" {
  name     = var.POSTGRES_DB
  instance = google_sql_database_instance.postgis.name
}

resource "google_sql_user" "postgis" {
  name     = var.POSTGRES_USER
  instance = google_sql_database_instance.postgis.name
  password = var.POSTGRES_PASSWORD
}

resource "google_cloud_run_v2_job" "groundwatersqldumpjob" {
  name     = "groundwatersqldumpjob"
  location = var.region
  template {
    template {
      # 2 hour timeout since sql dump may be large
      timeout = "7200s"
      containers {
        image = "debian:trixie-slim"
        env {
          name  = "PGHOST"
          value = "/cloudsql/${google_sql_database_instance.postgis.connection_name}"
        }
        env {
          name  = "PGUSER"
          value = var.POSTGRES_USER
        }
        env {
          name  = "PGPASSWORD"
          value = var.POSTGRES_PASSWORD
        }
        command = [
          "/bin/bash",
          "-c",
          <<-EOT
            set -e

            apt update
            apt install -y postgresql-client-${local.postgres_version_number} curl
            curl -LO "https://github.com/oras-project/oras/releases/download/v1.3.0/oras_1.3.0_linux_amd64.tar.gz"
            mkdir -p oras-install/
            tar -zxf oras_1.3.0_*.tar.gz -C oras-install/
            ./oras-install/oras pull ghcr.io/cgs-earth/arizona-groundwater-dump:latest

            # in pygeoapi the jobs table needed for the postgresql ogc api process provider is not created by default
            # as such we need to create it manually; we fetch the sql from the pygeoapi repo since this is the file that is used
            # to create the jobs table in the test
            curl --fail --show-error --silent https://raw.githubusercontent.com/geopython/pygeoapi/refs/heads/master/tests/data/postgres_manager_full_structure.backup.sql -o create_jobs_table.sql

            # restore the database dump
            #  --clean --if-exists to drop existing db objects prior to restore without dropping the whole database itself
            # --disable-triggers make it so we don't run hooks on every insert which would slow down the restore; we are 
            #                    restoring from a validated dump so there should be integrity  
            pg_restore --dbname=${var.POSTGRES_DB} --verbose --exit-on-error --disable-triggers --clean --if-exists edr_backup.dump
            psql -d ${var.POSTGRES_DB} -f create_jobs_table.sql
          EOT
        ]
        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.postgis.connection_name]
        }
      }
    }
  }
  deletion_protection = false
}

# The bucket used for storing job results
resource "google_storage_bucket" "bucket" {
  name = "asu-awo-data"
  location = var.region
  force_destroy = true
  storage_class = "STANDARD"
}

resource "google_cloud_run_v2_service" "pygeoapi" {
  name = "pygeoapi"
  location = var.region
  deletion_protection = false 

  ingress = "INGRESS_TRAFFIC_ALL"

  scaling {
    max_instance_count = 8
    min_instance_count = 1
    scaling_mode       = "AUTOMATIC"
  }

  template {

    volumes {
      name = "job-store"
      gcs {
        bucket = "${google_storage_bucket.bucket.name}/job_results"
      }
    }

    containers {
      image = "ghcr.io/cgs-earth/asu-awo-pygeoapi:latest"
      ports {
        container_port = 80
      }
      volume_mounts {
        name       = "job-store"
        mount_path = "/job_results"
      }

      # ideally this would be set here; however, that would make
      # the cloud run service dependent on itself which terraform
      # does not allow; thus this needs to be set manually after deployment
      
      # env {
      #   name= "PYGEOAPI_URL"
      #   value = google_cloud_run_v2_service.pygeoapi.uri
      # }

      env {
        name = "PYGEOAPI_JOB_RESULT_DIR"
        value = "/job_results"
      }

      env {
        name = "TF_VAR_POSTGRES_HOST"
        value = "/cloudsql/${google_sql_database_instance.postgis.connection_name}"
      }

      env {
        name = "TF_VAR_POSTGRES_USER"
        value = var.POSTGRES_USER
      }

      env {
        name = "TF_VAR_POSTGRES_PASSWORD"
        value = var.POSTGRES_PASSWORD
      }

      env {
        name = "TF_VAR_POSTGRES_DB"
        value = var.POSTGRES_DB
      }

      env {
        name = "OTEL_SERVICE_NAME"
        # todo switch this to terraform provisioned value
        value = "awo"
      }

      env {
        name = "REDIS_HOST"
        value = google_redis_instance.redis.host
      }

      resources {
        limits = {
          cpu = "3"
          memory = "7GiB"
        }
        cpu_idle = false
      }
    }
  }

  traffic {
    # all traffic should go to the latest version
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

}

# make pygeoapi publicly accessible
resource "google_cloud_run_service_iam_binding" "pygeoapi_public" {
  location = google_cloud_run_v2_service.pygeoapi.location
  service  = google_cloud_run_v2_service.pygeoapi.name
  role     = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}

resource "null_resource" "run_groundwater_sql_dump_job" {
  # always run the sql restore job; this is since if the job itself or the database was changed
  # the job would need to be rerun; and the database dump itself it coming from an external resource 
  # we can't easily track in terraform so it may need to be refreshed anyways
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      ${local.expanded_gcloud_bin} run jobs execute groundwatersqldumpjob --region=${var.region} --wait
    EOT
  }
  # only run the job once the job itself is loaded in gcp
  depends_on = [google_cloud_run_v2_job.groundwatersqldumpjob]
}
