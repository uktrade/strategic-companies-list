from django.shortcuts import render


def index(request):
    return render(request, "index.html")


def engagement(request):
    return render(request, "engagement.html")
