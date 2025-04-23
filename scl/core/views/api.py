from datetime import date, datetime
from scl.core.constants import SECTORS
from scl.core.models import Company, Engagement, EngagementNote, Insight, KeyPeople
import json
import time
import uuid
import logging
import waffle

import boto3
from django.conf import settings
from django.contrib.auth.mixins import UserPassesTestMixin
from django.http import JsonResponse
from django.views import View

import reversion

from scl.core.views.utils import get_all_sectors, get_company_sectors

today = date.today()

logger = logging.getLogger().warning


class CompanyAccountManagerUserMixin(UserPassesTestMixin):
    protected_methods = ["patch", "put", "post", "delete"]

    def test_func(self):
        is_account_manager = self.request.user in self.company.account_manager.all()
        return is_account_manager

    def dispatch(self, request, *args, **kwargs):
        """
        Combination of django's UserPassesTestMixin and View dispatch method, modified to only protect methods listed in protected_methods.
        """

        if request.method.lower() in self.http_method_names:
            user_test_result = self.get_test_func()()
            if (
                request.method.lower() in self.protected_methods
                and not user_test_result
            ):
                return self.handle_no_permission()

            handler = getattr(
                self, request.method.lower(), self.http_method_not_allowed
            )

        else:
            handler = self.http_method_not_allowed

        return handler(request, *args, **kwargs)


