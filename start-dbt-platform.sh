#!/usr/bin/env bash

python manage.py migrate
python manage.py createinitialrevisions
python manage.py creategroups

gunicorn scl.wsgi:application --bind "0.0.0.0:$PORT"
