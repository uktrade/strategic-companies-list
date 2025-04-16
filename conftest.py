import pytest

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
