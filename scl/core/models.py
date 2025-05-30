import uuid

import reversion
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField
from django.db import models

from .constants import (
    COUNTRIES_AND_TERRITORIES,
    SECTORS,
    EngagementType,
    ENGAGEMENT_TYPE_COLOUR_MAPPING,
)


@reversion.register()
class User(AbstractUser):
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def in_group(self, group_name):
        """Check if a user belongs to a specific group."""
        return self.groups.filter(name=group_name).exists()

    class Meta:
        ordering = ["last_name", "first_name", "email", "id"]


@reversion.register()
class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    last_updated = models.DateTimeField(auto_now=True)

    name = models.CharField(blank=False, null=False, max_length=128)
    duns_number = models.CharField(
        blank=False, null=False, max_length=9, verbose_name="DUNS number"
    )

    summary = models.TextField(null=True, blank=True, max_length=500)

    global_hq_name = models.CharField(
        max_length=128,
        blank=True,
        null=False,
        default="",
        verbose_name="Global HQ name",
    )
    global_hq_country = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        choices=COUNTRIES_AND_TERRITORIES,
        verbose_name="Global HQ country",
    )
    global_turnover_millions_usd = models.BigIntegerField(
        null=True, blank=True, verbose_name="Global turnover (millions USD)"
    )
    global_number_of_employees = models.BigIntegerField(
        null=True, blank=True, verbose_name="Global number of employees"
    )

    sectors = ArrayField(
        models.CharField(max_length=6, choices=SECTORS),
        blank=True,
        null=True,
        default=list,
        verbose_name="Sectors",
    )

    account_manager = models.ManyToManyField(
        User,
        through="CompanyAccountManager",
        through_fields=("company", "account_manager"),
        related_name="managed_companies",
    )

    def __str__(self):
        return self.name

    @property
    def global_turnover_billions_usd(self):
        return self.global_turnover_millions_usd / 1000

    @property
    def get_global_hq_country(self):
        return dict(COUNTRIES_AND_TERRITORIES).get(
            self.global_hq_country, self.global_hq_country
        )

    class Meta:
        verbose_name_plural = "companies"
        ordering = ["name", "duns_number", "id"]


@reversion.register()
class CompanyAccountManager(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    account_manager = models.ForeignKey(User, on_delete=models.CASCADE)
    is_lead = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "account_manager"], name="company_account_manager"
            )
        ]
        verbose_name = "account manager"
        verbose_name_plural = "account managers"


@reversion.register()
class Insight(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    TYPE_COMPANY_PRIORITY = "company_priority"
    TYPE_HMG_PRIORITY = "hmg_priority"

    INSIGHT_TYPES = [
        (TYPE_COMPANY_PRIORITY, "Company Priority"),
        (TYPE_HMG_PRIORITY, "HMG Priority"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="insights"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_insights"
    )
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=255)
    details = models.TextField(blank=True, max_length=500)

    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["insight_type", "order", "-created_at"]


@reversion.register()
class Engagement(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(blank=False, null=False, max_length=128)
    date = models.DateField(null=True, blank=False)

    engagement_type = models.CharField(
        blank=False,
        null=False,
        choices=EngagementType,
        max_length=128,
    )

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="engagements"
    )
    company_representatives = ArrayField(
        models.CharField(max_length=100), blank=True, default=list
    )
    civil_servants = ArrayField(
        models.CharField(max_length=100), blank=True, default=list
    )
    ministers = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    agenda = models.TextField(null=True, blank=False, max_length=500)
    outcomes = models.TextField(null=True, blank=True, max_length=500)
    actions = models.TextField(null=True, blank=True, max_length=500)

    @property
    def all_attendees(self):
        return self.ministers + self.civil_servants + self.company_representatives

    @property
    def engagement_type_colour(self):
        try:
            return ENGAGEMENT_TYPE_COLOUR_MAPPING[self.engagement_type]
        except KeyError:
            return ""


@reversion.register()
class EngagementNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_by", null=True, blank=True
    )
    engagement = models.ForeignKey(
        Engagement, on_delete=models.CASCADE, related_name="notes"
    )
    contents = models.TextField(null=False, blank=True, default="", max_length=500)


@reversion.register()
class KeyPeople(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    name = models.CharField(blank=False, null=False, max_length=128)
    role = models.CharField(blank=False, null=False, max_length=128)
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="key_people"
    )
    email = models.EmailField(default="N/A", max_length=254)

    class Meta:
        verbose_name_plural = "Key people"

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.company.name}"
