import json
import logging
import time
import uuid
from datetime import date, datetime

import boto3
import reversion
import waffle
from django.conf import settings
from django.contrib.auth.mixins import UserPassesTestMixin
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views import View
from reversion.models import Version

from scl.core import constants
from scl.core.constants import DATE_FORMAT_NUMERIC, DATE_FORMAT_SHORT
from scl.core.models import Company, Engagement, EngagementNote, Insight, KeyPeople
from scl.core.views.utils import get_all_sectors, get_company_sectors

today = date.today()


logger = logging.getLogger(__name__)


def csrf_failure(request, reason=""):
    if (
        request.headers.get("Content-Type") == "application/json"
        or request.headers.get("Accept") == "application/json"
    ):
        return JsonResponse({"error": "CSRF Failed", "reason": reason}, status=403)

    return HttpResponse("<h1>CSRF verification failed</h1>", reason, status=403)


class CompanyAccountManagerUserMixin(UserPassesTestMixin):
    protected_methods = ["patch", "put", "post", "delete"]

    def test_func(self):
        is_account_manager = (
            self.request.user in self.company.account_manager.all()
            or self.request.user.in_group(settings.SUPER_ACCESS_GROUP)
        )
        return is_account_manager

    def dispatch(self, request, *args, **kwargs):
        """
        Combination of django's UserPassesTestMixin and View dispatch method, modified to only protect methods listed in protected_methods.
        """
        logger.info("Received request %s on %s", request.method, request.path)
        if request.method.lower() in self.http_method_names:
            user_test_result = self.get_test_func()()
            if (
                request.method.lower() in self.protected_methods
                and not user_test_result
            ):
                logger.warning(
                    "User %s does not have permission to %s on %s",
                    request.user,
                    request.method,
                    request.path,
                )
                return self.handle_no_permission()

            handler = getattr(
                self, request.method.lower(), self.http_method_not_allowed
            )

        else:
            logger.warning("Method %s on %s not allowed", request.method, request.path)
            handler = self.http_method_not_allowed

        return handler(request, *args, **kwargs)


