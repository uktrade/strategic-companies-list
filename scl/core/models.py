import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField

from .constants import COUNTRIES_AND_TERRITORIES, SECTORS

import reversion


@reversion.register()
class User(AbstractUser):
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    class Meta:
        ordering = ["last_name", "first_name", "email", "id"]


@reversion.register()
class Company(models.Model):
    # Auto generated
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    last_updated = models.DateTimeField(auto_now=True)

    # Required
    name = models.CharField(blank=False, null=False, max_length=128)
    duns_number = models.CharField(
        blank=False, null=False, max_length=9, verbose_name='DUNS number')

    # Optional
    key_people = models.TextField(blank=True, null=False, default='')
    company_priorities = models.TextField(blank=True, null=False, default='')
    hmg_priorities = models.TextField(
        blank=True, null=False, default='', verbose_name='HMG priorities')

    global_hq_name = models.CharField(max_length=128, blank=True, null=False, default='', verbose_name="Global HQ name")
    global_hq_country = models.CharField(max_length=5, null=True, blank=True, choices=COUNTRIES_AND_TERRITORIES, verbose_name="Global HQ country")
    global_turnover_millions_usd = models.BigIntegerField(null=True, blank=True, verbose_name="Global turnover (millions USD)")
    global_number_of_employees = models.BigIntegerField(null=True, blank=True, verbose_name="Global number of employees")

    sectors = ArrayField(
        models.CharField(max_length=3, choices=SECTORS),
        blank=True,
        null=True,
        default=list,
        verbose_name="Sectors"
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
    def get_sectors_display(self):
        if not self.sectors:
            return ""
        return ", ".join(dict(SECTORS).get(sector, sector) for sector in self.sectors)

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
                fields=['company', 'account_manager'], name="company_account_manager")
        ]
        verbose_name = "account manager"
        verbose_name_plural = "account managers"


@reversion.register()
class Engagement(models.Model):
    # Auto generated
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Required
    title = models.CharField(blank=False, null=False, max_length=128)
    date = models.DateField(null=True, blank=False)

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="engagements")
    details = models.TextField(null=True, blank=True)


@reversion.register()
class EngagementNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    engagement = models.ForeignKey(Engagement, on_delete=models.CASCADE, related_name="notes")
    contents = models.TextField(null=False, blank=True, default='')
