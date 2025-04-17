"""
URL configuration for scl project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf.urls.static import static
from django.conf import settings, urls
from django.contrib import admin
from django.urls import include, path

from scl.core.views import html
from scl.core.views import api
from scl.core.views import healthcheck

urls.handler403 = html.custom_403_view

urlpatterns = [
    # Auth (SSO)
    path("auth/", include("authbroker_client.urls")),
    # Admin
    path("admin/", admin.site.urls),
    # HTML
    path("", html.IndexView.as_view(), name="home-page"),
    path(
        "company-briefing/<str:duns_number>",
        html.CompanyDetailView.as_view(),
        name="company-briefing",
    ),
    path(
        "engagement/<uuid:pk>",
        html.EngagementDetailView.as_view(),
        name="engagement",
    ),
    path(
        "company-briefing/<str:duns_number>/engagements",
        html.CompanyEngagementListView.as_view(),
        name="company-engagements",
    ),
    # API
    path(
        "api/v1/company/<str:duns_number>",
        api.CompanyAPIView.as_view(),
        name="api-company",
    ),
    path(
        "api/v1/company/<str:duns_number>/insights/<str:insight_type>",
        api.company_insight_api,
    ),
    path("api/v1/insights/<uuid:insight_id>", api.insight_api),
    path("api/v1/engagement/<uuid:engagement_id>", api.EngagementAPI.as_view(),
         name="change-engagement-api"),
    path(
        "api/v1/engagement/<str:duns_number>",
        api.EngagementAPI.as_view(),
        name="add-engagement",
    ),
    path("api/v1/engagement/<uuid:engagement_id>/note", api.engagement_note_api),
    path("api/v1/aws-credentials", api.aws_credentials_api),
    path("api/v1/key-people/<str:duns_number>", api.key_people_api),
    # Healthcheck
    path("lb-healthcheck", healthcheck.lb_healthcheck),
    path("pingdom/ping.xml", healthcheck.healthcheck),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
