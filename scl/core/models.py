import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass

# Create your models here.


class Company(models.Model):
    # Auto generated
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    last_updated = models.DateTimeField(auto_now=True)

    # Required
    name = models.CharField(blank=False, null=False, max_length=128)
    duns_number = models.CharField(blank=False, null=False, max_length=9, verbose_name='DUNS number')

    # Optional
    company_priorities = models.TextField(blank=True, null=False, default='')
    hmg_priorities = models.TextField(blank=True, null=False, default='', verbose_name='HMG priorities')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "companies"
