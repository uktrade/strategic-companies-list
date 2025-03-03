#!/bin/bash

set -e

if [ "$DATABASE" = "scl" ]
then
        echo "Wating for postgres..."

        while ! nc -z $DB_HOST $DB_PORT; do
                sleep 0.1
        done

        echo "POSTGRESQL started"
fi

python manage.py migrate

exec parallel --will-cite --line-buffer --jobs 2 --halt now,done=1 ::: \
    "python manage.py runserver 0.0.0.0:8001" \
    "nginx -p /home/scl"
