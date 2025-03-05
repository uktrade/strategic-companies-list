import json
from scl.core.models import Company
from django.http import JsonResponse


def company_api(request, duns_number):
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)
    if request.method == 'PATCH':
        company.issues = data.get('issues')
        company.priorities = data.get('priorities')
        company.save()

    return JsonResponse(
        {
            "company": company.name,
            "duns_number": company.duns_number,
        },
        status=200,
    )
