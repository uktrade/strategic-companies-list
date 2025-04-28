from django.conf import settings


def environment_flags(request):
    return {"IS_PRODUCTION": bool(not settings.DEBUG)}
