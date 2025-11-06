# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

# Outputs
output "postgres_connection_name" {
  value = google_sql_database_instance.postgis.connection_name
}

output "postgres_connection_ip" {
  sensitive = true
  value = google_sql_database_instance.postgis.ip_address
}