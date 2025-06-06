from django.contrib import admin

from .models import (
    Alibi,
    Article,
    Case,
    Charge,
    CrimeScene,
    Evidence,
    Person,
    Statement,
    Suspect,
)

admin.site.register(Person)
admin.site.register(Case)
admin.site.register(Suspect)
admin.site.register(Article)
admin.site.register(Charge)
admin.site.register(Alibi)
admin.site.register(Statement)
admin.site.register(CrimeScene)
admin.site.register(Evidence)
