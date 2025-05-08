import re
from datetime import datetime

from django.conf import settings

import pytest
import reversion
from bs4 import BeautifulSoup
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.test import Client, TestCase
from django.urls import reverse

from scl.core.models import Company
from scl.core.tests import factories
from scl.core.views import html


class HomePageTest(TestCase):
    def setUp(self):
        self.group = Group.objects.create(name=settings.BASIC_ACCESS_GROUP)
        self.user = factories.UserFactory.create(
            is_superuser=False, groups=[self.group]
        )
        pemission_can_view_companies = Permission.objects.get(
            codename="view_company",
            content_type=ContentType.objects.get_for_model(Company),
        )
        self.user.user_permissions.add(pemission_can_view_companies)
        self.client = Client()
        self.client.force_login(self.user)

    def soup(self):
        response = self.client.get("/")
        assert response.status_code == 200
        return BeautifulSoup(response.content.decode(response.charset), features="lxml")

    @pytest.mark.django_db
    def test_no_companies_appear(self):
        response = self.client.get("/")
        assert response.status_code == 200
        response.template_name == "core/index.html"
        soup = BeautifulSoup(response.content.decode(response.charset), features="lxml")
        h1_text = soup.find("h1").contents[0]
        assert h1_text == "Full list of companies in this tool"
        companies = soup.find_all("li")
        assert len(companies) == 0

    @pytest.mark.django_db
    def test_companies_appear(self):
        # create three companies
        for _ in range(3):
            factories.CompanyFactory.create()
        # create fourth company that user manages
        company = factories.CompanyFactory.create()
        factories.CompanyAccountManagerFactory(
            company=company, account_manager=self.user
        )
        soup = self.soup()
        all_comp_p = soup.find(
            "p", string=re.compile(r"\bThere are 4 companies\b")
        ).contents[0]
        assert (
            all_comp_p
            == "There are 4 companies. You'll only be able to edit and add information to companies you're assigned to."
        )
        companies = soup.select("ul#scl-company-list > li")
        assert len(companies) == 4
        your_comp_h1 = soup.find(
            "h1", string=re.compile(r"\bYour companies\b")
        ).contents[0]
        assert your_comp_h1 == "Your companies"
        your_companies = soup.select("ul#your-scl-company-list > li")
        assert len(your_companies) == 1

    @pytest.mark.django_db
    def test_engagements_appear_in_date_order(self):
        for i in range(3):
            company = factories.CompanyFactory.create()
            factories.CompanyAccountManagerFactory(
                company=company, account_manager=self.user
            )
            factories.EngagementFactory.create(
                company=company, date=datetime(2100, 1, 1 + i), title=i
            )
        soup = self.soup()
        engagements = soup.select("a[href^='/engagement']")
        assert len(engagements) == 3
        assert "3 Jan" in engagements[0].text
        assert "1 Jan" in engagements[2].text

    @pytest.mark.django_db
    def test_out_of_date_engagements_not_visible(self):
        company = factories.CompanyFactory.create()
        factories.CompanyAccountManagerFactory(
            company=company, account_manager=self.user
        )
        factories.EngagementFactory.create(company=company, date=datetime(2000, 12, 31))
        soup = self.soup()
        engagements = soup.select("a[href^='/engagement']")
        assert len(engagements) == 0

    @pytest.mark.django_db
    def test_handler403(self):
        request = self.client.get("/")
        response = html.custom_403_view(request)
        assert response.status_code == 403
        assert response.template_name == "403_generic.html"


@pytest.mark.django_db
def test_engagement_detail_200(viewer_user, viewer_user_client):
    with reversion.create_revision():
        engagement = factories.EngagementFactory()
        reversion.set_user(viewer_user)
    response = viewer_user_client.get(
        reverse("engagement", kwargs={"pk": engagement.id})
    )

    assert response.status_code == 200
    assert response.template_name == ["engagement.html"]


@pytest.mark.django_db
def test_company_detail_200(viewer_user, viewer_user_client):
    with reversion.create_revision():
        company = factories.CompanyFactory()
        reversion.set_user(viewer_user)
        factories.CompanyAccountManagerFactory.create(
            company=company, account_manager=viewer_user
        )
    response = viewer_user_client.get(
        reverse("company-briefing", kwargs={"duns_number": company.duns_number})
    )

    assert response.status_code == 200
    assert response.template_name == ["company.html"]


@pytest.mark.django_db
def test_company_engagement_list_200(viewer_user, viewer_user_client):
    with reversion.create_revision():
        company = factories.CompanyFactory()
        reversion.set_user(viewer_user)
        factories.EngagementFactory.create(company=company)
        factories.EngagementFactory.create(company=company)
        factories.EngagementFactory.create(company=company)

    response = viewer_user_client.get(
        reverse("company-engagements", kwargs={"duns_number": company.duns_number})
    )

    assert response.status_code == 200
    assert response.template_name == ["enagagements_total.html"]
