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
from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from scl.core.views.html import index, company_briefing, engagement, add_engagement, company_engagements, your_engagements
from scl.core.views.api import aws_credentials_api, company_api, engagement_api, engagement_note_api, company_insight_api, insight_api
from scl.core.views.healthcheck import lb_healthcheck


urlpatterns = [
    # Auth (SSO)
    path('auth/', include('authbroker_client.urls')),

    # Admin
    path('admin/', admin.site.urls),

    # HTML
    path("", index, name="home-page"),
    path("company-briefing/<str:duns_number>",
         company_briefing, name='company-briefing'),
    path("engagement/<uuid:engagement_id>", engagement, name='engagement'),
    path("your-engagements", your_engagements, name='your-engagements'),
    path("company-briefing/<str:duns_number>/add-engagement",
         add_engagement, name='add-engagement'),
    path("company-briefing/<str:duns_number>/engagements",
         company_engagements, name='company-engagements'),

    # API
    path("api/v1/company/<str:duns_number>", company_api),
    path("api/v1/company/<str:duns_number>/insights/<str:insight_type>", company_insight_api),
    path("api/v1/insights/<uuid:insight_id>", insight_api),
    path("api/v1/engagement/<uuid:engagement_id>", engagement_api),
    path("api/v1/engagement/<uuid:engagement_id>/note", engagement_note_api),
    path("api/v1/aws-credentials", aws_credentials_api),

    # Healthcheck
    path('lb-healthcheck', lb_healthcheck),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
