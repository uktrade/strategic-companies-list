import json

import pytest
import reversion
from django.contrib.auth.models import Group
from django.test import Client, TestCase
from django.urls import reverse
from django.conf import settings

from scl.core.tests import factories


class EngagementPageTest(TestCase):
    def setUp(self):
        self.group = Group.objects.create(name=settings.BASIC_ACCESS_GROUP)
        self.user = factories.UserFactory.create(
            is_superuser=False, groups=[self.group]
        )
        self.viewer_group = Group.objects.create(name=settings.VIEWER_ACCESS_GROUP)
        self.viewer_user = factories.UserFactory.create(
            groups=[self.viewer_group, self.group]
        )
        self.super_access_group = Group.objects.create(name=settings.SUPER_ACCESS_GROUP)
        self.super_access_user = factories.UserFactory.create(
            groups=[self.viewer_group, self.super_access_group, self.group]
        )
        self.client = Client()
        self.client.force_login(self.user)

        self.account_manager = factories.UserFactory.create(
            groups=[self.viewer_group, self.group]
        )
        company = factories.CompanyFactory.create()
        factories.CompanyAccountManagerFactory(
            company=company, account_manager=self.account_manager
        )
        with reversion.create_revision():
            self.engagement = factories.EngagementFactory(
                company=company, title="Engagement"
            )
            factories.EngagementNoteFactory(
                created_by=self.account_manager, engagement=self.engagement
            )
            reversion.set_user(self.account_manager)

    @pytest.mark.django_db
    def test_basic_access_cannot_access_engagements(self):
        response = self.client.get(
            reverse("engagement", kwargs={"pk": self.engagement.id})
        )
        assert response.status_code == 403

    @pytest.mark.django_db
    def test_non_account_manager_cannot_access_notes(self):
        viewer_client = Client()
        viewer_client.force_login(self.viewer_user)
        response = viewer_client.get(
            reverse("engagement", kwargs={"pk": self.engagement.id})
        )
        assert response.status_code == 200
        data = json.loads(response.context["props"])
        assert not data.get("notes", None)

    @pytest.mark.django_db
    def test_account_manager_can_access_notes(self):
        account_manager_client = Client()
        account_manager_client.force_login(self.account_manager)
        response = account_manager_client.get(
            reverse("engagement", kwargs={"pk": self.engagement.id})
        )
        assert response.status_code == 200
        data = json.loads(response.context["props"])
        assert data.get("notes", None)

    @pytest.mark.django_db
    def test_account_manager_can_edit_details(self):
        account_manager_client = Client()
        account_manager_client.force_login(self.account_manager)
        api_url = reverse(
            "api-engagement", kwargs={"engagement_id": self.engagement.id}
        )
        patch_data = {
            "title": "new title",
            "agenda": "new agenda",
            "date": "2040-01-25",
            "engagementType": "Letter",
            "civilServants": ["Bob", "Sarah"],
            "companyRepresentatives": ["Jack", "Jill"],
            "ministers": ["Louise", "Jenny"],
            "outcomes": "An outcome",
            "actions": "An action",
        }
        response = account_manager_client.patch(
            api_url, json.dumps(patch_data), content_type="application/json"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["title"] == "new title"
        assert data["data"]["agenda"] == "new agenda"
        self.engagement.refresh_from_db()
        assert self.engagement.title == "new title"
        assert self.engagement.agenda == "new agenda"
        assert self.engagement.engagement_type == "letter"
        assert self.engagement.civil_servants == ["Bob", "Sarah"]
        assert self.engagement.company_representatives == ["Jack", "Jill"]
        assert self.engagement.ministers == ["Louise", "Jenny"]
        assert self.engagement.outcomes == "An outcome"
        assert self.engagement.actions == "An action"

    @pytest.mark.django_db
    def test_non_account_manager_cannot_edit_details(self):
        viewer_client = Client()
        viewer_client.force_login(self.viewer_user)
        api_url = reverse(
            "api-engagement", kwargs={"engagement_id": self.engagement.id}
        )
        patch_data = {"title": "new title", "details": "new details"}
        response = viewer_client.patch(
            api_url, json.dumps(patch_data), content_type="application/json"
        )
        assert response.status_code == 403

    @pytest.mark.django_db
    def test_super_access_user_cannot_access_other_users_notes(self):
        super_access_user_client = Client()
        super_access_user_client.force_login(self.super_access_user)
        response = super_access_user_client.get(
            reverse("engagement", kwargs={"pk": self.engagement.id})
        )
        assert response.status_code == 200
        data = json.loads(response.context["props"])

        assert not data.get("notes", None)


@pytest.mark.django_db
def test_engagement_list_page_basic_access_unauthorised(
    basic_access_user_client, company_acc_manager
):
    response = basic_access_user_client.get(
        reverse(
            "company-engagements",
            kwargs={"duns_number": company_acc_manager.duns_number},
        )
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_engagement_list_page_viewer_access(viewer_user_client, company_acc_manager):
    response = viewer_user_client.get(
        reverse(
            "company-engagements",
            kwargs={"duns_number": company_acc_manager.duns_number},
        )
    )
    assert response.status_code == 200
