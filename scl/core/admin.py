from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Company, Engagement, EngagementNote

from reversion.admin import VersionAdmin


@admin.register(User)
class UserAdminWithVersion(UserAdmin, VersionAdmin):
    pass


class CompanyAccountManagerInline(admin.TabularInline):
    model = Company.account_manager.through
    extra = 1
    autocomplete_fields = ["account_manager"]


@admin.register(Company)
class CompanyAdmin(VersionAdmin):
    list_display = (
        "duns_number",
        "name",
        "id",
    )
    inlines = (CompanyAccountManagerInline,)


class EngagementNoteManagerInline(admin.TabularInline):
    model = EngagementNote
    extra = 1


@admin.register(Engagement)
class EngagementAdmin(VersionAdmin):
    list_display = (
        "id",
        "title",
        "company",
    )
    inlines = (EngagementNoteManagerInline,)
