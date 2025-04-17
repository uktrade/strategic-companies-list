import pytest
import reversion

from django.contrib.auth.models import Group

from scl.core.tests import factories


@pytest.fixture
@pytest.mark.django_db
def basic_access_group():
    return Group.objects.create(name="Basic access")


@pytest.fixture
@pytest.mark.django_db
def viewer_group():
    return Group.objects.create(name="Viewer")


@pytest.fixture
@pytest.mark.django_db
def basic_access_user(basic_access_group):
    user = factories.UserFactory.create(is_superuser=False, groups=[basic_access_group])
    return user


@pytest.fixture
@pytest.mark.django_db
def basic_access_user_client(client, basic_access_user):
    client.force_login(basic_access_user)
    return client


@pytest.fixture
@pytest.mark.django_db
def viewer_user(basic_access_group, viewer_group):
    user = factories.UserFactory.create(
        is_superuser=False, groups=[basic_access_group, viewer_group]
    )
    return user


@pytest.fixture
@pytest.mark.django_db
def viewer_user_client(client, viewer_user):
    client.force_login(viewer_user)
    return client


@pytest.fixture
@pytest.mark.django_db
def company(viewer_user):
    with reversion.create_revision():
        company = factories.CompanyFactory()

        reversion.set_user(viewer_user)

        factories.CompanyAccountManagerFactory.create(
            company=company, account_manager=viewer_user, is_lead=True
        )
        acc_manager = factories.CompanyAccountManagerFactory.create(company=company)

        factories.KeyPeopleFactory.create_batch(3, company=company)

        factories.InsightFactory.create_batch(
            5, company=company, insight_type="company_priority"
        )
        factories.InsightFactory.create_batch(
            6, company=company, insight_type="hmg_priority"
        )

        engagements = factories.EngagementFactory.create_batch(4, company=company)
        factories.EngagementNoteFactory.create_batch(
            3, engagement=engagements[0], created_by=acc_manager.account_manager
        )
        factories.EngagementNoteFactory.create_batch(
            2, engagement=engagements[1], created_by=viewer_user
        )

    return company
