import pytest
import factory.fuzzy
import uuid
from django.conf import settings
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


class UserFactory(factory.django.DjangoModelFactory):
    username = factory.LazyAttribute(lambda _: str(uuid.uuid4()))
    email = factory.LazyAttribute(
        lambda o: f"test.user+{o.username}@example.com")
    password = "12345"

    @factory.post_generation
    def groups(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for group in extracted:
                self.groups.add(group)

    class Meta:
        model = get_user_model()


class CompanyFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    name = factory.fuzzy.FuzzyText()
    duns_number = '12345'

    class Meta:
        model = "core.Company"


class HomePageTest(TestCase):
    def setUp(self):
        self.group = Group.objects.create(name="Basic access")
        self.user = UserFactory.create(is_superuser=False, groups=[self.group])
        self.client = Client()
        self.client.force_login(self.user)

    @pytest.mark.django_db
    def test_home_page_gives_200_status(self):
        response = self.client.get("/")
        assert response.status_code == 200
