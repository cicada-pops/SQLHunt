from django.urls import path
from . import views

urlpatterns = [
    path('userprogress/', views.get_user_progress, name='user-progress'),
] 