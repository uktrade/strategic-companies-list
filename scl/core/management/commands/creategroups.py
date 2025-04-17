from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = "Ensures all groups are created"

    def handle(self, *args, **options):
        Group.objects.get_or_create(name=settings.BASIC_ACCESS_GROUP)
        Group.objects.get_or_create(name=settings.VIEWER_ACCESS_GROUP)
        self.stdout.write(
            self.style.SUCCESS("Successfully created 'Basic' and 'Viewer' access groups")
        )
