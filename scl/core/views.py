import time
import uuid
import logging
import boto3
from datetime import date

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from reversion.models import Version

from .models import Company, Engagement

logger = logging.getLogger().warning


def index(request):
    today = date.today()

    all_companies = list(Company.objects.all())
    your_companies = list(request.user.managed_companies.all())
    your_future_enagements = list(Engagement.objects.filter(company__in=your_companies, date__gte=today))

    return render(request, "index.html", {
        "all_companies": all_companies,
        "your_companies": your_companies,
        "your_future_enagements": your_future_enagements,
    })


def engagement(request):
    return render(request, "engagement.html")


def aws_credentials(request):
    client = boto3.client("sts")
    role_arn = settings.AWS_TRANSCRIBE_ROLE_ARN

    # Creating new credentials unfortunately sometimes fails
    max_attempts = 3
    for i in range(0, 3):
        try:
            credentials = client.assume_role(
                RoleArn=role_arn,
                RoleSessionName="scl_" + str(uuid.uuid4()),
                DurationSeconds=60 * 60,
            )["Credentials"]
        except Exception:
            if i == max_attempts - 1:
                raise
            else:
                time.sleep(1)

    return JsonResponse(
        {
            "AccessKeyId": credentials["AccessKeyId"],
            "SecretAccessKey": credentials["SecretAccessKey"],
            "SessionToken": credentials["SessionToken"],
            "Expiration": credentials["Expiration"],
        },
        status=200,
    )


def company_briefing(request, duns_number):
    today = date.today()

    company = Company.objects.get(duns_number=duns_number)
    account_managers = list(company.account_manager.all())
    past_engagements = list(company.engagements.filter(date__lte=today))
    is_privileged = request.user in account_managers

    versions = Version.objects.get_for_object(company)
    current_version = versions.first()

    context = {
        "company": company,
        "past_engagements": past_engagements,
        "is_privileged": is_privileged,
        "account_managers": account_managers,
        "current_version": current_version,
    }
    return render(request, "company.html", context)


def engagement(request, engagement_id):
    engagement = Engagement.objects.get(id=engagement_id)
    versions = Version.objects.get_for_object(engagement)
    engagement_first_version = versions.last()

    notes = engagement.notes.all()
    notes_versions = [
        (note, Version.objects.get_for_object(engagement).last())
        for note in notes
    ]

    return render(request, "engagements.html", {
        "engagement": engagement,
        "engagement_first_version": engagement_first_version,
        "notes_versions": notes_versions
    })
