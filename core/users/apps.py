import sys

from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        if 'migrate' not in sys.argv:
            from . import signals  # noqa: F401

