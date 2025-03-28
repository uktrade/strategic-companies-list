from django.http import HttpResponse, JsonResponse


def lb_healthcheck(request):
    return HttpResponse("OK")


def healthcheck(request):
    return HttpResponse('<?xml version="1.0" encoding="UTF-8"?><pingdom_http_custom_check><status>OK</status><response_time>500</response_time></pingdom_http_custom_check>', content_type="text/xml")
