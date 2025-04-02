from scl.core.constants import SECTORS


def get_all_sectors():
    return [{"label": value, "value": key}
            for key, value in dict(SECTORS).items()]


def get_company_sectors(company):
    return [{"label": dict(SECTORS)[key], "value": key}
            for key in company.sectors]
