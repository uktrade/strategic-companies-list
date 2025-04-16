import pytest
import json
import reversion

from django.urls import reverse

from scl.core.constants import COUNTRIES_AND_TERRITORIES, SECTORS
from scl.core.tests import factories


@pytest.mark.django_db
def test_company_api_patch(viewer_user, viewer_user_client):
    with reversion.create_revision():
        company = factories.CompanyFactory()
        reversion.set_user(viewer_user)
        factories.CompanyAccountManagerFactory.create(
            company=company, account_manager=viewer_user
        )

    data = {
        "summary": "Lorem ipsum dolor sit amet",
        "title": "Company name",
        "sectors": [
            {"value": "SL0001", "label": "Advanced engineering"},
            {"value": "SL0011", "label": "Aerospace"},
        ],
    }

    response = viewer_user_client.patch(
        reverse("api-company", kwargs={"duns_number": company.duns_number}),
        json.dumps(data),
    )

    assert response.status_code == 200
    response_data = json.loads(response.content)
    assert response_data["data"]["title"] == "Company name"
    assert response_data["data"]["summary"] == "Lorem ipsum dolor sit amet"
    assert response_data["data"]["company_sectors"] == [
        {"label": "Advanced engineering", "value": "SL0001"},
        {"label": "Aerospace", "value": "SL0011"},
    ]


@pytest.mark.django_db
def test_company_api_get(viewer_user, viewer_user_client):
    with reversion.create_revision():
        company = factories.CompanyFactory()
        reversion.set_user(viewer_user)
        factories.CompanyAccountManagerFactory.create(
            company=company, account_manager=viewer_user
        )

    response = viewer_user_client.get(
        reverse("api-company", kwargs={"duns_number": company.duns_number}),
    )

    assert response.status_code == 200
    response_data = json.loads(response.content)
    assert response_data["data"]["title"] == company.name
    assert response_data["data"]["duns_number"] == company.duns_number
    assert response_data["data"]["summary"] == company.summary