def aws_temporary_credentials_api(request):
    if settings.DISABLE_TRANSCRIBE:
        return JsonResponse(
            {},
            status=503,
        )

    is_account_manager = Company.objects.filter(
        account_manager=request.user).exists()

    if not is_account_manager:
        return JsonResponse(403, safe=False)

    if not waffle.flag_is_active(request, "AWS_TRANSCRIBE"):
        return JsonResponse(403, safe=False)

    client = boto3.client("sts")
    role_arn = settings.AWS_TRANSCRIBE_ROLE_ARN

    # Creating new credentials unfortunately sometimes fails
    max_attempts = 3
    for i in range(0, 3):
        try:
            credentials = client.assume_role(
                RoleArn=role_arn,
                RoleSessionName="scl_" + str(uuid.uuid4()),
                DurationSeconds=60 * 15,  # 15 minutes
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


class CompanyAPIView(CompanyAccountManagerUserMixin, View):

    @property
    def data(self):
        return json.loads(self.request.body)

    @property
    def company(self):
        return Company.objects.get(duns_number=self.kwargs["duns_number"])

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            company = self.company
            if self.data.get("title"):
                company.name = self.data.get("title").strip()
            if self.data.get("sectors"):
                company.sectors = [key["value"] for key in self.data.get("sectors")]
            if self.data.get("summary"):
                company.summary = self.data.get("summary").strip()
            company.save()

            updated_company = Company.objects.get(
                duns_number=self.kwargs["duns_number"]
            )

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Updated company via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

            return JsonResponse(
                {
                    "data": {
                        "title": updated_company.name,
                        "duns_number": updated_company.duns_number,
                        "company_sectors": get_company_sectors(updated_company),
                        "all_sectors": get_all_sectors(),
                        "summary": updated_company.summary,
                        "last_updated": updated_company.last_updated.strftime(
                            "%B %d, %Y, %H:%M"
                        ),
                    }
                },
                status=200,
            )

    def get(self, *args, **kwargs):
        return JsonResponse(
            {
                "data": {
                    "title": self.company.name,
                    "duns_number": self.company.duns_number,
                    "summary": self.company.summary,
                }
            },
            status=200,
        )


class CompanyInsightAPIView(CompanyAccountManagerUserMixin, View):

    @property
    def data(self):
        return json.loads(self.request.body)

    @property
    def company(self):
        return Company.objects.get(duns_number=self.kwargs["duns_number"])

    def delete(self, *args, **kwargs):
        with reversion.create_revision():
            insight = Insight.objects.get(id=self.data["insightId"])
            insight.delete()

            updated_insights = list(
                self.company.insights.filter(insight_type=self.kwargs["insight_type"])
            )

            reversion.set_user(self.request.user)
            reversion.set_comment(
                f"Deleted {self.kwargs["insight_type"]} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        return JsonResponse(
            {
                "data": [
                    {
                        "insightId": str(insight.id),
                        "title": insight.title,
                        "details": insight.details,
                    }
                    for insight in updated_insights
                ]
            },
            status=200,
        )

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            for d in self.data:
                insight = Insight.objects.get(id=d["insightId"])
                insight.title = d["title"]
                insight.details = d["details"]
                insight.save()

            updated_insights = list(
                self.company.insights.filter(insight_type=self.kwargs["insight_type"])
            )

            reversion.set_user(self.request.user)
            reversion.set_comment(
                f"Updated {self.kwargs["insight_type"]} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        return JsonResponse(
            {
                "data": [
                    {
                        "insightId": str(insight.id),
                        "title": insight.title,
                        "details": insight.details,
                    }
                    for insight in updated_insights
                ]
            },
            status=200,
        )

    def post(self, *args, **kwargs):
        with reversion.create_revision():
            Insight.objects.create(
                company=self.company,
                created_by=self.request.user,
                insight_type=self.kwargs["insight_type"],
                title=self.data.get("title", "").strip(),
                details=self.data.get("details", "").strip(),
            )

            updated_insights = list(
                self.company.insights.filter(insight_type=self.kwargs["insight_type"])
            )

            reversion.set_user(self.request.user)
            reversion.set_comment(
                f"Created {self.kwargs["insight_type"]} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        return JsonResponse(
            {
                "data": [
                    {
                        "insightId": str(insight.id),
                        "title": insight.title,
                        "details": insight.details,
                    }
                    for insight in updated_insights
                ]
            },
            status=200,
        )

    def get(self, *args, **kwargs):
        insights = list(
            self.company.insights.filter(
                insight_type=self.kwargs["insight_type"]
            ).order_by("order")
        )
        return JsonResponse(
            {
                "insights": [
                    {
                        "insightId": str(insight.id),
                        "title": insight.title,
                        "details": insight.details,
                        "created_by": f"{insight.created_by.first_name} {insight.created_by.last_name}",
                        "created_at": insight.created_at.isoformat(),
                        "order": insight.order,
                    }
                    for insight in insights
                ]
            }
        )


def insight_api(request, insight_id):
    try:
        insight = Insight.objects.get(id=insight_id)
    except Insight.DoesNotExist:
        return JsonResponse({"error": "Insight not found"}, status=404)

    account_managers = list(insight.company.account_manager.all())
    is_account_manager = request.user in account_managers
    if not is_account_manager:
        return JsonResponse(403, safe=False)

    if request.method == "GET":
        return JsonResponse(
            {
                "id": str(insight.id),
                "title": insight.title,
                "details": insight.details,
                "created_by": f"{insight.created_by.first_name} {insight.created_by.last_name}",
                "created_at": insight.created_at.isoformat(),
                "order": insight.order,
            }
        )

    elif request.method == "PATCH":
        data = json.loads(request.body)

        with reversion.create_revision():
            if "title" in data:
                insight.title = data["title"].strip()
            if "details" in data:
                insight.details = data["details"].strip()
            if "order" in data:
                insight.order = data["order"]

            insight.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Updated {insight.insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse(
            {
                "id": str(insight.id),
                "title": insight.title,
                "details": insight.details,
                "created_by": f"{insight.created_by.first_name} {insight.created_by.last_name}",
                "created_at": insight.created_at.isoformat(),
                "order": insight.order,
            }
        )

    elif request.method == "DELETE":
        with reversion.create_revision():
            insight_type = insight.insight_type
            insight.delete()

            reversion.set_user(request.user)
            reversion.set_comment(
                f"Deleted {insight_type} insight via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

        return JsonResponse({"status": "success"})


def engagement_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    account_managers = engagement.company.account_manager.all()
    is_account_manager = request.user in account_managers

    if not is_account_manager:
        return JsonResponse("Forbidden", status=403, safe=False)

    if request.method == "PATCH":
        with reversion.create_revision():
            engagement.title = data.get("title").strip()
            engagement.details = data.get("details").strip()
            engagement.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated title, and details via API "
                f"({request.build_absolute_uri()} from {request.headers.get('referer')})"
            )

    return JsonResponse(
        {
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

    if request.method == "POST":
        with reversion.create_revision():
            title = data.get("title")
            date = datetime.strptime(data.get("date"), "%Y-%m-%d").date()
            details = data.get("details")
            logger(company.id)
            Engagement.objects.create(
                company_id=company.id, title=title, date=date, details=details
            )

            engagements = list(
                Engagement.objects.filter(company=company, date__gte=today).order_by(
                    "date"
                )
            )[0:4]

            reversion.set_user(request.user)
            reversion.set_comment(
                "Engagement added via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

            return JsonResponse(
                {
                    "data": [
                        {
                            "title": engagement.title,
                            "date": engagement.date.strftime("%B %d, %Y"),
                            "id": engagement.id,
                        }
                        for engagement in engagements
                    ]
                },
                status=200,
            )


def engagement_note_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    is_account_manager = request.user in engagement.company.account_manager.all()

    if not is_account_manager:
        return JsonResponse(403, safe=False)

    if request.method == "PATCH":
        with reversion.create_revision():
            for d in data["notes"]:
                note = EngagementNote.objects.get(id=d.get("noteId"))
                note.created_by = request.user
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
                            "noteId": str(note.id),
                            "contents": note.contents,
                        }
                        for note in updated_notes
                    ],
                },
                status=200,
            )

    if request.method == "POST":
        with reversion.create_revision():
            note = EngagementNote.objects.create(
                contents=data.get("contents").strip(),
                engagement=engagement,
                created_by=request.user,
            )

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
                            "noteId": str(note.id),
                            "contents": note.contents,
                        }
                        for note in notes
                    ],
                },
                status=200,
            )

    if request.method == "DELETE":
        with reversion.create_revision():
            note = EngagementNote.objects.get(id=data.get("id"))
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
                            "noteId": str(note.id),
                            "contents": note.contents,
                        }
                        for note in notes
                    ],
                },
                status=200,
            )


