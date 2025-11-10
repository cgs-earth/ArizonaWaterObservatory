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

resource "google_cloud_run_v2_job" "groundwatersqldumpjob" {
  name     = "groundwatersqldumpjob"
  location = var.region

  template {
    template {
      containers {
        image = "debian:trixie-slim"
        env {
          name  = "PGHOST"
          value = "/cloudsql/${google_sql_database_instance.postgis.connection_name}"
        }
        env {
          name  = "PGDATABASE"
          value = var.POSTGRES_TABLE
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
            apt update
            apt install -y postgresql-client-${local.postgres_version_number} curl
            curl -LO "https://github.com/oras-project/oras/releases/download/v1.3.0/oras_1.3.0_linux_amd64.tar.gz"
            mkdir -p oras-install/
            tar -zxf oras_1.3.0_*.tar.gz -C oras-install/
            ./oras-install/oras pull ghcr.io/cgs-earth/arizona-groundwater-dump:latest

            pg_restore --host=/cloudsql/${google_sql_database_instance.postgis.connection_name} --username=${var.POSTGRES_USER} --dbname=${var.POSTGRES_TABLE} --verbose edr_backup.dump
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
  provisioner "local-exec" {
    command = <<-EOT
      ${local.expanded_gcloud_bin} run jobs execute groundwatersqldumpjob --region=${var.region}
    EOT
  }

  depends_on = [google_cloud_run_v2_job.groundwatersqldumpjob]
}
