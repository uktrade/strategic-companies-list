from django import template
register = template.Library()


@register.filter(name="ensure_p")
def ensure_p(value):
    stripped = value.strip()
    stripped = '<br>' if stripped == '' else stripped
    return f'<p class="govuk-body">{stripped}</p>' if stripped[:2] != '<p' else stripped


@register.filter(name="ensure_li")
def ensure_li(value):
    stripped = value.strip()
    stripped = '<br>' if stripped == '' else stripped
    return f'<li>{stripped}</li>' if stripped[:3] != '<li' else stripped
