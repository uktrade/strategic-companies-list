import pytest
import reversion

from django.conf import settings
from django.contrib.auth.models import Group

from scl.core.tests import factories


@pytest.fixture
@pytest.mark.django_db
def basic_access_group():
    return Group.objects.create(name=settings.BASIC_ACCESS_GROUP)


@pytest.fixture
@pytest.mark.django_db
def viewer_group():
    return Group.objects.create(name=settings.VIEWER_ACCESS_GROUP)


@pytest.fixture
@pytest.mark.django_db
def super_access_group():
    return Group.objects.create(name=settings.SUPER_ACCESS_GROUP)


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
def super_access_user(basic_access_group, viewer_group, super_access_group):
    user = factories.UserFactory.create(
        is_superuser=False,
        groups=[basic_access_group, viewer_group, super_access_group],
    )
    return user


@pytest.fixture
@pytest.mark.django_db
def super_access_user_client(client, super_access_user):
    client.force_login(super_access_user)
    return client


@pytest.fixture
@pytest.mark.django_db
def company_acc_manager(viewer_user):
    """
    Company with the viewer_user as the account manager.
    """
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
            2, engagement=engagements[0], created_by=viewer_user
        )

    return company


@pytest.fixture
@pytest.mark.django_db
def company_not_acc_manager(viewer_user, super_access_user):
    """
    Company with an account manager that is not the viewer_user.
    """
    with reversion.create_revision():
        company = factories.CompanyFactory()

        reversion.set_user(viewer_user)

        factories.CompanyAccountManagerFactory.create(company=company, is_lead=True)
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
            2, engagement=engagements[0], created_by=super_access_user
        )

    return company
