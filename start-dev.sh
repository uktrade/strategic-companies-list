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
python manage.py creategroups
python manage.py waffle_flag AWS_TRANSCRIBE --everyone --create

# Get/Create the same user that mock-sso creates, set as staff, superuser, and with Basic access
python manage.py shell << EOF
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
user, _ = get_user_model().objects.get_or_create(username="20a0353f-a7d1-4851-9af8-1bcaff152b60")
user.email = "local.user@businessandtrade.gov.uk"
user.first_name = "Vyvyan"
user.last_name = "Holland"
user.is_active = True
user.is_staff = True
user.is_superuser = True
user.groups.add(Group.objects.get(name='Basic access'))
user.groups.add(Group.objects.get(name='Viewer access'))
user.groups.add(Group.objects.get(name='Super access'))
user.save()
EOF

exec parallel --will-cite --line-buffer --jobs 2 --halt now,done=1 ::: \
    "python manage.py runserver 0.0.0.0:8001" \
    "nginx -p /home/scl"
