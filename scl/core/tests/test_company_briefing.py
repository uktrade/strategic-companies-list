import json
import pytest

from django.urls import reverse


@pytest.mark.django_db
def test_company_briefing_basic_access(company, basic_access_user_client):
    response = basic_access_user_client.get(
        reverse("company-briefing", kwargs={"duns_number": company.duns_number})
    )
    assert response.status_code == 200
    data = json.loads(response.context["props"])

    # data for Page component
    assert data.get("duns_number") == company.duns_number
    assert len(data.get("key_people")) == 3
    assert len(data.get("account_managers")) == 2

    # data for CompanyDetails component
    assert data.get("company_sectors")
    assert data.get("title") == company.name

    # data for KeyFacts component
    assert data.get("global_hq_country") == company.get_global_hq_country_display()
    assert data.get("turn_over") == company.global_turnover_millions_usd
    assert (
        int(data.get("employees").replace(",", ""))
        == company.global_number_of_employees
    )

    # needs Viewer access
    assert not data.get("engagements")
    assert not data.get("hmg_priorities")
    assert not data.get("company_priorities")


@pytest.mark.django_db
def test_company_briefing_viewer_access(company, viewer_user_client):
    response = viewer_user_client.get(
        reverse("company-briefing", kwargs={"duns_number": company.duns_number})
    )
    assert response.status_code == 200
    data = json.loads(response.context["props"])

    # data for Page component
    assert data.get("duns_number") == company.duns_number
    assert len(data.get("key_people")) == 3
    assert len(data.get("account_managers")) == 2

    # data for CompanyDetails component
    assert data.get("company_sectors")
    assert data.get("title") == company.name

    # data for KeyFacts component
    assert data.get("global_hq_country") == company.get_global_hq_country_display()
    assert data.get("turn_over") == company.global_turnover_millions_usd
    assert (
        int(data.get("employees").replace(",", ""))
        == company.global_number_of_employees
    )

    assert len(data.get("engagements")) == 4
    assert len(data.get("hmg_priorities")) == 6
    assert len(data.get("company_priorities")) == 5
