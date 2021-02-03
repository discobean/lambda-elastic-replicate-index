# This uses npm to install and upgrade packages, nodejs 12.x - nvm use 12

help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/:.*##/:/' | sed 's/^##//g'

local: ## Run locally
	node handler.js

production: ## Deploy with STAGE=prod
	./node_modules/.bin/serverless deploy -v --stage prod

development: ## Deploy with STAGE=dev
	./node_modules/.bin/serverless deploy -v --stage dev