class KeyPeopleAPIView(CompanyAccountManagerUserMixin, View):

    @property
    def data(self):
        return json.loads(self.request.body)

    @property
    def company(self):
        return Company.objects.get(duns_number=self.kwargs["duns_number"])

    def post(self, *args, **kwargs):
        with reversion.create_revision():
            KeyPeople.objects.create(
                name=self.data.get("name"),
                role=self.data.get("role"),
                company=self.company,
            )
            updated_people = list(self.company.key_people.all().order_by("name"))

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Person created"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
            return JsonResponse(
                {
                    "data": [
                        {"name": people.name, "role": people.role, "userId": people.id}
                        for people in updated_people
                    ]
                },
                status=200,
            )

    def delete(self, *args, **kwargs):
        with reversion.create_revision():
            person = KeyPeople.objects.get(id=self.data["id"])
            person.delete()

            updated_people = list(self.company.key_people.all())

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Person deleted"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
            return JsonResponse(
                {
                    "data": [
                        {"name": people.name, "role": people.role, "userId": people.id}
                        for people in updated_people
                    ]
                },
                status=200,
            )

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            for d in self.data:
                person = KeyPeople.objects.get(id=d["userId"])
                person.name = d["name"]
                person.role = d["role"]
                person.save()

            updated_people = list(self.company.key_people.all())

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Key people updated"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
            return JsonResponse(
                {
                    "data": [
                        {"name": people.name, "role": people.role, "userId": people.id}
                        for people in updated_people
                    ]
                },
                status=200,
            )

    def get(self, *args, **kwargs):
        key_people = list(self.company.key_people.all())
        return JsonResponse(
            {
                "keyPeople": [
                    {"name": people.name, "role": people.role, "userId": people.id}
                    for people in key_people
                ]
            },
            status=200,
        )
