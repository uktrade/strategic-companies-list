from scl.core.models import Company, Engagement, EngagementNote, Insight, KeyPeople
import json
import time
import uuid
import logging

import boto3
from django.conf import settings
from django.http import JsonResponse
import reversion

logger = logging.getLogger().warning


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
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            company.name = data.get('title').strip()
            company.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated company name and key_people via API "
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
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'DELETE':
        with reversion.create_revision():
            insight = Insight.objects.get(id=data["insightId"])
            insight.delete()

            updated_insights = list(company.insights.filter(
                insight_type=insight_type))

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Deleted {insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({
            'data': [
                {
                    'insightId': str(insight.id),
                    'title': insight.title,
                    'details': insight.details
                } for insight in updated_insights

            ]
        }, status=200)

    if request.method == 'PATCH':
        with reversion.create_revision():
            for d in data:
                insight = Insight.objects.get(id=d["insightId"])
                insight.title = d["title"]
                insight.details = d["details"]
                insight.save()

            updated_insights = list(company.insights.filter(
                insight_type=insight_type))

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Updated {insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({
            'data': [
                {
                    'insightId': str(insight.id),
                    'title': insight.title,
                    'details': insight.details
                } for insight in updated_insights

            ]
        }, status=200)

    if request.method == 'POST':
        with reversion.create_revision():
            insight = Insight.objects.create(
                company=company,
                created_by=request.user,
                insight_type=insight_type,
                title=data.get('title', '').strip(),
                details=data.get('details', '').strip()
            )

            updated_insights = list(company.insights.filter(
                insight_type=insight_type))

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Created {insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({
            'data': [
                {
                    'insightId': str(insight.id),
                    'title': insight.title,
                    'details': insight.details
                } for insight in updated_insights

            ]
        }, status=200)

    if request.method == 'GET':
        insights = list(company.insights.filter(
            insight_type=insight_type).order_by('order'))
        return JsonResponse({
            'insights': [
                {
                    'insightId': str(insight.id),
                    'title': insight.title,
                    'details': insight.details,
                    'created_by': f"{insight.created_by.first_name} {insight.created_by.last_name}",
                    'created_at': insight.created_at.isoformat(),
                    'order': insight.order
                } for insight in insights
            ]
        })


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
            'order': insight.order
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
            'order': insight.order
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


def key_people_api(request, duns_number):
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    key_people = list(company.key_people.all())
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'POST':
        with reversion.create_revision():
            data = json.loads(request.body)

            person = KeyPeople.objects.create(
                name=data.get("name"),
                role=data.get("role"),
                company=company
            )

            updated_people = list(company.key_people.all())

            reversion.set_user(request.user)
            reversion.set_comment(
                "Person created"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )
            return JsonResponse(
                {
                    "data": [
                        {
                            'name': people.name,
                            'role': people.role,
                            'userId': people.id
                        } for people in updated_people
                    ]
                },
                status=200,
            )

    if request.method == 'DELETE':
        with reversion.create_revision():
            data = json.loads(request.body)

            person = KeyPeople.objects.get(id=data["id"])
            person.delete()

            updated_people = list(company.key_people.all())

            reversion.set_user(request.user)
            reversion.set_comment(
                "Person deleted"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )
            return JsonResponse(
                {
                    "data": [
                        {
                            'name': people.name,
                            'role': people.role,
                            'userId': people.id
                        } for people in updated_people
                    ]
                },
                status=200,
            )

    if request.method == 'PATCH':
        with reversion.create_revision():
            data = json.loads(request.body)
            for d in data:
                person = KeyPeople.objects.get(id=d["userId"])
                person.name = d["name"]
                person.role = d["role"]
                person.save()

            updated_people = list(company.key_people.all())

            reversion.set_user(request.user)
            reversion.set_comment(
                "Key people updated"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )
            return JsonResponse(
                {
                    "data": [
                        {
                            'name': people.name,
                            'role': people.role,
                            'userId': people.id
                        } for people in updated_people
                    ]
                },
                status=200,
            )

    if request.method == 'GET':
        return JsonResponse(
            {
                "keyPeople": [
                    {
                        'name': people.name,
                        'role': people.role,
                        'userId': people.id
                    } for people in key_people
                ]
            },
            status=200,
        )