class AWSTemporaryCredentialsAPIView(UserPassesTestMixin, View):
    http_method_names = [
        "get",
    ]

    def test_func(self):
        return Company.objects.filter(account_manager=self.request.user).exists()

    @property
    def client(self):
        return boto3.client("sts")

    def get(self, *args, **kwargs):
        logger.info("Received request %s on %s", self.request.method, self.request.path)
        if settings.DISABLE_TRANSCRIBE:
            return JsonResponse({}, status=503)

        if not waffle.flag_is_active(self.request, "AWS_TRANSCRIBE"):
            return JsonResponse({}, status=403)
        logger.info("AWS transcribe service access active")
        # Creating new credentials unfortunately sometimes fails
        max_attempts = 3
        for i in range(0, 3):
            logger.info(
                "AWS transcribe create new credentials attempt %s of %s", i + 1, 3
            )
            try:
                credentials = self.client.assume_role(
                    RoleArn=settings.AWS_TRANSCRIBE_ROLE_ARN,
                    RoleSessionName="scl_" + str(uuid.uuid4()),
                    DurationSeconds=60 * 15,  # 15 minutes
                )["Credentials"]
            except Exception as e:
                logger.error(e)
                if i == max_attempts - 1:
                    logger.error("Max attempts on creating credentials reached")
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

    http_method_names = [
        "get",
        "patch",
    ]

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Response: %s for %s on %s",
            response,
            self.request.method,
            self.request.path,
        )
        return response

    @property
    def company(self):
        logger.info(
            "Requesting company with duns_number: %s", self.kwargs["duns_number"]
        )
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
            if self.data.get("global_hq_name"):
                company.global_hq_name = self.data.get("global_hq_name").strip()
            if self.data.get("global_hq_country"):
                company.global_hq_country = self.data.get("global_hq_country").strip()
            if self.data.get("global_turnover_millions_usd"):
                company.global_turnover_millions_usd = self.data.get("global_turnover_millions_usd")
            if self.data.get("global_number_of_employees"):
                company.global_number_of_employees = self.data.get("global_number_of_employees")
            company.save()

            updated_company = Company.objects.get(
                duns_number=self.kwargs["duns_number"]
            )

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Updated company via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
            {
                "data": {
                    "title": updated_company.name,
                    "duns_number": updated_company.duns_number,
                    "company_sectors": get_company_sectors(updated_company),
                    "all_sectors": get_all_sectors(),
                    "summary": updated_company.summary,
                    "global_hq_name": updated_company.global_hq_name,
                    "global_hq_country": updated_company.global_hq_country,
                    "global_turnover_millions_usd": updated_company.global_turnover_millions_usd,
                    "global_number_of_employees": updated_company.global_number_of_employees,
                    "last_updated": updated_company.last_updated.strftime(
                        "%B %d, %Y, %H:%M"
                    ),
                }
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def get(self, *args, **kwargs):
        response = JsonResponse(
            {
                "data": {
                    "title": self.company.name,
                    "duns_number": self.company.duns_number,
                    "summary": self.company.summary,
                }
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response


class CompanyInsightAPIView(CompanyAccountManagerUserMixin, View):

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
    ]

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Response: %s for %s on %s",
            response,
            self.request.method,
            self.request.path,
        )
        return response

    @property
    def company(self):
        logger.info(
            "Requesting company with duns_number: %s", self.kwargs["duns_number"]
        )
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
                f"Deleted {self.kwargs['insight_type']} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
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
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

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
                f"Updated {self.kwargs['insight_type']} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        response = JsonResponse(
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
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

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
                f"Created {self.kwargs['insight_type']} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
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
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def get(self, *args, **kwargs):
        insights = list(
            self.company.insights.filter(
                insight_type=self.kwargs["insight_type"]
            ).order_by("order")
        )
        response = JsonResponse(
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
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response


class InsightAPIView(CompanyAccountManagerUserMixin, View):

    http_method_names = [
        "get",
        "patch",
        "delete",
    ]

    @property
    def company(self):
        return self.insight.company

    @property
    def insight(self):
        return get_object_or_404(Insight, id=self.kwargs["insight_id"])

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Response: %s for %s on %s",
            response,
            self.request.method,
            self.request.path,
        )
        return response

    def get(self, *args, **kwargs):
        response = JsonResponse(
            {
                "id": str(self.insight.id),
                "title": self.insight.title,
                "details": self.insight.details,
                "created_by": self.insight.created_by.get_full_name(),
                "created_at": self.insight.created_at.isoformat(),
                "order": self.insight.order,
            }
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            insight = self.insight
            if "title" in self.data:
                insight.title = self.data["title"].strip()
            if "details" in self.data:
                insight.details = self.data["details"].strip()
            if "order" in self.data:
                insight.order = self.data["order"]

            insight.save()

            reversion.set_user(self.request.user)
            reversion.set_comment(
                f"Updated {insight.insight_type} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        response = JsonResponse(
            {
                "id": str(insight.id),
                "title": insight.title,
                "details": insight.details,
                "created_by": self.insight.created_by.get_full_name(),
                "created_at": insight.created_at.isoformat(),
                "order": insight.order,
            }
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def delete(self, *args, **kwargs):
        with reversion.create_revision():
            insight = self.insight
            insight_type = insight.insight_type
            insight.delete()

            reversion.set_user(self.request.user)
            reversion.set_comment(
                f"Deleted {insight_type} insight via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        response = JsonResponse({"status": "success"})
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response


class EngagementAPIView(CompanyAccountManagerUserMixin, View):

    http_method_names = [
        "patch",
    ]

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Response: %s for %s on %s",
            response,
            self.request.method,
            self.request.path,
        )
        return response

    @property
    def company(self):
        return self.engagement.company

    @property
    def engagement(self):
        logger.info("Requesting enagement with id: %s", self.kwargs["engagement_id"])
        return Engagement.objects.get(id=self.kwargs["engagement_id"])

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            engagement = self.engagement
            engagement.title = self.data.get("title")
            engagement.date = datetime.strptime(
                self.data.get("date"), DATE_FORMAT_NUMERIC
            ).date()
            engagement.agenda = self.data.get("agenda")
            engagement.civil_servants = self.data.get("civilServants")
            engagement.company_representatives = self.data.get("companyRepresentatives")
            engagement.engagement_type = constants.ENGAGEMENT_TYPE_MAP[
                self.data.get("engagementType")
            ]
            engagement.ministers = self.data.get("ministers")
            engagement.outcomes = self.data.get("outcomes")
            engagement.actions = self.data.get("actions")
            engagement.save()

            versions = Version.objects.get_for_object(engagement)

            last_updated = versions.first().revision
            first_created = versions.last().revision

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Updated title, and details via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer')})"
            )

        response = JsonResponse(
            {
                "data": {
                    "id": engagement.id,
                    "title": engagement.title,
                    "date": engagement.date.strftime(constants.DATE_FORMAT_SHORT),
                    "agenda": engagement.agenda,
                    "company_representatives": engagement.company_representatives,
                    "civil_servants": engagement.civil_servants,
                    "ministers": engagement.ministers,
                    "outcomes": engagement.outcomes,
                    "actions": engagement.actions,
                    "engagement_type": engagement.get_engagement_type_display(),
                    "engagement_type_options": constants.ENGAGEMENT_TYPE_OPTIONS,
                    "engagement_type_colour": engagement.engagement_type_colour,
                    "created": {
                        "name": f"{first_created.user.first_name} {first_created.user.last_name}",
                        "date": first_created.date_created.strftime(
                            constants.DATE_FORMAT_LONG
                        ),
                    },
                    "last_updated": {
                        "name": f"{last_updated.user.first_name} {last_updated.user.last_name}",
                        "date": last_updated.date_created.strftime(
                            constants.DATE_FORMAT_LONG
                        ),
                    },
                }
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response


class CompanyEngagementAPIView(CompanyAccountManagerUserMixin, View):

    http_method_names = [
        "post",
    ]

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Response: %s for %s on %s",
            response,
            self.request.method,
            self.request.path,
        )
        return response

    @property
    def company(self):
        logger.info(
            "Requesting company with duns_number: %s", self.kwargs["duns_number"]
        )
        return Company.objects.get(duns_number=self.kwargs["duns_number"])

    def post(self, *args, **kwargs):
        with reversion.create_revision():
            title = self.data.get("title")
            date = datetime.strptime(self.data.get("date"), DATE_FORMAT_NUMERIC).date()
            agenda = self.data.get("agenda")
            civil_servants = self.data.get("civilServants")
            company_representatives = self.data.get("companyRepresentatives")
            engagement_type = constants.ENGAGEMENT_TYPE_MAP[
                self.data.get("engagementType")
            ]
            ministers = self.data.get("ministers")
            outcomes = self.data.get("outcomes")
            actions = self.data.get("actions")

            Engagement.objects.create(
                company_id=self.company.id,
                title=title,
                date=date,
                agenda=agenda,
                civil_servants=civil_servants,
                company_representatives=company_representatives,
                engagement_type=engagement_type,
                ministers=ministers,
                outcomes=outcomes,
                actions=actions,
            )

            engagements = list(
                Engagement.objects.filter(
                    company=self.company, date__gte=today
                ).order_by("date")
            )[0:4]

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Engagement added via API "
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
            {
                "data": [
                    {
                        "id": engagement.id,
                        "title": engagement.title,
                        "date": engagement.date.strftime(DATE_FORMAT_SHORT),
                        "agenda": engagement.agenda,
                        "company_representatives": engagement.company_representatives,
                        "civil_servants": engagement.civil_servants,
                        "ministers": engagement.ministers,
                        "all_attendees": engagement.all_attendees,
                        "engagement_type": engagement.get_engagement_type_display(),
                        "engagement_type_colour": engagement.engagement_type_colour,
                    }
                    for engagement in engagements
                ]
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response


class EngagementNoteAPIView(CompanyAccountManagerUserMixin, View):

    http_method_names = [
        "post",
        "patch",
        "delete",
    ]

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Response: %s for %s on %s",
            response,
            self.request.method,
            self.request.path,
        )
        return response

    @property
    def company(self):
        return self.engagement.company

    @property
    def engagement(self):
        logger.info("Requesting enagement with id: %s", self.kwargs["engagement_id"])
        return Engagement.objects.get(id=self.kwargs["engagement_id"])

    @property
    def user_notes(self):
        return self.engagement.notes.filter(created_by=self.request.user)

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            for d in self.data["notes"]:
                note = EngagementNote.objects.get(id=d.get("noteId"))
                note.created_by = self.request.user
                note.contents = d["contents"]
                note.save()

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Note updated"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
            {
                "data": [
                    {
                        "noteId": str(note.id),
                        "contents": note.contents,
                    }
                    for note in self.user_notes
                ],
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def post(self, *args, **kwargs):
        with reversion.create_revision():
            EngagementNote.objects.create(
                contents=self.data.get("contents").strip(),
                engagement=self.engagement,
                created_by=self.request.user,
            )

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Note added"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        response = JsonResponse(
            {
                "data": [
                    {
                        "noteId": str(note.id),
                        "contents": note.contents,
                    }
                    for note in self.user_notes
                ],
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def delete(self, *args, **kwargs):
        with reversion.create_revision():
            note = EngagementNote.objects.get(id=self.data.get("id"))
            note.delete()

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Note deleted"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )

        response = JsonResponse(
            {
                "data": [
                    {
                        "noteId": str(note.id),
                        "contents": note.contents,
                    }
                    for note in self.user_notes
                ],
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response


class KeyPeopleAPIView(CompanyAccountManagerUserMixin, View):

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
    ]

    @property
    def data(self):
        response = json.loads(self.request.body)
        logger.info(
            "Request: %s for %s on %s with %s",
            response,
            self.request.method,
            self.request.path,
            self.request.body,
        )
        return response

    @property
    def company(self):
        logger.info(
            "Requesting company with duns_number: %s", self.kwargs["duns_number"]
        )
        return Company.objects.get(duns_number=self.kwargs["duns_number"])

    def post(self, *args, **kwargs):
        with reversion.create_revision():
            KeyPeople.objects.create(
                name=self.data.get("name"),
                role=self.data.get("role"),
                email=self.data.get("email"),
                company=self.company,
            )
            updated_people = list(self.company.key_people.all().order_by("name"))

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Person created"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
            {
                "data": [
                    {
                        "name": people.name,
                        "role": people.role,
                        "userId": people.id,
                        "email": people.email,
                    }
                    for people in updated_people
                ]
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

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
        response = JsonResponse(
            {
                "data": [
                    {
                        "name": people.name,
                        "role": people.role,
                        "userId": people.id,
                        "email": people.email,
                    }
                    for people in updated_people
                ]
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def patch(self, *args, **kwargs):
        with reversion.create_revision():
            for d in self.data:
                person = KeyPeople.objects.get(id=d["userId"])
                person.name = d["name"]
                person.role = d["role"]
                person.email = d.get("email")
                person.save()

            updated_people = list(self.company.key_people.all())

            reversion.set_user(self.request.user)
            reversion.set_comment(
                "Key people updated"
                f"({self.request.build_absolute_uri()} from {self.request.headers.get('referer', '')})"
            )
        response = JsonResponse(
            {
                "data": [
                    {
                        "name": people.name,
                        "role": people.role,
                        "userId": people.id,
                        "email": people.email,
                    }
                    for people in updated_people
                ]
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response

    def get(self, *args, **kwargs):
        key_people = list(self.company.key_people.all())
        response = JsonResponse(
            {
                "keyPeople": [
                    {
                        "name": people.name,
                        "role": people.role,
                        "userId": people.id,
                        "email": people.email,
                    }
                    for people in key_people
                ]
            },
            status=200,
        )
        logger.info(
            "Response: %s for %s on %s",
            response.content,
            self.request.method,
            self.request.path,
        )
        return response
