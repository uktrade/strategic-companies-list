from waffle import get_waffle_flag_model

from scl.core.constants import SECTORS


def get_all_feature_flags(request):
    flags = get_waffle_flag_model().get_all()
    flag_values = [(f.name, f.is_active(request)) for f in flags]
    return [{key: value} for key, value in flag_values]


def get_all_sectors():
    return [{"label": value, "value": key}
            for key, value in dict(SECTORS).items()]


def get_company_sectors(company):
    return [{"label": dict(SECTORS)[key], "value": key}
            for key in company.sectors]
