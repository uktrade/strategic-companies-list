import json
import logging
from datetime import date, datetime, timedelta

from django.conf import settings
from django.contrib.auth.mixins import UserPassesTestMixin
from django.template.response import TemplateResponse
from django.views.generic import DetailView, TemplateView
from django.urls import reverse
from reversion.models import Version

from scl.core import constants
from scl.core.models import Company, CompanyAccountManager, Engagement, Insight
from scl.core.views.utils import (
    get_all_feature_flags,
    get_all_sectors,
    get_company_sectors,
)

logger = logging.getLogger().warning


class ViewerOrCompanyAccountManagerUserMixin(UserPassesTestMixin):
    raise_exception = True

    def test_func(self):
        is_viewer = self.request.user.in_group(settings.VIEWER_ACCESS_GROUP)
        is_account_manager = self.request.user in self.company.account_manager.all()
        return is_viewer or is_account_manager


class UserCanEditMixin(UserPassesTestMixin):
    raise_exception = True

    def test_user_can_edit(self):
        return (
            self.request.user in self.company.account_manager.all()
            or self.request.user.in_group(settings.SUPER_ACCESS_GROUP)
        )


class IndexView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        today = date.today()
        all_companies = list(Company.objects.all())
        your_companies = list(self.request.user.managed_companies.all())
        your_future_enagements = list(
            Engagement.objects.filter(
                company__in=your_companies, date__gte=today
            ).order_by("-date")
        )

        context["all_companies"] = all_companies
        context["your_companies"] = your_companies
        context["your_future_enagements"] = your_future_enagements
        return context


class EngagementDetailView(
    ViewerOrCompanyAccountManagerUserMixin, UserCanEditMixin, DetailView
):
    template_name = "engagement.html"
    model = Engagement

    @property
    def company(self):
        return self.get_object().company

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        versions = Version.objects.get_for_object(self.object)

        last_updated = versions.first().revision
        first_created = versions.last().revision

        notes = self.object.notes.filter(created_by=self.request.user)

        props = {
            "props": json.dumps(
                {
                    "id": str(self.object.id),
                    "title": self.object.title,
                    "date": self.object.date.strftime(constants.DATE_FORMAT_SHORT),
                    "engagement_type": self.object.get_engagement_type_display(),
                    "engagement_type_colour": self.object.engagement_type_colour,
                    "agenda": self.object.agenda,
                    "civil_servants": self.object.civil_servants,
                    "company_representatives": self.object.company_representatives,
                    "ministers": self.object.ministers,
                    "outcomes": self.object.outcomes,
                    "actions": self.object.actions,
                    "flags": get_all_feature_flags(self.request),
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
                    "is_account_manager": self.test_user_can_edit(),
                    "has_access": self.test_func(),
                    "company": {
                        "name": self.object.company.name,
                        "duns_number": self.object.company.duns_number,
                    },
                    "engagement_type_options": constants.ENGAGEMENT_TYPE_OPTIONS,
                    "notes": (
                        [
                            {
                                "noteId": str(note.id),
                                "contents": note.contents,
                            }
                            for note in notes
                        ]
                        if self.test_user_can_edit()
                        else []
                    ),
                }
            )
        }
        context.update(props)
        return context


class CompanyEngagementListView(ViewerOrCompanyAccountManagerUserMixin, DetailView):
    model = Company
    template_name = "engagements_total.html"

    @property
    def company(self):
        return self.get_object()

    def get_object(self):
        queryset = self.get_queryset()
        return queryset.get(duns_number=self.kwargs["duns_number"])

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        today = datetime.now().date()
        yesterday = datetime.now() - timedelta(days=1)

        past_engagements = list(
            self.object.engagements.filter(date__lte=yesterday).order_by("-date")
        )
        engagements = list(
            self.object.engagements.filter(date__gte=today).order_by("-date")
        )
        engagement_to_dict = lambda x: {
            "id": str(x.id),
            "title": x.title,
            "date": str(x.date),
            "link": reverse("engagement", args=[x.pk]),
            "company": {
                "title": self.object.name,
                "summary": self.object.summary,
                "duns_number": self.object.duns_number,
            },
            "agenda": x.agenda,
        }
        props = json.dumps(
            {
                "past_engagements": list(map(engagement_to_dict, past_engagements)),
                "engagements": list(map(engagement_to_dict, engagements)),
            }
        )
        context.update(
            {
                "company": self.object,
                "add_engagement_link": f"/company-briefing/{self.object.duns_number}/add-engagement",
                "engagements": engagements,
                "past_engagements": past_engagements,
                "props": props,
            }
        )
        return context


