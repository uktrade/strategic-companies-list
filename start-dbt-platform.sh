#!/usr/bin/env bash

python manage.py migrate
python manage.py createinitialrevisions
python manage.py creategroups

python -m uvicorn --host 0.0.0.0 --port "$PORT" scl.asgi:application
