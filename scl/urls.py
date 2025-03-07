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

from scl.core.views import lb_healthcheck, index, aws_credentials
from scl.core.views import index, company_briefing, engagement
from scl.core.api.v1.company import company_api
from scl.core.api.v1.engagement import engagement_api

urlpatterns = [
    path('lb-healthcheck', lb_healthcheck),
    path('admin/', admin.site.urls),
    path("", index, name="home-page"),
    path("company-briefing/<str:duns_number>",
         company_briefing, name='company-briefing'),
    path("engagement/<uuid:engagement_id>", engagement, name='engagement'),
    path("api/v1/company/<str:duns_number>", company_api),
    path("api/v1/engagement/<uuid:engagement_id>", engagement_api),
    path("api/v1/aws-credentials", aws_credentials),
    path('auth/', include('authbroker_client.urls'))
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
