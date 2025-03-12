import os
from django import template
from django.utils.safestring import mark_safe
from django.conf import settings
register = template.Library()


@register.simple_tag(takes_context=True)
def svg(context, name):
    svg_path = os.path.join(settings.BASE_DIR, 'scl', 'core', 'static', f"{name}.svg")
    try:
        with open(svg_path, 'r') as file:
            svg_content = file.read()

            if name == 'recording-animation':
                nonce = context.get('request', {}).csp_nonce
                style_tag = f'<style nonce="{nonce}">'
                svg_content = svg_content.replace('<style /* CSP NONCE WILL BE ADDED BY TEMPLATE */>', style_tag)

            return mark_safe(svg_content)
    except FileNotFoundError:
        return f"SVG '{name}' not found"
