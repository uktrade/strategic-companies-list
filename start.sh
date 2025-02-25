#!/bin/bash

set -e

python manage.py collectstatic

exec parallel --will-cite --line-buffer --jobs 2 --halt now,done=1 ::: \
    "python manage.py runserver 0.0.0.0:8001" \
    "nginx -p /home/scl"
