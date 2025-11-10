# needed for oras to cache assets and skip re-downloading
export ORAS_CACHE=$(HOME)/.oras/cache

apply:
	# 	source the .env file so that we know the password that is going to be used
	source ../.env && terraform apply
