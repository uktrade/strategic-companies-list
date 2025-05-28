import json
from unittest import mock

import pytest
import reversion
from django.urls import reverse
from waffle.testutils import override_flag

from scl.core.constants import DATE_FORMAT_NUMERIC, DATE_FORMAT_SHORT
from scl.core.models import EngagementNote, Insight
from scl.core.tests import factories


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 200), ("post", 405), ("patch", 403), ("delete", 405)]
)
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
    method, exp_status, viewer_user_client, company_not_acc_manager
):
    if method in ["post", "patch", "delete"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-company-insight",
                kwargs={
                    "duns_number": company_not_acc_manager.duns_number,
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
                    "duns_number": company_not_acc_manager.duns_number,
                    "insight_type": Insight.TYPE_HMG_PRIORITY,
                },
            ),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
def test_company_api_patch(
    super_access_user_client, viewer_user_client, company_acc_manager
):
    data = {
        "title": "Company name",
        "sectors": [
            {"value": "SL0001", "label": "Advanced engineering"},
            {"value": "SL0011", "label": "Aerospace"},
        ],
    }

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.patch(
            reverse(
                "api-company",
                kwargs={"duns_number": company_acc_manager.duns_number},
            ),
            json.dumps(data),
        )

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data["data"]["title"] == "Company name"
        assert response_data["data"]["company_sectors"] == [
            {"label": "Advanced engineering", "value": "SL0001"},
            {"label": "Aerospace", "value": "SL0011"},
        ]


@pytest.mark.django_db
def test_company_api_get(viewer_user_client, company_acc_manager):
    response = viewer_user_client.get(
        reverse("api-company", kwargs={"duns_number": company_acc_manager.duns_number}),
    )

    assert response.status_code == 200
    response_data = json.loads(response.content)
    assert response_data["data"]["title"] == company_acc_manager.name
    assert response_data["data"]["duns_number"] == company_acc_manager.duns_number
    assert response_data["data"]["summary"] == company_acc_manager.summary


@pytest.mark.django_db
def test_company_insight_api_get(viewer_user_client, company_acc_manager):
    response_hmg = viewer_user_client.get(
        reverse(
            "api-company-insight",
            kwargs={
                "duns_number": company_acc_manager.duns_number,
                "insight_type": Insight.TYPE_HMG_PRIORITY,
            },
        ),
    )

    assert response_hmg.status_code == 200
    response_data = json.loads(response_hmg.content)

    assert len(response_data["insights"]) == 6
    assert {
        str(i)
        for i in company_acc_manager.insights.filter(
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
                "duns_number": company_acc_manager.duns_number,
                "insight_type": Insight.TYPE_COMPANY_PRIORITY,
            },
        ),
    )

    assert response_company.status_code == 200
    response_data = json.loads(response_company.content)

    assert len(response_data["insights"]) == 5
    assert {
        str(i)
        for i in company_acc_manager.insights.filter(
            insight_type=Insight.TYPE_COMPANY_PRIORITY
        ).values_list(
            "id",
            flat=True,
        )
    } == {i["insightId"] for i in response_data["insights"]}


