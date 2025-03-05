import json

import reversion
from django.http import JsonResponse

from scl.core.models import Company


def company_api(request, duns_number):
    data = json.loads(request.body)
    company = Company.objects.get(duns_number=duns_number)

    if request.method == 'PATCH':
        with reversion.create_revision():
            company.hmg_priorities = data.get('hmg_priorities').strip()
            company.company_priorities = data.get('company_priorities').strip()
            company.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated hmg_priorities and company_priorities via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    return JsonResponse(
        {
            "company": company.name,
            "duns_number": company.duns_number,
        },
        status=200,
    )
