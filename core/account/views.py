import logging

from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import User as UserXP
from django.contrib.auth.forms import PasswordResetForm
from django.utils.translation import gettext as _
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

from .forms import LoginForm, ProfileEditForm, UserEditForm, UserRegistrationForm
from .models import Profile
from .serializers import UserRegistrationSerializer, UserSerializer, PasswordResetSerializer

logger = logging.getLogger(__name__)

@require_GET
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    This view sets the CSRF cookie and returns a 200 response.
    The CSRF cookie is needed for making POST requests.
    """
    return JsonResponse({'detail': 'CSRF cookie set'})

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user and return tokens
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'token': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    logger.info(f"Login attempt for user: {username}")
    
    user = authenticate(username=username, password=password)
    
    if user:
        refresh = RefreshToken.for_user(user)
        logger.info(f"Successful login for user: {username}")
        return Response({
            'user': UserSerializer(user).data,
            'token': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    logger.warning(f"Failed login attempt for user: {username}")
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

def user_login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            user = authenticate(username=cd['username'], password=cd['password'])
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return HttpResponse('Authenticated successfully')
                else:
                     return HttpResponse('Disabled account')
            else:
                return HttpResponse('Invalid login')
    else:
        form = LoginForm()
    return render(request, 'account/login.html', {'form': form})
            
@login_required
def dashboard(request):
    return render(request, 'account/dashboard.html', {'section': 'dashboard'})

def register(request):
    if request.method == 'POST':
        user_form = UserRegistrationForm(request.POST)
        if user_form.is_valid():
            new_user = user_form.save(commit=False)
            new_user.set_password(user_form.cleaned_data['password'])
            new_user.save()
            Profile.objects.create(user=new_user)
            return render(request, 'account/register_done.html', {'new_user': new_user})
    else:
        user_form = UserRegistrationForm()
    return render(request, 'account/register.html', {'user_form': user_form})


@login_required
def edit(request):
    if request.method == 'POST':
        user_form = UserEditForm(instance=request.user, 
                                 data=request.POST)
        profile_form = ProfileEditForm(instance=request.user.profile, data=request.POST, 
                                       files=request.FILES)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Profile updated successfully')
        else:
            messages.error(request, 'Error updating your profile')
    else:
        user_form = UserEditForm(instance=request.user)
        profile_form = ProfileEditForm(instance=request.user.profile)
        
    return render(request,
                    'account/edit.html',
                    {'user_form': user_form,
                    'profile_form': profile_form})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data(request):
    """
    Get current user data including experience
    """
    try:
        user_xp = UserXP.objects.get(id=request.user.id)
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'experience': user_xp.xp
        })
    except UserXP.DoesNotExist:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'experience': 0
        })

@api_view(['POST'])
@permission_classes([AllowAny])
def api_password_reset(request):
    """
    Handles password reset via API
    """
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        form = PasswordResetForm({'email': email})
        if form.is_valid():
            form.save(
                request=request,
                use_https=request.is_secure(),
                from_email=None,  # Use default from settings
                email_template_name='registration/password_reset_email.html'
            )
            return Response({'detail': _('Password reset email has been sent.')})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_password_reset_confirm(request):
    """
    Confirm password reset and set new password
    """
    try:
        uid = force_str(urlsafe_base64_decode(request.data.get('uid', '')))
        token = request.data.get('token', '')
        password = request.data.get('password', '')
        
        if not uid or not token or not password:
            raise ValidationError('Missing required fields')
            
        UserModel = get_user_model()
        user = UserModel.objects.get(pk=uid)
        
        if not default_token_generator.check_token(user, token):
            raise ValidationError('Invalid reset token')
            
        user.set_password(password)
        user.save()
        
        return Response({'detail': 'Password has been reset successfully'})
        
    except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist) as e:
        raise ValidationError('Invalid reset link')
    except Exception as e:
        logger.error(f"Password reset confirmation error: {str(e)}")
        raise ValidationError('Password reset failed')