@pytest.mark.django_db
def test_company_insight_api_post(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    assert (
        company_acc_manager.insights.filter(
            insight_type=Insight.TYPE_HMG_PRIORITY
        ).count()
        == 6
    )

    data = {
        "title": "Foo",
        "details": "Lorem ipsum dolor sit amet",
    }

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.post(
            reverse(
                "api-company-insight",
                kwargs={
                    "duns_number": company_acc_manager.duns_number,
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
    assert len(response_data["data"]) == 8


@pytest.mark.django_db
def test_company_insight_api_patch(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    existing_insights = company_acc_manager.insights.filter(
        insight_type=Insight.TYPE_HMG_PRIORITY
    )
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

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:

        response = client.patch(
            reverse(
                "api-company-insight",
                kwargs={
                    "duns_number": company_acc_manager.duns_number,
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
def test_company_insight_api_delete(
    viewer_user_client, super_access_user_client, company_acc_manager
):

    # sanity check
    existing_insights = company_acc_manager.insights.filter(
        insight_type=Insight.TYPE_HMG_PRIORITY
    )
    assert existing_insights.count() == 6

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:

        insight_to_delete = existing_insights[0]
        insight_id = str(insight_to_delete.id)

        data = {
            "insightId": insight_id,
        }
        response = client.delete(
            reverse(
                "api-company-insight",
                kwargs={
                    "duns_number": company_acc_manager.duns_number,
                    "insight_type": Insight.TYPE_HMG_PRIORITY,
                },
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200
        response_data = json.loads(response.content)

        assert insight_id not in [i["insightId"] for i in response_data["data"]]
    assert len(response_data["data"]) == 4


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 200), ("post", 403), ("patch", 403), ("delete", 403)]
)
def test_key_people_api_methods_authorisation(
    method, exp_status, viewer_user_client, company_not_acc_manager
):
    if method in ["post", "patch", "delete"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-key-people",
                kwargs={
                    "duns_number": company_not_acc_manager.duns_number,
                },
            ),
            json.dumps(data),
            content_type="application/json",
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-key-people",
                kwargs={
                    "duns_number": company_not_acc_manager.duns_number,
                },
            ),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
def test_key_people_api_get(viewer_user_client, company_acc_manager):
    response = viewer_user_client.get(
        reverse(
            "api-key-people", kwargs={"duns_number": company_acc_manager.duns_number}
        )
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)
    assert len(response_data["keyPeople"]) == company_acc_manager.key_people.count()


@pytest.mark.django_db
def test_key_people_api_post(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    assert company_acc_manager.key_people.count() == 3
    data = {
        "name": "John Smith",
        "role": "CEO",
        "email": "john.smith@company.co.uk",
    }

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.post(
            reverse(
                "api-key-people",
                kwargs={"duns_number": company_acc_manager.duns_number},
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)
        assert "John Smith" in [d["name"] for d in response_data["data"]]
        assert "john.smith@company.co.uk" in [d["email"] for d in response_data["data"]]
    assert len(response_data["data"]) == 5


@pytest.mark.django_db
def test_key_people_api_patch(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    assert company_acc_manager.key_people.count() == 3
    key_person = company_acc_manager.key_people.first()
    data = [
        {
            "name": "John Smith",
            "role": "CEO",
            "userId": str(key_person.id),
            "email": "john.smith@company.co.uk",
        }
    ]

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.patch(
            reverse(
                "api-key-people",
                kwargs={"duns_number": company_acc_manager.duns_number},
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)
        assert len(response_data["data"]) == 3

        updated = [
            d for d in response_data["data"] if d["userId"] == str(key_person.id)
        ][0]
        assert updated["name"] == "John Smith"
        assert updated["role"] == "CEO"
        assert updated["email"] == "john.smith@company.co.uk"


@pytest.mark.django_db
def test_key_people_api_delete(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    assert company_acc_manager.key_people.count() == 3

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        key_person = company_acc_manager.key_people.first()
        data = {
            "id": str(key_person.id),
        }
        response = client.delete(
            reverse(
                "api-key-people",
                kwargs={"duns_number": company_acc_manager.duns_number},
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)

        assert "John Smith" not in [d["name"] for d in response_data["data"]]
        assert "CEO" not in [d["role"] for d in response_data["data"]]
        assert "john.smith@company.co.uk" not in [
            d["email"] for d in response_data["data"]
        ]
    assert len(response_data["data"]) == 1


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 405), ("post", 403), ("patch", 403), ("delete", 403)]
)
def test_engagement_note_api_methods_authorisation_for_non_acc(
    method, exp_status, viewer_user_client, company_not_acc_manager
):
    engagement = company_not_acc_manager.engagements.first()
    if method in ["post", "patch", "delete"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-engagement-note",
                kwargs={"engagement_id": engagement.id},
            ),
            json.dumps(data),
            content_type="application/json",
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-engagement-note",
                kwargs={"engagement_id": engagement.id},
            ),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
def test_engagement_note_api_post(viewer_user, viewer_user_client, company_acc_manager):
    total_notes = EngagementNote.objects.all()
    total_user_notes = EngagementNote.objects.filter(created_by=viewer_user)
    engagement = total_user_notes.first().engagement

    # sanity check
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2
    data = {
        "contents": "   Lorem ipsum 1234  \n",
    }

    response = viewer_user_client.post(
        reverse(
            "api-engagement-note",
            kwargs={"engagement_id": engagement.id},
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)
    assert "Lorem ipsum 1234" in [d["contents"] for d in response_data["data"]]
    assert len(response_data["data"]) == 3
    assert total_notes.count() == 6
    assert total_user_notes.count() == 3


@pytest.mark.django_db
def test_engagement_note_api_post_super_access_user(
    super_access_user, super_access_user_client, company_not_acc_manager
):
    total_notes = EngagementNote.objects.all()
    total_user_notes = EngagementNote.objects.filter(created_by=super_access_user)
    engagement = total_user_notes.first().engagement

    # sanity check
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2
    data = {
        "contents": "   Lorem ipsum 1234  \n",
    }

    response = super_access_user_client.post(
        reverse(
            "api-engagement-note",
            kwargs={"engagement_id": engagement.id},
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)
    assert "Lorem ipsum 1234" in [d["contents"] for d in response_data["data"]]
    assert len(response_data["data"]) == 3
    assert total_notes.count() == 6
    assert total_user_notes.count() == 3


@pytest.mark.django_db
def test_engagement_note_api_patch(
    viewer_user, viewer_user_client, company_acc_manager
):
    total_notes = EngagementNote.objects.all()
    total_user_notes = total_notes.filter(created_by=viewer_user)
    engagement = total_user_notes.first().engagement
    engagement_note = total_user_notes.first()

    # sanity check
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2
    data = {
        "notes": [
            {
                "contents": "Lorem ipsum",
                "noteId": str(engagement_note.id),
            }
        ]
    }

    response = viewer_user_client.patch(
        reverse(
            "api-engagement-note",
            kwargs={"engagement_id": engagement.id},
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)

    updated = [
        d for d in response_data["data"] if d["noteId"] == str(engagement_note.id)
    ]

    assert updated[0]["contents"] == "Lorem ipsum"
    assert len(response_data["data"]) == 2
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2


@pytest.mark.django_db
def test_engagement_note_api_patch_super_access_user(
    super_access_user, super_access_user_client, company_not_acc_manager
):
    total_notes = EngagementNote.objects.all()
    total_user_notes = total_notes.filter(created_by=super_access_user)
    engagement = total_user_notes.first().engagement
    engagement_note = total_user_notes.first()

    # sanity check
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2
    data = {
        "notes": [
            {
                "contents": "Lorem ipsum",
                "noteId": str(engagement_note.id),
            }
        ]
    }

    response = super_access_user_client.patch(
        reverse(
            "api-engagement-note",
            kwargs={"engagement_id": engagement.id},
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)

    updated = [
        d for d in response_data["data"] if d["noteId"] == str(engagement_note.id)
    ]

    assert updated[0]["contents"] == "Lorem ipsum"
    assert len(response_data["data"]) == 2
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2


@pytest.mark.django_db
def test_engagement_note_api_delete(
    viewer_user, viewer_user_client, company_acc_manager
):
    total_notes = EngagementNote.objects.all()
    total_user_notes = total_notes.filter(created_by=viewer_user)
    engagement = total_user_notes.first().engagement
    engagement_note = total_user_notes.first()

    # sanity check
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2

    engagement_note = EngagementNote.objects.filter(created_by=viewer_user).first()
    engagement = engagement_note.engagement
    data = {
        "id": str(engagement_note.id),
    }
    response = viewer_user_client.delete(
        reverse(
            "api-engagement-note",
            kwargs={"engagement_id": engagement.id},
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)

    assert str(engagement_note.id) not in [d["noteId"] for d in response_data["data"]]
    assert len(response_data["data"]) == 1
    assert total_notes.count() == 4


@pytest.mark.django_db
def test_engagement_note_api_delete_super_access_user(
    super_access_user, super_access_user_client, company_not_acc_manager
):
    total_notes = EngagementNote.objects.all()
    total_user_notes = total_notes.filter(created_by=super_access_user)
    engagement = total_user_notes.first().engagement
    engagement_note = total_user_notes.first()

    # sanity check
    assert total_notes.count() == 5
    assert total_user_notes.count() == 2

    engagement_note = EngagementNote.objects.filter(
        created_by=super_access_user
    ).first()
    engagement = engagement_note.engagement
    data = {
        "id": str(engagement_note.id),
    }
    response = super_access_user_client.delete(
        reverse(
            "api-engagement-note",
            kwargs={"engagement_id": engagement.id},
        ),
        json.dumps(data),
        content_type="application/json",
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)

    assert str(engagement_note.id) not in [d["noteId"] for d in response_data["data"]]
    assert len(response_data["data"]) == 1
    assert total_notes.count() == 4


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 200), ("post", 405), ("patch", 403), ("delete", 403)]
)
def test_insight_api_methods_authorisation(
    method, exp_status, viewer_user_client, company_not_acc_manager
):
    insight = company_not_acc_manager.insights.first()
    if method in ["post", "patch", "delete"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-insight",
                kwargs={"insight_id": insight.id},
            ),
            json.dumps(data),
            content_type="application/json",
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-insight",
                kwargs={"insight_id": insight.id},
            ),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
def test_insight_api_get(viewer_user_client, company_acc_manager):
    insight = company_acc_manager.insights.first()
    response = viewer_user_client.get(
        reverse(
            "api-insight",
            kwargs={"insight_id": insight.id},
        ),
    )

    assert response.status_code == 200

    response_data = json.loads(response.content)

    assert response_data["id"] == str(insight.id)
    assert response_data["title"] == insight.title
    assert response_data["details"] == insight.details
    assert response_data["created_by"] == insight.created_by.get_full_name()
    assert response_data["created_at"] == insight.created_at.isoformat()
    assert response_data["order"] == insight.order


@pytest.mark.django_db
def test_insight_api_patch(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    insight = company_acc_manager.insights.first()
    # sanity check
    assert company_acc_manager.insights.count() == 11
    data = {
        "title": "Foo",
        "details": "Lorem ipsum dolor sit amet",
        "order": 1,
    }

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.patch(
            reverse(
                "api-insight",
                kwargs={"insight_id": insight.id},
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)
        assert company_acc_manager.insights.count() == 11

        assert response_data["id"] == str(insight.id)
        assert response_data["title"] == "Foo"
        assert response_data["details"] == "Lorem ipsum dolor sit amet"
        assert response_data["created_by"] == insight.created_by.get_full_name()
        assert response_data["created_at"] == insight.created_at.isoformat()
        assert response_data["order"] == 1


@pytest.mark.django_db
def test_insight_api_delete(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    assert company_acc_manager.insights.count() == 11

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        insight = company_acc_manager.insights.first()
        response = client.delete(
            reverse(
                "api-insight",
                kwargs={"insight_id": insight.id},
            ),
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)

        assert response_data["status"] == "success"
    assert company_acc_manager.insights.count() == 9


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 405), ("post", 405), ("patch", 403), ("delete", 405)]
)
def test_engagement_api_methods_authorisation(
    method, exp_status, viewer_user_client, company_not_acc_manager
):
    engagement = company_not_acc_manager.engagements.first()
    if method in ["post", "patch", "delete"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-engagement",
                kwargs={"engagement_id": engagement.id},
            ),
            json.dumps(data),
            content_type="application/json",
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-engagement",
                kwargs={"engagement_id": engagement.id},
            ),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
def test_engagement_api_patch(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    engagement = company_acc_manager.engagements.first()
    # sanity check
    assert company_acc_manager.engagements.count() == 4
    data = {
        "title": "Foo",
        "agenda": "Lorem ipsum dolor sit amet",
        "date": engagement.date.strftime(DATE_FORMAT_NUMERIC),
        "engagementType": "Letter",
        "civilServants": ["Bob", "Sarah"],
        "companyRepresentatives": ["Jack", "Jill"],
        "ministers": ["Louise", "Jenny"],
        "outcomes": "An outcome",
        "actions": "An action",
    }

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.patch(
            reverse(
                "api-engagement",
                kwargs={"engagement_id": engagement.id},
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)
        assert company_acc_manager.engagements.count() == 4

        assert response_data["data"]["id"] == str(engagement.id)
        assert response_data["data"]["title"] == "Foo"
        assert response_data["data"]["agenda"] == "Lorem ipsum dolor sit amet"
        assert response_data["data"]["date"] == engagement.date.strftime(
            DATE_FORMAT_SHORT
        )
        assert response_data["data"]["engagement_type"] == "Letter"
        assert response_data["data"]["civil_servants"] == ["Bob", "Sarah"]
        assert response_data["data"]["company_representatives"] == ["Jack", "Jill"]
        assert response_data["data"]["ministers"] == ["Louise", "Jenny"]
        assert response_data["data"]["outcomes"] == "An outcome"
        assert response_data["data"]["actions"] == "An action"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "method,exp_status", [("get", 405), ("post", 403), ("patch", 405), ("delete", 405)]
)
def test_company_engagement_api_methods_authorisation(
    method, exp_status, viewer_user_client, company_not_acc_manager
):
    engagement = company_not_acc_manager.engagements.first()
    if method in ["post", "patch", "delete"]:
        data = {}
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-company-engagement",
                kwargs={"duns_number": engagement.company.duns_number},
            ),
            json.dumps(data),
            content_type="application/json",
        )

    else:
        response = getattr(viewer_user_client, method)(
            reverse(
                "api-company-engagement",
                kwargs={"duns_number": engagement.company.duns_number},
            ),
        )

    assert response.status_code == exp_status


@pytest.mark.django_db
def test_company_engagement_api_post(
    viewer_user_client, super_access_user_client, company_acc_manager
):
    # sanity check
    assert company_acc_manager.engagements.count() == 4
    data = {
        "title": "Foo",
        "agenda": "Lorem ipsum dolor sit amet",
        "date": "2040-01-25",
        "engagementType": "Letter",
        "civilServants": ["Bob", "Sarah"],
        "companyRepresentatives": ["Jack", "Jill"],
        "ministers": ["Louise", "Jenny"],
        "outcomes": "An outcome",
        "actions": "An action",
    }

    clients = [super_access_user_client, viewer_user_client]

    for client in clients:
        response = client.post(
            reverse(
                "api-company-engagement",
                kwargs={"duns_number": company_acc_manager.duns_number},
            ),
            json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200

        response_data = json.loads(response.content)

        # API only returns the 4 most recent engagements
        assert "Foo" in [d["title"] for d in response_data["data"]]
        assert "Lorem ipsum dolor sit amet" in [
            d["agenda"] for d in response_data["data"]
        ]
        assert "Letter" in [d["engagement_type"] for d in response_data["data"]]
        assert ["Louise", "Jenny"] in [d["ministers"] for d in response_data["data"]]
        assert ["Bob", "Sarah"] in [d["civil_servants"] for d in response_data["data"]]
        assert ["Jack", "Jill"] in [
            d["company_representatives"] for d in response_data["data"]
        ]
        assert ["Louise", "Jenny", "Bob", "Sarah", "Jack", "Jill"] in [
            d["all_attendees"] for d in response_data["data"]
        ]
        assert "January 25 2040" in [d["date"] for d in response_data["data"]]
    assert company_acc_manager.engagements.count() == 6


@pytest.mark.django_db
def test_aws_creds_api_not_acc_manager_403(viewer_user_client):
    response = viewer_user_client.get(
        reverse(
            "api-aws-temporary-credentials",
        ),
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_aws_creds_api_flag_off_403(viewer_user_client, company_acc_manager):
    with override_flag("AWS_TRANSCRIBE", active=False):
        response = viewer_user_client.get(
            reverse(
                "api-aws-temporary-credentials",
            ),
        )

    assert response.status_code == 403


@pytest.mark.django_db
def test_aws_creds_api_disable_transcribe_503(
    viewer_user_client, company_acc_manager, settings
):
    settings.DISABLE_TRANSCRIBE = True
    response = viewer_user_client.get(
        reverse(
            "api-aws-temporary-credentials",
        ),
    )

    assert response.status_code == 503


@pytest.mark.django_db
@mock.patch("scl.core.views.api.AWSTemporaryCredentialsAPIView.client")
def test_aws_creds_api_flag_on_200(
    mock_client, viewer_user_client, company_acc_manager, settings
):
    settings.AWS_TRANSCRIBE_ROLE_ARN = "Test"
    mock_response = {
        "Credentials": {
            "AccessKeyId": "access key",
            "SecretAccessKey": "secret access key",
            "SessionToken": "session token",
            "Expiration": "expiration",
        }
    }
    mock_client.assume_role = mock.MagicMock(return_value=mock_response)

    with override_flag("AWS_TRANSCRIBE", active=True):
        response = viewer_user_client.get(
            reverse(
                "api-aws-temporary-credentials",
            ),
        )

    assert response.status_code == 200

    response_data = json.loads(response.content)
    assert set(response_data.keys()) == {
        "AccessKeyId",
        "SecretAccessKey",
        "SessionToken",
        "Expiration",
    }
