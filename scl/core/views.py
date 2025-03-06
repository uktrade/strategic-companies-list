import time
import uuid
import logging
import boto3

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from .models import Company

logger = logging.getLogger().warning


def index(request):
    all_companies = list(Company.objects.all())
    your_companies = list(request.user.managed_companies.all())

    return render(request, "index.html", {
        "all_companies": all_companies,
        "your_companies": your_companies,
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


def company(request, duns_number=None):
    company = Company.objects.get(duns_number=duns_number)
    account_managers = list(company.account_manager.all())
    is_privileged = request.user in account_managers

    context = {
        "company": company,
        "is_privileged": is_privileged,
        "account_managers": account_managers,
    }
    return render(request, "company.html", context)


def company_briefing(request, duns_number):
    company = Company.objects.get(duns_number=duns_number)
    context = {
        "company": company
    }
    return render(request, "company_briefing.html", context)


def engagement(request):
    return render(request, "engagements.html")
