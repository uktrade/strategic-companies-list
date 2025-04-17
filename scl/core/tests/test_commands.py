import pytest
from django.core.management import call_command

from scl.core.models import Company


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("num"),
    (
        (1),
        (50),
    ),
)
def test_createtestdata_command(num, viewer_user):
    # sanity check
    Company.objects.count() == 0

    call_command("createtestdata", viewer_user.email, num)

    assert Company.objects.count() == num

    if num > 5:
        assert (
            Company.objects.filter(account_manager__email=viewer_user.email).count()
            == 5
        )
