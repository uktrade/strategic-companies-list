import logging
from datetime import date

from django.shortcuts import render, redirect
from reversion.models import Version
from django.http import JsonResponse

from scl.core.forms import EngagementForm
from scl.core.models import Company, Engagement

logger = logging.getLogger().warning


def index(request):
    today = date.today()

    all_companies = list(Company.objects.all())
    your_companies = list(request.user.managed_companies.all())
    your_future_enagements = list(Engagement.objects.filter(
        company__in=your_companies, date__gte=today).order_by('-date'))

    return render(request, "index.html", {
        "all_companies": all_companies,
        "your_companies": your_companies,
        "your_future_enagements": your_future_enagements,
    })


def company_briefing(request, duns_number):
    today = date.today()

    company = Company.objects.get(duns_number=duns_number)
    account_managers = list(company.account_manager.all())
    past_engagements = list(company.engagements.filter(
        date__lte=today).order_by('-date'))[0:4]
    is_privileged = request.user in account_managers

    versions = Version.objects.get_for_object(company)
    current_version = versions.first()

    context = {
        "company": company,
        "past_engagements": past_engagements,
        "is_privileged": is_privileged,
        "account_managers": account_managers,
        "current_version": current_version,
    }
    return render(request, "company.html", context)


def engagement(request, engagement_id):
    engagement = Engagement.objects.get(id=engagement_id)

    is_privileged = request.user in engagement.company.account_manager.all()
    if not is_privileged:
        return JsonResponse(403, safe=False)

    versions = Version.objects.get_for_object(engagement)
    engagement_first_version = versions.last()

    notes = engagement.notes.all()
    notes_versions = [
        (note, Version.objects.get_for_object(engagement).last())
        for note in notes
    ]

    return render(request, "engagements.html", {
        "engagement": engagement,
        "engagement_first_version": engagement_first_version,
        "notes_versions": notes_versions,
    })


def engagements(request, duns_number):
    today = date.today()

    company = Company.objects.get(duns_number=duns_number)
    past_engagements = list(company.engagements.filter(
        date__lte=today).order_by('-date'))[1:]
    engagements = list(company.engagements.filter(
        date__gte=today).order_by('-date'))

    is_privileged = request.user in company.account_manager.all()
    if not is_privileged:
        return JsonResponse(403, safe=False)

    return render(request, "all_engagements.html", {
        "company": company,
        "engagements": engagements,
        "past_engagements": past_engagements,
        "is_privileged": is_privileged,
    })


def engagement_add(request, duns_number):
    company = Company.objects.get(duns_number=duns_number)
    is_privileged = request.user in company.account_manager.all()

    if not is_privileged:
        return JsonResponse(403, safe=False)

    if request.method == 'POST':
        form = EngagementForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"]
            date = form.cleaned_data['date']
            details = form.cleaned_data['details']
            Engagement.objects.create(
                company_id=company.id,
                title=title, date=date, details=details)
            return redirect(f'/company-briefing/{company.duns_number}?success=1')

    else:
        form = EngagementForm()

    return render(request, "add_engagements.html", {
        "company": company,
        "form": form
    })
