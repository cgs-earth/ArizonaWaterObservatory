# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

provider "google" {
  project = var.project
  region  = var.region
}

# Cloud SQL Instance
resource "google_sql_database_instance" "postgis" {
  name             = var.instance_name
  database_version = "POSTGRES_17"
  region           = var.region

  settings {

    tier = "db-f1-micro"
    # There is a bug in gcp where you need to explicitly set this https://github.com/hashicorp/terraform-provider-google/issues/20498
    # otherwise it will default to ENTERPRISE PLUS which is too much for us; ENTERPRISE is the lowest tier
    edition  = "ENTERPRISE"
    ip_configuration {
      # We will use Cloud SQL Auth Proxy or gcloud sql connect
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

# Database
resource "google_sql_database" "postgis_db" {
  name     = var.POSTGRES_TABLE
  instance = google_sql_database_instance.postgis.name
}

# User
resource "google_sql_user" "postgis_user" {
  name     = var.POSTGRES_USER
  instance = google_sql_database_instance.postgis.name
  password = var.POSTGRES_PASSWORD
}


