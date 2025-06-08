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


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    search_fields = ['name', 'description']

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    search_fields = ['description', 'type', 'status']

@admin.register(Suspect)
class SuspectAdmin(admin.ModelAdmin):
    search_fields = ['person__name', 'status']

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    search_fields = ['description']

@admin.register(Charge)
class ChargeAdmin(admin.ModelAdmin):
    search_fields = ['status', 'article__description', 'suspect__person__name']

@admin.register(Alibi)
class AlibiAdmin(admin.ModelAdmin):
    search_fields = ['description', 'status', 'suspect__person__name']

@admin.register(Statement)
class StatementAdmin(admin.ModelAdmin):
    search_fields = ['statement', 'person__name', 'alibi__description']

@admin.register(CrimeScene)
class CrimeSceneAdmin(admin.ModelAdmin):
    search_fields = ['location', 'case__description']

@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    search_fields = ['description', 'type', 'scene__location']
