"""
Django settings for scl project.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import os
from pathlib import Path

from django.core.management.utils import get_random_secret_key
from django.urls import reverse_lazy

# General settings

DEBUG = os.environ.get('DEBUG', '') == 'True'
BASE_DIR = Path(__file__).resolve().parent.parent


# Security settings

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', get_random_secret_key())

# The ALB enforces that requests have the right header, which means we don't have to enforce that
# here, which also allows requests from the ALB itself as part of its healthcheck
ALLOWED_HOSTS = ["*"]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True

CSRF_COOKIE_SECURE = True


# Staff SSO / Authentication

AUTHBROKER_URL = os.environ.get('AUTHBROKER_URL', '')
AUTHBROKER_INTERNAL_URL = os.environ.get('AUTHBROKER_INTERNAL_URL', '')

AUTHBROKER_CLIENT_ID = os.environ.get('AUTHBROKER_CLIENT_ID', '')
AUTHBROKER_CLIENT_SECRET = os.environ.get('AUTHBROKER_CLIENT_SECRET', '')
AUTHBROKER_STAFF_SSO_SCOPE = 'read write'
AUTHBROKER_ANONYMOUS_PATHS = []
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


# Application definition

INSTALLED_APPS = [
    'django_extensions',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'authbroker_client',
    'scl.core',
    'scl.static',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'authbroker_client.middleware.ProtectAllViewsMiddleware',
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
        "BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage",
    },
}


# Static resources
# https://docs.djangoproject.com/en/5.1/howto/static-files/

# GOV.UK Design System expects assets in assets/
STATIC_ROOT = '/app/assets/'
STATIC_URL = 'assets/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Logging

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}


# Transcription

AWS_TRANSCRIBE_ROLE_ARN = os.environ.get('AWS_TRANSCRIBE_ROLE_ARN')
