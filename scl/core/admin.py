from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Company

from reversion.admin import VersionAdmin


@admin.register(User)
class UserAdminWithVersion(UserAdmin, VersionAdmin):
	pass


@admin.register(Company)
class CompanyAdmin(VersionAdmin):
    list_display = (
        "duns_number",
        "name",
        "id",
    )
