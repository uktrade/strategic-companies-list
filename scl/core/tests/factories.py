from datetime import datetime
import factory.fuzzy
import uuid

from django.contrib.auth import get_user_model


class UserFactory(factory.django.DjangoModelFactory):
    username = factory.LazyAttribute(lambda _: str(uuid.uuid4()))
    email = factory.LazyAttribute(lambda o: f"test.user+{o.username}@example.com")
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
    duns_number = "12345"

    class Meta:
        model = "core.Company"


class EngagementFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    title = factory.fuzzy.FuzzyText(length=128)
    date = factory.fuzzy.FuzzyDate(datetime.today(), datetime(2100, 12, 31))
    company = factory.SubFactory(CompanyFactory)
    details = factory.fuzzy.FuzzyText(length=500)

    class Meta:
        model = "core.Engagement"


class CompanyAccountManagerFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    company = factory.SubFactory(CompanyFactory)
    account_manager = factory.SubFactory(UserFactory)
    is_lead = False

    class Meta:
        model = "core.CompanyAccountManager"
