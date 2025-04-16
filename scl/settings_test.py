from scl.settings import *

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

IP_FILTER_ALLOWED_NETWORKS = {"all": ["0.0.0.0/0"]}