class CompanyDetailView(
    DetailView, ViewerOrCompanyAccountManagerUserMixin, UserCanEditMixin
):
    model = Company
    template_name = "company.html"

    @property
    def company(self):
        return self.get_object()

    def get_object(self):
        queryset = self.get_queryset()
        return queryset.get(duns_number=self.kwargs["duns_number"])

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        today = date.today()

        account_managers = list(self.object.account_manager.all())

        account_managers_with_lead = []

        for am in account_managers:
            is_lead = CompanyAccountManager.objects.filter(
                company=self.object, account_manager=am, is_lead=True
            ).exists()
            account_managers_with_lead.append(
                {
                    "name": f"{am.first_name} {am.last_name}",
                    "email": am.email,
                    "is_lead": "true" if is_lead else "false",
                }
            )

        engagements = list(
            self.object.engagements.filter(date__gte=today).order_by("date")
        )[0:4]

        versions = Version.objects.get_for_object(self.object)
        current_version = versions.first()

        company_priorities = list(
            self.object.insights.filter(
                insight_type=Insight.TYPE_COMPANY_PRIORITY
            ).order_by("order")
        )
        hmg_priorities = list(
            self.object.insights.filter(
                insight_type=Insight.TYPE_HMG_PRIORITY
            ).order_by("order")
        )
        key_people = list(self.object.key_people.all())
        employees = (
            "{:,}".format(self.object.global_number_of_employees)
            if self.object.global_number_of_employees
            else ""
        )

        company_sectors = get_company_sectors(self.object)

        context.update(
            {
                "company": self.object,
                "props": json.dumps(
                    {
                        "title": self.object.name,
                        "summary": self.object.summary,
                        "duns_number": self.object.duns_number,
                        "company_sectors": company_sectors if company_sectors else [],
                        "all_sectors": get_all_sectors(),
                        "last_updated": (
                            current_version.revision.date_created.strftime(
                                constants.DATE_FORMAT_LONG
                            )
                            if current_version
                            else None
                        ),
                        "global_hq_country": self.object.get_global_hq_country,
                        "turn_over": self.object.global_turnover_millions_usd,
                        "employees": employees,
                        "key_people": [
                            {
                                "name": people.name,
                                "role": people.role,
                                "userId": str(people.id),
                                "email": people.email,
                            }
                            for people in key_people
                        ],
                        "company_priorities": (
                            [
                                {
                                    "title": priority.title,
                                    "details": priority.details,
                                    "insightId": str(priority.id),
                                }
                                for priority in company_priorities
                            ]
                            if self.test_func()
                            else []
                        ),
                        "hmg_priorities": (
                            [
                                {
                                    "title": priority.title,
                                    "details": priority.details,
                                    "insightId": str(priority.id),
                                }
                                for priority in hmg_priorities
                            ]
                            if self.test_func()
                            else []
                        ),
                        "has_access": self.test_func(),
                        "is_account_manager": self.test_user_can_edit(),
                        "engagement_type_options": constants.ENGAGEMENT_TYPE_OPTIONS,
                        "engagements": (
                            [
                                {
                                    "id": str(engagement.id),
                                    "title": engagement.title,
                                    "agenda": engagement.agenda,
                                    "date": engagement.date.strftime(
                                        constants.DATE_FORMAT_NUMERIC_SLASHES
                                    ),
                                    "all_attendees": engagement.all_attendees,
                                    "outcomes": engagement.outcomes,
                                    "actions": engagement.actions,
                                    "engagement_type": engagement.get_engagement_type_display(),
                                    "engagement_type_colour": engagement.engagement_type_colour,
                                }
                                for engagement in engagements
                            ]
                            if self.test_func()
                            else []
                        ),
                        "account_managers": account_managers_with_lead,
                    }
                ),
            }
        )
        return context


def custom_403_view(request, *args, **kwargs):
    return TemplateResponse(request=request, template="403_generic.html", status=403)
