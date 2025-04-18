SHELL := /bin/bash

docker-e2e = docker compose -f compose.yaml -f compose.e2e.yaml

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
	@COPILOT_ENVIRONMENT_NAME=test PGDATABASE=postgres PGUSER=postgres PGPASSWORD=mysecretpassword PGHOST=localhost PGPORT=5432 pytest --cov --cov-report html:htmlcov

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

# DEV
.PHONY: dev/up
dev/up:
	docker compose up --build

.PHONY: dev/down
dev/down:
	docker compose down

# PROD
.PHONY: prod/up
prod/up:
	docker compose --profile prod up --build

.PHONY: prod/down
prod/down:
	docker compose down

# E2E
.PHONY: e2e/up
e2e/up:
	${docker-e2e} up --build -d

.PHONY: e2e/down
e2e/down:
	${docker-e2e} down -v --remove-orphans
