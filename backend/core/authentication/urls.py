from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

urlpatterns = [
    path(
        "api/",
        include(
            [
                path("csrf/", views.get_csrf_token, name="csrf"),
                path("register/", views.register_user, name="api_register"),
                path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
                path(
                    "token/refresh/", TokenRefreshView.as_view(), name="token_refresh"
                ),
                path("login/", views.api_login, name="api_login"),
                path("logout/", views.api_logout, name="api_logout"),
                path("user/", views.get_user_data, name="api_user_data"),
                path(
                    "password-reset/",
                    views.api_password_reset,
                    name="api_password_reset",
                ),
                path(
                    "password-reset/confirm/",
                    views.api_password_reset_confirm,
                    name="api_password_reset_confirm",
                ),
                path("google-login/", views.GoogleLogin.as_view(), name="google_login"),
            ]
        ),
    ),
]
