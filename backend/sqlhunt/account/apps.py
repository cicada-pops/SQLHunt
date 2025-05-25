# account/apps.py
import sys

from django.apps import AppConfig


class AccountConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'account'

    def ready(self):
        if 'migrate' not in sys.argv:
            import account.signals
