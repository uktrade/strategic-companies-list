import pytest

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import Group
import reversion

from scl.core.views import html
from scl.core.tests import factories


@pytest.mark.django_db
def test_home_page_gives_200_status(basic_access_user_client):
    response = basic_access_user_client.get("/")
    assert response.status_code == 200


@pytest.mark.django_db
def test_handler403(client):
    request = client.get("/")
    response = html.custom_403_view(request)

    assert response.status_code == 403
    assert response.template_name == "core/403_generic.html"


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
    assert response.template_name == ["company_engagements.html"]
