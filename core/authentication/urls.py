from django.contrib.auth import views as auth_views
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

# app_name = 'authentication'

urlpatterns = [
    path('api/csrf/', views.get_csrf_token, name='csrf'),
    path('api/register/', views.register_user, name='api_register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/', views.get_user_data, name='api_user_data'),
    path('api/password-reset/', views.api_password_reset, name='api_password_reset'),
    path('api/password-reset/confirm/', views.api_password_reset_confirm, name='api_password_reset_confirm'),
    
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('logout-then-login/', auth_views.LogoutView.as_view(next_page='login'), name='logout_then_login'),
    
    path('dashboard/', views.dashboard, name='dashboard'),
    
    path('password-change/', auth_views.PasswordChangeView.as_view(), name='password_change'),
    path('password-change/done/', auth_views.PasswordChangeDoneView.as_view(), name='password_change_done'),
    path('password-reset/', auth_views.PasswordResetView.as_view(
        success_url='/authentication/password-reset/done/',
        html_email_template_name='registration/password_reset_email.html'
    ), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('password-reset/confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        success_url='/authentication/password-reset/complete/'
    ), name='password_reset_confirm'),
    path('password-reset/complete/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    
    path('register/', views.register, name='register'),
    path('edit/', views.edit, name='edit'),
    path("api/google/", views.GoogleLogin.as_view(), name="google_login"),
    path("api/github/", views.GitHubLogin.as_view(), name="github_login"), 
]
