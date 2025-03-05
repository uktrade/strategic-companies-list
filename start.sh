#!/bin/bash

set -e

echo "Waiting for PostrgreSQL"
while ! pg_isready --quiet
do
    sleep 0.5
done
echo "PostrgreSQL ready"

python manage.py migrate
python manage.py createinitialrevisions

exec parallel --will-cite --line-buffer --jobs 2 --halt now,done=1 ::: \
    "python -m uvicorn --host 0.0.0.0 --port 8001 scl.asgi:application" \
    "nginx -p /home/scl"
