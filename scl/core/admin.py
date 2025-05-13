from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import KeyPeople, User, Company, Engagement, EngagementNote, Insight
from .constants import SECTORS

from reversion.admin import VersionAdmin


@admin.register(User)
class UserAdminWithVersion(UserAdmin, VersionAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'email')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser'),
        }),
    )


class CompanyAccountManagerInline(admin.TabularInline):
    model = Company.account_manager.through
    extra = 1
    autocomplete_fields = ["account_manager"]
    fields = ["account_manager", "is_lead"]


class KeyPeopleInline(admin.TabularInline):
    model = KeyPeople
    extra = 1


class CompanyAdminForm(forms.ModelForm):
    sectors = forms.MultipleChoiceField(
        choices=SECTORS,
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    class Meta:
        model = Company
        fields = '__all__'


@admin.register(Company)
class CompanyAdmin(VersionAdmin):
    form = CompanyAdminForm
    list_display = (
        "duns_number",
        "name",
        "id",
    )
    inlines = (CompanyAccountManagerInline, KeyPeopleInline)


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


@admin.register(Insight)
class InsightAdmin(VersionAdmin):
    list_display = (
        "title",
        "company",
        "insight_type",
        "created_by",
        "created_at",
    )
    list_filter = ("insight_type", "company")
    search_fields = ("title", "details", "company__name")
    ordering = ("-created_at",)


@admin.register(KeyPeople)
class KeyPeopleAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "email")
    list_filter = ("company",)
