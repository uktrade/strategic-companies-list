from datetime import date, datetime
from scl.core.models import Company, Engagement, EngagementNote, Insight, KeyPeople
from reversion.models import Version
import json
import time
import uuid
import logging

import boto3
from django.conf import settings
from django.http import JsonResponse
import reversion

today = date.today()

logger = logging.getLogger().warning


def aws_credentials_api(request):

    if settings.AWS_TRANSCRIBE_ACCESS_KEY_ID and settings.AWS_TRANSCRIBE_SECRET_ACCESS_KEY:

        return JsonResponse(
            {
                "AccessKeyId": settings.AWS_TRANSCRIBE_ACCESS_KEY_ID,
                "SecretAccessKey": settings.AWS_TRANSCRIBE_SECRET_ACCESS_KEY,
                "SessionToken": settings.AWS_SESSION_TOKEN,
                "Expiration": settings.AWS_EXPIRATION_TIMESTAMP
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
    is_account_manager = request.user in account_managers
    if not is_account_manager:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            company.name = data.get('title').strip()
            company.save()

            updated_company = Company.objects.get(duns_number=duns_number)

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated company via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

            return JsonResponse(
                {
                    "title": updated_company.name,
                    "duns_number": updated_company.duns_number,
                    "sectors": updated_company.get_sectors_display,
                    "last_updated": updated_company.last_updated.strftime("%B %d, %Y, %H:%M"),
                },
                status=200,
            )

    return JsonResponse(
        {
            "title": company.name,
            "duns_number": company.duns_number,
        },
        status=200,
    )


def company_insight_api(request, duns_number, insight_type):
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)

    account_managers = list(company.account_manager.all())
    is_account_manager = request.user in account_managers
    if not is_account_manager:
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
    is_account_manager = request.user in account_managers
    if not is_account_manager:
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
    is_account_manager = request.user in account_managers

    if not is_account_manager:
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

    return JsonResponse({
        "data": {
            "title": engagement.title,
            "details": engagement.details,
        }
    },
        status=200,
    )


def add_engagement_api(request, duns_number):
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)
    is_account_manager = request.user in company.account_manager.all()

    if not is_account_manager:
        return JsonResponse(403, safe=False)

    if request.method == 'POST':
        with reversion.create_revision():
            title = data.get("title")
            date = datetime.strptime(data.get("date"), "%Y-%m-%d").date()
            details = data.get("details")
            logger(company.id)
            Engagement.objects.create(
                company_id=company.id,
                title=title, date=date, details=details)

            engagements = list(Engagement.objects.filter(
                company=company, date__gte=today).order_by('date'))[0:4]

            reversion.set_user(request.user)
            reversion.set_comment(
                "Engagement added via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

            return JsonResponse({
                "data": [
                    {
                        'title': engagement.title,
                        'date': engagement.date.strftime("%B %d, %Y"),
                    } for engagement in engagements
                ]},
                status=200,
            )


def engagement_note_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    is_account_manager = request.user in engagement.company.account_manager.all()

    if not is_account_manager:
        return JsonResponse(403, safe=False)

    if request.method == 'PATCH':
        with reversion.create_revision():
            for d in data['notes']:
                note = EngagementNote.objects.get(id=d.get('id'))
                note.contents = d["contents"]
                note.save()

            updated_engagements = Engagement.objects.get(id=engagement_id)
            updated_notes = updated_engagements.notes.all()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note updated"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

            return JsonResponse(
                {
                    "data": [
                        {
                            'noteId': str(note.id),
                            'contents': note.contents,
                        } for note in updated_notes
                    ],
                },
                status=200,
            )

    if request.method == 'POST':
        with reversion.create_revision():
            note = EngagementNote.objects.create(contents=data.get(
                'contents').strip(), engagement=engagement)

            reversion.set_user(request.user)
            reversion.set_comment(
                "Note added"
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

            notes = engagement.notes.all()

            return JsonResponse(
                {
                    "data": [
                        {
                            'noteId': str(note.id),
                            'contents': note.contents,
                        } for note in notes
                    ],
                },
                status=200,
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

            notes = engagement.notes.all()

            return JsonResponse(
                {
                    "data": [
                        {
                            'noteId': str(note.id),
                            'contents': note.contents,
                        } for note in notes
                    ],
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
