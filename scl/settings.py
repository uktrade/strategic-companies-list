"""
Django settings for scl project.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import json
import os
import sys
from pathlib import Path

from django_log_formatter_asim import ASIMFormatter
from django.core.management.utils import get_random_secret_key
from django.urls import reverse_lazy
import sentry_sdk

# General settings

DEBUG = os.environ.get('DEBUG', '') == 'True'
BASE_DIR = Path(__file__).resolve().parent.parent

RUNNING_ON_DBT_PLATFORM = bool(os.environ.get('COPILOT_ENVIRONMENT_NAME', ''))

HEALTH_CHECK_PATHS = [
    '/lb-healthcheck',
    '/pingdom/ping.xml',
]

if os.environ.get('SENTRY_DSN', ''):
    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_DSN', ''),
        # Add data like request headers and IP for users;
        # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
        send_default_pii=True,
        release=os.environ.get('GIT_COMMIT', ''),
    )

DISABLE_TRANSCRIBE = os.environ.get('DISABLE_TRANSCRIBE', 'False') == 'True'

# Security settings

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', get_random_secret_key())

# The ALB enforces that requests have the right header, which means we don't have to enforce that
# here, which also allows requests from the ALB itself as part of its healthcheck
ALLOWED_HOSTS = ["*"]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_AGE = 60 * 60 * 8
SESSION_COOKIE_NAME = 'scl-session-id'

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_NAME = 'scl-csrf-token'

CSP_DEFAULT_SRC = ("'self'")

if DEBUG:
    CSP_SCRIPT_SRC = ("'self'", "'unsafe-eval'")

CSP_CONNECT_SRC = [
    "'self'", "wss://transcribestreaming.eu-west-2.amazonaws.com:8443"]
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_FORM_ACTION = ("'self'",)

APPLICATION_ROOT_DOMAIN = os.environ.get("APPLICATION_ROOT_DOMAIN", '')

# Staff SSO / Authentication

AUTHBROKER_URL = os.environ.get('AUTHBROKER_URL', '')
AUTHBROKER_INTERNAL_URL = os.environ.get(
    'AUTHBROKER_INTERNAL_URL', AUTHBROKER_URL
)

AUTHBROKER_CLIENT_ID = os.environ.get('AUTHBROKER_CLIENT_ID', '')
AUTHBROKER_CLIENT_SECRET = os.environ.get('AUTHBROKER_CLIENT_SECRET', '')
AUTHBROKER_STAFF_SSO_SCOPE = 'read write'
AUTHBROKER_ANONYMOUS_PATHS = HEALTH_CHECK_PATHS
AUTHBROKER_ANONYMOUS_URL_NAMES = []

# Avoids (un-rectifiable) personal data in the user ID, as well as a reference to trade.gov.uk,
# which is the domain for DIT, not DBT
AUTHBROKER_USE_USER_ID_GUID = True

AUTHENTICATION_BACKENDS = [
    'authbroker_client.backends.AuthbrokerBackend',
]

AUTH_USER_MODEL = "core.User"

LOGIN_URL = reverse_lazy('authbroker_client:login')

LOGIN_REDIRECT_URL = reverse_lazy('home-page')

# IP Filter
IP_FILTER_ALLOWED_NETWORKS = json.loads(
    os.environ.get('IP_FILTER_ALLOWED_NETWORKS', '{}')
)
IP_FILTER_EXCLUDE_PATHS = HEALTH_CHECK_PATHS

# Basic access group: configures BasicAccessMiddleware that requires all users to have this access
# This allows the app itself to be quite open in terms of SSO, but access is managed within
BASIC_ACCESS_GROUP = 'Basic access'
BASIC_ACCESS_EXCLUDE_PATHS = HEALTH_CHECK_PATHS + [
    reverse_lazy('authbroker_client:login'),
    reverse_lazy('authbroker_client:callback'),
]


# Application definition

INSTALLED_APPS = [
    'django_bleach',
    'django_extensions',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.humanize',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'csp',
    'authbroker_client',
    'reversion',
    'scl.core',
    'scl.static',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'csp.middleware.CSPMiddleware',
    'scl.core.middleware.IPFilterMiddleware',
    'authbroker_client.middleware.ProtectAllViewsMiddleware',
    'scl.core.middleware.BasicAccessMiddleware',
]

ROOT_URLCONF = 'scl.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


WSGI_APPLICATION = 'scl.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        # Credentials are set by libpq-compatible environment variables, and so don't need to be
        # explicitly referenced https://www.postgresql.org/docs/current/libpq-envars.html
        # The exception is the database name, which Django requires to be set explicitly. But we
        # allow a default of the empty string to allow collectstatic to run without error, which
        # is run during Docker container build, without a connection to the database
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE', ''),
        "OPTIONS": {
            # Note that Django enforces its own defaults on top of psycopg's defaults. Specifically
            # it sets "check" to check connection when retrieving from the pool, which in most
            # cases is a good thing
            "pool": True
        },
    }
}

if os.environ.get('DATABASE_CREDENTIALS', ''):
    database = json.loads(os.environ['DATABASE_CREDENTIALS'])
    DATABASES = {
        "default": {
            "ENGINE": f"django.db.backends.postgresql",
            "NAME": database["dbname"],
            "USER": database["username"],
            "PASSWORD": database["password"],
            "HOST": database["host"],
            "PORT": database["port"],
        }
    }


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Storages

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}


# Static resources
# https://docs.djangoproject.com/en/5.1/howto/static-files/

# If we are on DBT Platform
STATIC_ROOT = 'assets/'

# GOV.UK Design System expects assets in assets/
STATIC_URL = 'assets/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Logging

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "asim_formatter": {
            "()": ASIMFormatter,
        },
    },
    "handlers": {
        "asim": {
            "class": "logging.StreamHandler",
            "formatter": "asim_formatter",
            "stream": sys.stdout,
        }
    },
    "root": {
        "handlers": ["asim"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["asim"],
            "propagate": False
        }
    }
}


# Transcription

AWS_TRANSCRIBE_ROLE_ARN = os.environ.get('AWS_TRANSCRIBE_ROLE_ARN')
AWS_SESSION_TOKEN = os.environ.get('AWS_SESSION_TOKEN')
AWS_EXPIRATION_TIMESTAMP = os.environ.get('AWS_EXPIRATION_TIMESTAMP')

AWS_TRANSCRIBE_ACCESS_KEY_ID = os.environ.get('AWS_TRANSCRIBE_ACCESS_KEY_ID')
AWS_TRANSCRIBE_SECRET_ACCESS_KEY = os.environ.get(
    'AWS_TRANSCRIBE_SECRET_ACCESS_KEY')


# Cleaning up HTML

BLEACH_ALLOWED_TAGS = ['li', 'br', 'p', 'b', 'i', 'u', 'em', 'strong']
BLEACH_ALLOWED_ATTRIBUTES = ['class']
BLEACH_ALLOWED_STYLES = []
BLEACH_ALLOWED_PROTOCOLS = []
BLEACH_STRIP_TAGS = True
BLEACH_STRIP_COMMENTS = True


WEBPACK_STATS_FILE = "react_apps-stats.json" if not DEBUG else "react_apps-stats-hot.json"
WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'webpack_bundles/',
        'CACHE': not DEBUG,
        'STATS_FILE': os.path.join(BASE_DIR, 'webpack-stats.json'),
        'POLL_INTERVAL': 0.1,
        'IGNORE': [r'.+\.hot-update.js', r'.+\.map'],
    }
}
