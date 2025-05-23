from datetime import datetime
import factory.fuzzy
from faker import Faker
import random
import uuid

from django.contrib.auth import get_user_model

from scl.core.constants import COUNTRIES_AND_TERRITORIES, SECTORS
from scl.core.models import Insight
from scl.core.constants import EngagementType


class FuzzyChoiceList(factory.fuzzy.BaseFuzzyAttribute):
    """Handles fuzzy choices for ArrayField.

    Args:
        choices (iterable): An iterable yielding options; will only be unrolled on the first call.
        num_choices (int): Defaults to 1. Number of random choices to return from the given options.
        getter (callable or None): a function to parse returned values
    """

    def __init__(self, choices, num_choices=1, getter=None):
        self.choices = None
        self.choices_generator = choices
        self.getter = getter
        self.num_choices = num_choices
        super().__init__()

    def fuzz(self):
        if self.choices is None:
            self.choices = list(self.choices_generator)
        choices = random.choices(self.choices, k=self.num_choices)
        if self.getter is None:
            return choices
        return [self.getter(value) for value in choices]


class FakerList(factory.fuzzy.BaseFuzzyAttribute):
    """Handles faker output for ArrayField.

    Args:
        provider (str): Name of the Faker provider.
        num_choices (int): Defaults to 1. Number of values to generate.
    """

    def __init__(self, provider, num_choices=1):
        self.provider = provider
        self.num_choices = num_choices
        super().__init__()

    def fuzz(self):
        choices = []
        fake = Faker()
        for i in range(1, self.num_choices):
            choices.append(getattr(fake, self.provider)())
        return choices


class UserFactory(factory.django.DjangoModelFactory):
    username = factory.LazyAttribute(lambda _: str(uuid.uuid4()))
    email = factory.LazyAttribute(lambda o: f"test.user+{o.username}@example.com")
    password = "12345"
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

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
    name = factory.Faker("company")
    duns_number = factory.fuzzy.FuzzyText(length=9)
    summary = factory.Faker("text", max_nb_chars=500)
    global_hq_name = factory.fuzzy.FuzzyText(length=128)
    global_hq_country = factory.fuzzy.FuzzyChoice(
        COUNTRIES_AND_TERRITORIES, getter=lambda c: c[0]
    )
    global_turnover_millions_usd = factory.fuzzy.FuzzyInteger(0, 10000)
    global_number_of_employees = factory.fuzzy.FuzzyInteger(0, 10000)
    sectors = FuzzyChoiceList(SECTORS, getter=lambda c: c[0], num_choices=3)

    class Meta:
        model = "core.Company"


class CompanyAccountManagerFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    company = factory.SubFactory(CompanyFactory)
    account_manager = factory.SubFactory(UserFactory)
    is_lead = False

    class Meta:
        model = "core.CompanyAccountManager"


class KeyPeopleFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    name = factory.Faker("name")
    role = factory.Faker("job")
    company = factory.SubFactory(CompanyFactory)
    email = factory.LazyAttribute(lambda _: "test.user@example.com")

    class Meta:
        model = "core.KeyPeople"


class InsightFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    created_at = factory.fuzzy.FuzzyDate(datetime(2000, 12, 31), datetime.today())
    updated_at = factory.fuzzy.FuzzyDate(datetime.today(), datetime(2100, 12, 31))
    company = factory.SubFactory(CompanyFactory)
    created_by = factory.SubFactory(UserFactory)
    insight_type = factory.fuzzy.FuzzyChoice(
        Insight.INSIGHT_TYPES, getter=lambda c: c[0]
    )
    title = factory.Faker("text", max_nb_chars=255)
    details = factory.Faker("text", max_nb_chars=500)

    order = factory.fuzzy.FuzzyInteger(0, 10000)

    class Meta:
        model = "core.Insight"


class EngagementFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    title = factory.Faker("text", max_nb_chars=50)
    date = factory.fuzzy.FuzzyDate(datetime.today(), datetime(2100, 12, 31))
    company = factory.SubFactory(CompanyFactory)
    agenda = factory.Faker("text", max_nb_chars=100)
    engagement_type = factory.fuzzy.FuzzyChoice(
        [val for val in EngagementType.values if val != "Legacy"]
    )
    company_representatives = FakerList("name", num_choices=2)
    civil_servants = FakerList("name", num_choices=4)
    ministers = FakerList("name", num_choices=3)
    actions = factory.Faker("text", max_nb_chars=100)
    outcomes = factory.Faker("text", max_nb_chars=100)

    class Meta:
        model = "core.Engagement"


class EngagementNoteFactory(factory.django.DjangoModelFactory):
    id = factory.LazyAttribute(lambda _: uuid.uuid4())
    created_by = factory.SubFactory(UserFactory)
    engagement = factory.SubFactory(EngagementFactory)
    contents = factory.Faker("text", max_nb_chars=500)

    class Meta:
        model = "core.EngagementNote"
