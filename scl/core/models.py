import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    pass

# Create your models here.


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(blank=False, null=False, max_length=128)
    key_facts = models.TextField(blank=False, null=False)
    issues = models.TextField(blank=False, null=True)
    priorities = models.TextField(blank=False, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "companies"
