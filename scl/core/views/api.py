import reversion
import json
import time
import uuid

import boto3
from django.conf import settings
from django.http import JsonResponse

from scl.core.models import Company, Engagement, EngagementNote


def aws_credentials_api(request):
    client = boto3.client("sts")
    role_arn = settings.AWS_TRANSCRIBE_ROLE_ARN

    # Creating new credentials unfortunately sometimes fails
    max_attempts = 3
    for i in range(0, 3):
        try:
            credentials = client.assume_role(
                RoleArn=role_arn,
                RoleSessionName="scl_" + str(uuid.uuid4()),
                DurationSeconds=60 * 60,
            )["Credentials"]
        except Exception:
            if i == max_attempts - 1:
                raise
            else:
                time.sleep(1)

    return JsonResponse(
        {
            "AccessKeyId": credentials["AccessKeyId"],
            "SecretAccessKey": credentials["SecretAccessKey"],
            "SessionToken": credentials["SessionToken"],
            "Expiration": credentials["Expiration"],
        },
        status=200,
    )


def company_api(request, duns_number):
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            company.key_people = data.get('key_people').strip()
            company.hmg_priorities = data.get('hmg_priorities').strip()
            company.company_priorities = data.get('company_priorities').strip()
            company.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated key_people, hmg_priorities, and company_priorities via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    return JsonResponse(
        {
            "company": company.name,
            "duns_number": company.duns_number,
        },
        status=200,
    )


def engagement_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    account_managers = engagement.company.account_manager.all()
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            engagement.title = data.get('engagement_title').strip()
            engagement.details = data.get('engagement_details').strip()
            engagement.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated title, and details via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    return JsonResponse(
        {
            "engagement": engagement.title,
            "id": engagement.id,
        },
        status=200,
    )


def engagement_note_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    account_managers = engagement.company.account_manager.all()
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'POST':
        with reversion.create_revision():
            note = EngagementNote.objects.create(contents=data.get(
                'note').strip(), engagement=engagement)

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note added to engagement"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )
    if request.method == 'DELETE':
        with reversion.create_revision():
            note = EngagementNote.objects.get(id=data.get('id'))
            note.delete()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note deleted from engagement"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    return JsonResponse(
        {
            "engagement": engagement.title,
            "id": engagement.id,
            "note": note.id
        },
        status=200,
    )
