from django.conf import settings
from django.shortcuts import render


def BasicAccessMiddleware(get_response):
    group_name = settings.BASIC_ACCESS_GROUP
    exclude_paths = getattr(settings, "BASIC_ACCESS_EXCLUDE_PATHS", [])

    def middleware(request):
        allowed = (
            request.path.startswith("/assets/")
            or request.path in exclude_paths
            or request.user.groups.filter(name=group_name).exists()
        )

        if allowed:
            return get_response(request)
        else:
            return render(
                request,
                "403_basic_access.html",
                {
                    "email_address": request.user.email,
                    "user_id": request.user.username,
                },
                status=403,
            )

    return middleware
