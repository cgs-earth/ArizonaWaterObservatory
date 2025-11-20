# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

provider "google" {
  project = var.project
  region  = var.region
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
    disk_size         = 10
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
