from django.contrib import admin

from .models import AvailableTable, Case, User, UserProgress


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'xp')

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    search_fields = ('case', 'user')

@admin.register(AvailableTable)
class AvailableTableAdmin(admin.ModelAdmin):
    list_display = ('id', 'case', 'table')
    search_fields = ('case',)

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'short_description', 'description', 'title', 'required_xp', 'reward_xp', 'answer')
    list_filter = ('required_xp', 'reward_xp',)
    search_fields = ('title',)
