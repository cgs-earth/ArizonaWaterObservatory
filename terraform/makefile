# needed for oras to cache assets and skip re-downloading
export ORAS_CACHE=$(HOME)/.oras/cache

# for terraform to use the env vars they need to be 
# exported into a subshell
export_env = set -a; source ../.env; set +a;

apply:
	@$(export_env) terraform apply

plan:
	@$(export_env) terraform plan

destroy:
	@$(export_env) terraform destroy

# this is used when the terraform state has not changed but
# we want to run the specific job for updating the database dump
# i.e. there was some sort of artifact that we can pull
update_db_dump:
	@$(export_env) terraform apply -target=null_resource.run_groundwater_sql_dump_job
