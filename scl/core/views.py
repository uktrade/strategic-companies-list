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
    companies = list(Company.objects.all().order_by('name'))
    # Dummy way so we can preserve some owner/non owner view
    companies_with_is_owner = [
        (company, i < len(companies)/2)
        for i, company in enumerate(companies)
    ]

    request.user.is_staff = True
    request.user.is_superuser = True
    request.user.save()

    return render(request, "index.html", {
        "companies_with_is_owner": companies_with_is_owner,
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
    # While we move more to duns-number based routing
    if duns_number:
        company = Company.objects.get(duns_number=duns_number)
    else:
        company = Company.objects.get(name=request.GET.get('company'))
    is_owner = request.GET.get('owned')
    context = {
        "company": company,
        "is_owner": is_owner
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
