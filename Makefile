# This uses npm to install and upgrade packages, nodejs 12.x - nvm use 12

# test locally
local:
	node handler.js

production:
	./node_modules/.bin/serverless deploy -v --stage prod

development:
	./node_modules/.bin/serverless deploy -v --stage dev
