from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Company

admin.site.register(User, UserAdmin)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "duns_number",
    )
