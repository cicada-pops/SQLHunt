from django.urls import path

from . import views

urlpatterns = [
    path('api/schema/<int:case_id>/', views.schema_view, name='case-schema'),
]
