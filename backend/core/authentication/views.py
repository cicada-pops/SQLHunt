import logging


from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.forms import PasswordResetForm
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from defender import utils

from core.users.models import User

from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = settings.GOOGLE_OAUTH_CALLBACK_URL
    client_class = OAuth2Client


@require_GET
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    This view sets the CSRF cookie and returns a 200 response.
    The CSRF cookie is needed for making POST requests.
    """
    return JsonResponse({"detail": "CSRF cookie set"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user and return tokens
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)  # type: ignore
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "token": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    logger.info(f"Login attempt for user: {username}")

    cooloff_time = getattr(settings, "DEFENDER_COOLOFF_TIME", 60)
    failure_limit = getattr(settings, "DEFENDER_LOGIN_FAILURE_LIMIT", 3)
    
    if utils.is_already_locked(request, get_username=lambda r: username):
        detail = (
            f"You have attempted to login {failure_limit+1} times with no success. "
            f"Your account is locked for {cooloff_time} seconds."
        )
        return Response({"error": detail}, status=status.HTTP_403_FORBIDDEN)

    user = authenticate(username=username, password=password)

    if user:
        refresh = RefreshToken.for_user(user)
        logger.info(f"Successful login for user: {username}")

        utils.add_login_attempt_to_db(
            request,
            login_valid=True,
            get_username=lambda r: username, 
        )
        utils.check_request(
            request,
            login_unsuccessful=False,
            get_username=lambda r: username,
        )

        return Response(
            {
                "user": UserSerializer(user).data,
                "token": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }
        )

    logger.warning(f"Failed login attempt for user: {username}")
    utils.add_login_attempt_to_db(
        request,
        login_valid=False,
        get_username=lambda r: username
    )
    utils.check_request(
        request,
        login_unsuccessful=True,
        get_username=lambda r: username,
    )

    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(["POST"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def api_password_reset(request):
    """
    Handles password reset via API
    """
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]  # type: ignore
        form = PasswordResetForm({"email": email})
        if form.is_valid():
            form.save(
                request=request,
                use_https=request.is_secure(),
                from_email=None,  # Use default from settings
                email_template_name="registration/password_reset_email.html",
            )
            return Response({"detail": _("Password reset email has been sent.")})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def api_password_reset_confirm(request):
    """
    Confirm password reset and set new password
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "Password has been reset successfully"})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def api_logout(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        logger.info(f"Successfully logged out user: {request.user.username}")
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_user_data(request):
    """
    Get current user data including experience
    """
    try:
        user_xp = User.objects.get(id=request.user.id)
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "experience": user_xp.xp,
            }
        )
    except User.DoesNotExist:
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "experience": 0,
            }
        )