import json

import reversion
from django.http import JsonResponse

from scl.core.models import Engagement


def engagement_api(request, engagement_id):
    data = json.loads(request.body)
    engagement = Engagement.objects.get(id=engagement_id)

    account_managers = engagement.company.account_manager.all()
    is_privileged = request.user in account_managers
    if not is_privileged:
        return JsonReponse(403, {})

    if request.method == 'PATCH':
        with reversion.create_revision():
            engagement.title = data.get('engagement_title').strip()
            engagement.details = data.get('engagement_details').strip()
            engagement.save()

            reversion.set_user(request.user)
            reversion.set_comment(
                "Updated title, and details via API "
                f"({request.build_absolute_uri()} from {request.headers['referer']})"
            )

    return JsonResponse(
        {
            "engagement": engagement.title,
            "id": engagement.id,
        },
        status=200,
    )
