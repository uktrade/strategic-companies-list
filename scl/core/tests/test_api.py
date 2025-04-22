import pytest
import json
import reversion

from django.urls import reverse

from scl.core.constants import COUNTRIES_AND_TERRITORIES, SECTORS
from scl.core.models import Insight
from scl.core.tests import factories


@pytest.mark.django_db
@pytest.mark.parametrize("method,exp_status", [("get", 200), ("patch", 403)])
def test_company_api_authorisation(method, exp_status, viewer_user, viewer_user_client):
    with reversion.create_revision():
        company = factories.CompanyFactory()
        reversion.set_user(viewer_user)

    if method == "patch":
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse("api-company", kwargs={"duns_number": company.duns_number}),
            json.dumps(data),
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse("api-company", kwargs={"duns_number": company.duns_number}),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 200), ("post", 403), ("patch", 403), ("delete", 403)]
)
def test_company_insight_api_authorisation(
    method, exp_status, viewer_user, viewer_user_client
):
    with reversion.create_revision():
        company = factories.CompanyFactory()
        reversion.set_user(viewer_user)

    if method in ["post", "patch"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-company-insight",
                kwargs={
                    "duns_number": company.duns_number,
                    "insight_type": Insight.TYPE_HMG_PRIORITY,
                },
            ),
            json.dumps(data),
            content_type="application/json",
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-company-insight",
                kwargs={
                    "duns_number": company.duns_number,
                    "insight_type": Insight.TYPE_HMG_PRIORITY,
                },
            ),
        )

    assert response.status_code == exp_status


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


@pytest.mark.django_db
def test_company_insight_api_get(viewer_user_client, company):
    response_hmg = viewer_user_client.get(
        reverse(
            "api-company-insight",
            kwargs={
                "duns_number": company.duns_number,
                "insight_type": Insight.TYPE_HMG_PRIORITY,
            },
        ),
    )

    assert response_hmg.status_code == 200
    response_data = json.loads(response_hmg.content)

    assert len(response_data["insights"]) == 6
    assert {
        str(i)
        for i in company.insights.filter(
            insight_type=Insight.TYPE_HMG_PRIORITY
        ).values_list(
            "id",
            flat=True,
        )
    } == {i["insightId"] for i in response_data["insights"]}

    response_company = viewer_user_client.get(
        reverse(
            "api-company-insight",
            kwargs={
                "duns_number": company.duns_number,
                "insight_type": Insight.TYPE_COMPANY_PRIORITY,
            },
        ),
    )

    assert response_company.status_code == 200
    response_data = json.loads(response_company.content)

    assert len(response_data["insights"]) == 5
    assert {
        str(i)
        for i in company.insights.filter(
            insight_type=Insight.TYPE_COMPANY_PRIORITY
        ).values_list(
            "id",
            flat=True,
        )
    } == {i["insightId"] for i in response_data["insights"]}


@pytest.mark.django_db
def test_company_insight_api_post(viewer_user_client, company):
    # sanity check
    assert company.insights.filter(insight_type=Insight.TYPE_HMG_PRIORITY).count() == 6

    data = {
        "title": "Foo",
        "details": "Lorem ipsum dolor sit amet",
    }
    response = viewer_user_client.post(
        reverse(
            "api-company-insight",
            kwargs={
                "duns_number": company.duns_number,
                "insight_type": Insight.TYPE_HMG_PRIORITY,
            },
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200
    response_data = json.loads(response.content)

    assert response_data["data"][0]["title"] == "Foo"
    assert response_data["data"][0]["details"] == "Lorem ipsum dolor sit amet"
    assert len(response_data["data"]) == 7


@pytest.mark.django_db
def test_company_insight_api_patch(viewer_user_client, company):
    # sanity check
    existing_insights = company.insights.filter(insight_type=Insight.TYPE_HMG_PRIORITY)
    assert existing_insights.count() == 6

    data = [
        {
            "insightId": str(existing_insights[0].id),
            "title": "Update 1",
            "details": "Lorem ipsum",
        },
        {
            "insightId": str(existing_insights[1].id),
            "title": "Update 2",
            "details": "Dolor sit amet",
        },
    ]
    response = viewer_user_client.patch(
        reverse(
            "api-company-insight",
            kwargs={
                "duns_number": company.duns_number,
                "insight_type": Insight.TYPE_HMG_PRIORITY,
            },
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200
    response_data = json.loads(response.content)

    assert response_data["data"][0]["title"] == "Update 1"
    assert response_data["data"][0]["details"] == "Lorem ipsum"
    assert response_data["data"][1]["title"] == "Update 2"
    assert response_data["data"][1]["details"] == "Dolor sit amet"
    assert len(response_data["data"]) == 6


@pytest.mark.django_db
def test_company_insight_api_delete(viewer_user_client, company):
    # sanity check
    existing_insights = company.insights.filter(insight_type=Insight.TYPE_HMG_PRIORITY)
    assert existing_insights.count() == 6

    insight_to_delete = existing_insights[0]
    insight_id = str(insight_to_delete.id)

    data = {
        "insightId": insight_id,
    }
    response = viewer_user_client.delete(
        reverse(
            "api-company-insight",
            kwargs={
                "duns_number": company.duns_number,
                "insight_type": Insight.TYPE_HMG_PRIORITY,
            },
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200
    response_data = json.loads(response.content)

    assert insight_id not in [i["insightId"] for i in response_data["data"]]
    assert len(response_data["data"]) == 5
