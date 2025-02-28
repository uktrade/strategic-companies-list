#!/bin/bash

set -e

exec parallel --will-cite --line-buffer --jobs 2 --halt now,done=1 ::: \
    "python -m uvicorn --host 0.0.0.0 --port 8001 scl.asgi:application" \
    "nginx -p /home/scl"
