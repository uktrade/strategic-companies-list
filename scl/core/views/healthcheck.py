from django.http import HttpResponse, JsonResponse

def lb_healthcheck(request):
    return HttpResponse("OK")
