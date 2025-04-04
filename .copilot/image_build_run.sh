#!/usr/bin/env bash

# Exit early if something goes wrong
set -ex

# Add commands below to run inside the container after all the other buildpacks have been applied
export COPILOT_ENVIRONMENT_NAME=build

npm run sass:build

mkdir -p /workspace/scl/static/static

cp -r /workspace/scl/core/static /workspace/scl/static/static
cp -r /workspace/node_modules/govuk-frontend/dist/govuk/assets /workspace/scl/static/static
cp -r /workspace/node_modules/govuk-frontend/dist/govuk/govuk-frontend.min.* /workspace/scl/static/static

python manage.py collectstatic

find /workspace/assets/ -type f -exec gzip -k -9 {} \;
