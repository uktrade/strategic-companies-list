from ipaddress import ip_network, ip_address

from django.conf import settings
from django.shortcuts import render


def IPFilterMiddleware(get_response):
    allowed_ip_networks = [
        ip_network(ip_range)
        for ip_range_list in settings.IP_FILTER_ALLOWED_NETWORKS.values()
        for ip_range in ip_range_list
    ]
    exclude_paths = getattr(settings, 'IP_FILTER_EXCLUDE_PATHS', [])

    global_network = ip_network("0.0.0.0/0")

    def middleware(request):
        try:
            request_ip_address = ip_address(request.headers['CloudFront-Viewer-Address'].split(':')[0])
        except (KeyError, ValueError):
            request_ip_address = None

        # If we can't get the viewer IP address, then we only allow the request if we're configured
        # to allow all IP addresses to access. Otherwise, we only allow the request if the the IP
        # address is in one of the allowed networks. Note this is only safe if we have mechanisms
        # to prevent something that isn't CloudFront from connecting to the application
        allowed = \
            True if settings.RUNNING_ON_DBT_PLATFORM else \
            True if request.path in exclude_paths else \
            global_network in allowed_ip_networks if request_ip_address is None else \
            any(request_ip_address in allowed_ip_network for allowed_ip_network in allowed_ip_networks)

        if allowed:
            return get_response(request)
        else:
            return render(request, '403_ip_filter.html', {
                'request_id': request.headers.get('X-Amzn-Trace-Id'),
                'request_ip_address': request_ip_address,
                'request_url': request.build_absolute_uri()
            }, status=403)

    return middleware


def BasicAccessMiddleware(get_response):
    group_name = settings.BASIC_ACCESS_GROUP
    exclude_paths = getattr(settings, 'BASIC_ACCESS_EXCLUDE_PATHS', [])

    def middleware(request):
        allowed = request.path in exclude_paths or request.user.groups.filter(name=group_name).exists()

        if allowed:
            return get_response(request)
        else:
            return render(request, '403_basic_access.html', {
                'email_address': request.user.email,
                'user_id': request.user.username,
            }, status=403)

    return middleware
