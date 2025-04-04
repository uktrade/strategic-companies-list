#!/usr/bin/env bash

# Exit early if something goes wrong
set -ex

# Add commands below to run inside the container after all the other buildpacks have been applied
export COPILOT_ENVIRONMENT_NAME=build

npm run sass:build

mkdir -p scl/static/static

cp -r scl/core/static scl/static/static
cp -r node_modules/govuk-frontend/dist/govuk/assets/* scl/static/static
cp -r node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.* scl/static/static

python manage.py collectstatic

find assets/ -type f -exec gzip -k -9 {} \;
