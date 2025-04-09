SHELL := /bin/bash

.PHONY: test/db/start
test/db/start:
	@docker run -d --rm --name scit-postgres -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword postgres:16
	@timeout 90s bash -c "until docker exec scit-postgres pg_isready ; do sleep 1 ; done"
	@PGDATABASE=postgres PGUSER=postgres PGPASSWORD=mysecretpassword PGHOST=localhost PGPORT=5432 python manage.py migrate

.PHONY: test/db/stop
test/db/stop:
	@docker kill scit-postgres

.PHONY: test
test:
	@COPILOT_ENVIRONMENT_NAME=test PGDATABASE=postgres PGUSER=postgres PGPASSWORD=mysecretpassword PGHOST=localhost PGPORT=5432 pytest

.PHONY: test/ci
test/ci:
	@COPILOT_ENVIRONMENT_NAME=test pytest

.PHONY: init
init:
	export COPILOT_ENVIRONMENT_NAME=build
	npm ci
	npm run build
	npm run sass:build
	mkdir -p scl/static/static
	cp -r scl/core/static scl/static/static
	cp -r node_modules/govuk-frontend/dist/govuk/assets/* scl/static/static
	cp -r node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.* scl/static/static
	python manage.py collectstatic
