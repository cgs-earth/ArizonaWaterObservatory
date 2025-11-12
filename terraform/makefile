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
