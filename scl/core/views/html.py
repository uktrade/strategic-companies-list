import json
import logging
from datetime import date, datetime, timedelta

from django.shortcuts import render
from reversion.models import Version
from django.http import JsonResponse

from scl.core.models import Company, Engagement, CompanyAccountManager, Insight

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
        "edit_endpoint": f'/api/v1/engagement/{engagement.id}',
        "engagement_first_version": engagement_first_version,
        "notes_versions": notes_versions,
    })


def your_engagements(request):
    companies = list(Company.objects.filter(account_manager=request.user))

    your_companies = []
    for company in companies:
        your_companies.append({
            'name': company.name,
            'duns_number': company.duns_number,
            'engagements': company.engagements.all().order_by('-date'),
        })

    return render(request, "your_engagements.html", {
        "your_companies": your_companies,
    })


def company_engagements(request, duns_number):
    today = datetime.now().date()
    yesterday = datetime.now() - timedelta(days=1)

    company = Company.objects.get(duns_number=duns_number)
    past_engagements = list(company.engagements.filter(
        date__lte=yesterday).order_by('-date'))
    engagements = list(company.engagements.filter(
        date__gte=today).order_by('-date'))

    is_privileged = request.user in company.account_manager.all()
    if not is_privileged:
        return JsonResponse(403, safe=False)

    return render(request, "company_engagements.html", {
        "company": company,
        "add_engagement_link": f'/company-briefing/{company.duns_number}/add-engagement',
        "engagements": engagements,
        "past_engagements": past_engagements,
        "is_privileged": is_privileged,
    })


def company_briefing(request, duns_number):
    today = date.today()

    company = Company.objects.get(duns_number=duns_number)
    account_managers = list(company.account_manager.all())

    account_managers_with_lead = []
    for am in account_managers:
        is_lead = CompanyAccountManager.objects.filter(
            company=company, account_manager=am, is_lead=True).exists()
        account_managers_with_lead.append({
            "name": f"{am.first_name} {am.last_name}",
            "is_lead": "true" if is_lead else "false"
        })

    engagements = list(company.engagements.filter(
        date__gte=today).order_by('date'))[0:4]
    is_privileged = request.user in account_managers

    for e in engagements:
        logger(e.date)

    versions = Version.objects.get_for_object(company)
    current_version = versions.first()

    company_priorities = list(company.insights.filter(
        insight_type=Insight.TYPE_COMPANY_PRIORITY).order_by('order'))
    hmg_priorities = list(company.insights.filter(
        insight_type=Insight.TYPE_HMG_PRIORITY).order_by('order'))
    key_people = list(company.key_people.all())
    employees = '{:,}'.format(
        company.global_number_of_employees) if company.global_number_of_employees else ''

    context = {
        "company": company,
        "props": json.dumps({
            "title": company.name,
            "duns_number": company.duns_number,
            "sectors": company.get_sectors_display,
            "last_updated": current_version.revision.date_created.strftime("%B %d, %Y, %H:%M"),
            "global_hq_country": company.get_global_hq_country,
            "turn_over": company.global_turnover_millions_usd,
            "employees": employees,
            "key_people": [
                {
                    'name': people.name,
                    'role': people.role,
                    'userId': people.id
                } for people in key_people
            ],
            "company_priorities": [
                {
                    'title': priority.title,
                    'details': priority.details,
                    'insightId': str(priority.id)
                } for priority in company_priorities
            ] if is_privileged else [],
            "hmg_priorities": [
                {
                    'title': priority.title,
                    'details': priority.details,
                    'insightId': str(priority.id)
                } for priority in hmg_priorities
            ],
            "is_privileged": is_privileged,
            "engagements": [
                {
                    'id': str(engagement.id),
                    'title': engagement.title,
                    'date': engagement.date.strftime("%B %d, %Y"),
                } for engagement in engagements
            ] if is_privileged else [],
            "account_managers": account_managers_with_lead
        })
    }
    return render(request, "company.html", context)
