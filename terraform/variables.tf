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
variable "POSTGRES_TABLE" {
  default = "edr"
}
variable "POSTGRES_USER" {
  default = "postgres"
}
variable "POSTGRES_PASSWORD" {
  sensitive = true
}

variable "gcloud_binary" {
  description = "Path to the gcloud binary (can use ~)"
  default     = "~/google-cloud-sdk/bin/gcloud"
}

locals {
  expanded_gcloud_bin = pathexpand(var.gcloud_binary)
}
