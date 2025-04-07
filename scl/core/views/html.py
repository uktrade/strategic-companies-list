import json
import logging

from datetime import date, datetime, timedelta

from django.shortcuts import render
from reversion.models import Version
from django.http import HttpResponseForbidden
from scl.core.constants import SECTORS

from scl.core.models import Company, Engagement, CompanyAccountManager, Insight
from scl.core.views.utils import get_all_feature_flags, get_all_sectors, get_company_sectors

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

    is_viewer = request.user.in_group('Viewer')
    is_account_manager = request.user in engagement.company.account_manager.all()
    has_access = is_viewer or is_account_manager

    if not has_access:
        return HttpResponseForbidden(render(request, "403_viewer_access.html"))

    versions = Version.objects.get_for_object(engagement)

    last_updated = versions.first().revision
    first_created = versions.last().revision

    notes = engagement.notes.filter(created_by=request.user)

    return render(request, "engagement.html", context={
        "props": json.dumps({
            "id": str(engagement.id),
            "title": engagement.title,
            "details": engagement.details,
            "flags": get_all_feature_flags(request),
            "created": {
                "name": f"{first_created.user.first_name} {first_created.user.last_name}",
                "date": first_created.date_created.strftime(
                    "%B %d, %Y,%H:%M")
            },
            "last_updated": {
                "name": f"{last_updated.user.first_name} {last_updated.user.last_name}",
                "date": last_updated.date_created.strftime(
                    "%B %d, %Y, %H:%M")
            },
            "is_account_manager": is_account_manager,
            "has_access": has_access,
            "company": {
                "name": engagement.company.name,
                "duns_number": engagement.company.duns_number
            },
            "notes": [
                {
                    'noteId': str(note.id),
                    'contents': note.contents,
                } for note in notes
            ] if is_account_manager else [],
        })
    })


def company_engagements(request, duns_number):
    today = datetime.now().date()
    yesterday = datetime.now() - timedelta(days=1)

    company = Company.objects.get(duns_number=duns_number)
    past_engagements = list(company.engagements.filter(
        date__lte=yesterday).order_by('-date'))
    engagements = list(company.engagements.filter(
        date__gte=today).order_by('-date'))

    is_viewer = request.user.in_group('Viewer')
    is_account_manager = request.user in company.account_manager.all()
    has_access = is_viewer or is_account_manager

    if not has_access:
        return HttpResponseForbidden(render(request, "403_viewer_access.html"))

    return render(request, "company_engagements.html", {
        "company": company,
        "add_engagement_link": f'/company-briefing/{company.duns_number}/add-engagement',
        "engagements": engagements,
        "past_engagements": past_engagements,
    })


def company_briefing(request, duns_number):
    today = date.today()

    company = Company.objects.get(duns_number=duns_number)

    is_viewer = request.user.in_group('Viewer')
    is_account_manager = request.user in company.account_manager.all()
    has_access = is_viewer or is_account_manager

    account_managers = list(company.account_manager.all())

    account_managers_with_lead = []

    for am in account_managers:
        is_lead = CompanyAccountManager.objects.filter(
            company=company, account_manager=am, is_lead=True).exists()
        account_managers_with_lead.append({
            "name": f"{am.first_name} {am.last_name}",
            "email": am.email,
            "is_lead": "true" if is_lead else "false"
        })

    engagements = list(company.engagements.filter(
        date__gte=today).order_by('date'))[0:4]

    versions = Version.objects.get_for_object(company)
    current_version = versions.first()

    company_priorities = list(company.insights.filter(
        insight_type=Insight.TYPE_COMPANY_PRIORITY).order_by('order'))
    hmg_priorities = list(company.insights.filter(
        insight_type=Insight.TYPE_HMG_PRIORITY).order_by('order'))
    key_people = list(company.key_people.all())
    employees = '{:,}'.format(
        company.global_number_of_employees) if company.global_number_of_employees else ''

    company_sectors = get_company_sectors(company)

    context = {
        "company": company,
        "props": json.dumps({
            "title": company.name,
            "summary": company.summary,
            "duns_number": company.duns_number,
            "company_sectors": company_sectors if company_sectors else [],
            "all_sectors": get_all_sectors(),
            "last_updated": current_version.revision.date_created.strftime("%B %d, %Y, %H:%M"),
            "global_hq_country": company.get_global_hq_country,
            "turn_over": company.global_turnover_millions_usd,
            "employees": employees,
            "key_people": [
                {
                    'name': people.name,
                    'role': people.role,
                    'userId': str(people.id)
                } for people in key_people
            ],
            "company_priorities": [
                {
                    'title': priority.title,
                    'details': priority.details,
                    'insightId': str(priority.id)
                } for priority in company_priorities
            ] if has_access else [],
            "hmg_priorities": [
                {
                    'title': priority.title,
                    'details': priority.details,
                    'insightId': str(priority.id)
                } for priority in hmg_priorities
            ],
            "has_access": has_access,
            "is_account_manager": is_account_manager,
            "engagements": [
                {
                    'id': str(engagement.id),
                    'title': engagement.title,
                    'date': engagement.date.strftime("%B %d, %Y"),
                } for engagement in engagements
            ] if has_access else [],
            "account_managers": account_managers_with_lead
        })
    }

    return render(request, "company.html", context)


def custom_403_view(request, exception=None):
    return render(request, "403.html", status=403)
