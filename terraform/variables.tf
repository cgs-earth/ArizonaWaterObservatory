# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

variable "project" {
  description = "the name of the gcp project"
  default = "asu-awo"
}
variable "region" {
  description = "the region in gcp"
  default = "us-south1"
}
variable "instance_name" {
  default = "postgis"
}
variable "POSTGRES_DB" {
  default = "edr"
}
variable "POSTGRES_USER" {
  default = "postgres"
}
variable "POSTGRES_PASSWORD" {
  sensitive = true
}

variable "POSTGRES_VERSION" {
  default = "POSTGRES_17"
}

variable "gcloud_binary" {
  description = "Path to the gcloud binary (can use ~)"
  default     = "~/google-cloud-sdk/bin/gcloud"
}

locals {
  # gcloud may not be in the system path and thus needs to be expanded to an absolute path
  expanded_gcloud_bin = pathexpand(var.gcloud_binary)
  # extract the version number from the postgres version
  postgres_version_number = replace(var.POSTGRES_VERSION, "POSTGRES_", "")
}
