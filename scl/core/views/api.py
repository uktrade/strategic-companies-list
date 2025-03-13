from scl.core.models import Company, Engagement, EngagementNote, Insight
import json
import time
import uuid

import boto3
from django.conf import settings
from django.http import JsonResponse
import reversion


def aws_credentials_api(request):

    if settings.AWS_TRANSCRIBE_ACCESS_KEY_ID and settings.AWS_TRANSCRIBE_SECRET_ACCESS_KEY:

        return JsonResponse(
            {
                "AccessKeyId": settings.AWS_TRANSCRIBE_ACCESS_KEY_ID,
                "SecretAccessKey": settings.AWS_TRANSCRIBE_SECRET_ACCESS_KEY,
            },
            status=200,
        )

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
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            company.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated company via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    return JsonResponse(
        {
            "company": company.name,
            "duns_number": company.duns_number,
        },
        status=200,
    )


def company_insight_api(request, duns_number, insight_type):
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'GET':
        insights = list(company.insights.filter(
            insight_type=insight_type).order_by('order'))
        return JsonResponse({
            'insights': [
                {
                    'id': str(insight.id),
                    'title': insight.title,
                    'details': insight.details,
                    'created_by': f"{insight.created_by.first_name} {insight.created_by.last_name}",
                    'created_at': insight.created_at.isoformat(),
                    'order': insight.order
                } for insight in insights
            ]
        })

    elif request.method == 'POST':
        data = json.loads(request.body)

        with reversion.create_revision():
            model_insight_type = insight_type

            valid_types = dict(Insight.INSIGHT_TYPES).keys()
            if insight_type not in valid_types:
                return JsonResponse({'error': 'Invalid insight type'}, status=400)

            insight = Insight.objects.create(
                company=company,
                created_by=request.user,
                insight_type=model_insight_type,
                title=data.get('title', '').strip(),
                details=data.get('details', '').strip(),
                order=data.get('order', 0)
            )

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Created {insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({
            'id': str(insight.id),
            'title': insight.title,
            'details': insight.details,
            'created_by': f"{insight.created_by.first_name} {insight.created_by.last_name}",
            'created_at': insight.created_at.isoformat(),
            'order': insight.order
        }, status=201)


def insight_api(request, insight_id):
    try:
        insight = Insight.objects.get(id=insight_id)
    except Insight.DoesNotExist:
        return JsonResponse({'error': 'Insight not found'}, status=404)

    account_managers = list(insight.company.account_manager.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'GET':
        return JsonResponse({
            'id': str(insight.id),
            'title': insight.title,
            'details': insight.details,
            'created_by': f"{insight.created_by.first_name} {insight.created_by.last_name}",
            'created_at': insight.created_at.isoformat(),
            'order': insight.order,
            'insight_type': insight.insight_type
        })

    elif request.method == 'PATCH':
        data = json.loads(request.body)

        with reversion.create_revision():
            if 'title' in data:
                insight.title = data['title'].strip()
            if 'details' in data:
                insight.details = data['details'].strip()
            if 'order' in data:
                insight.order = data['order']

            insight.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Updated {insight.insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({
            'id': str(insight.id),
            'title': insight.title,
            'details': insight.details,
            'created_by': f"{insight.created_by.first_name} {insight.created_by.last_name}",
            'created_at': insight.created_at.isoformat(),
            'order': insight.order,
            'insight_type': insight.insight_type
        })

    elif request.method == 'DELETE':
        with reversion.create_revision():
            insight_type = insight.insight_type
            insight.delete()

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Deleted {insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({'status': 'success'})


def engagement_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    account_managers = engagement.company.account_manager.all()
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            engagement.title = data.get('title').strip()
            engagement.details = data.get('details').strip()
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

    if request.method == 'PATCH':
        with reversion.create_revision():
            note = EngagementNote.objects.get(id=data.get('id'))
            note.contents = data.get('contents')
            note.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note updated"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    if request.method == 'POST':
        with reversion.create_revision():
            note = EngagementNote.objects.create(contents=data.get(
                'note').strip(), engagement=engagement)

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note added"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )
    if request.method == 'DELETE':
        with reversion.create_revision():
            note = EngagementNote.objects.get(id=data.get('id'))
            note.delete()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note deleted"
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
