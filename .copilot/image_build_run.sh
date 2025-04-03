#!/usr/bin/env bash

# Exit early if something goes wrong
set -ex

# Add commands below to run inside the container after all the other buildpacks have been applied
npm run sass:build

python manage.py collectstatic

find /workspace/assets/ -type f -exec gzip -k -9 {} \;
