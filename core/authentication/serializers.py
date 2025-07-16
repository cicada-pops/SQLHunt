import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

logger = logging.getLogger(__name__)

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), 
                                    message="Пользователь с таким именем уже существует")]
    )
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), 
                                    message="Пользователь с таким email уже зарегистрирован")]
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, data): # type: ignore
        if data['password'] != data['password2']:
            logger.warning("Password mismatch in registration")
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        try:
            validate_password(data['password'])
        except DjangoValidationError as e:
            translations = {
                "This password is too short. It must contain at least 8 characters.":
                    "Пароль слишком короткий",
                "This password is too common.":
                    "Пароль слишком простой и распространённый",
                "This password is entirely numeric.":
                    "Пароль не должен состоять только из цифр",
            }

            translated_errors = []
            for msg in e.messages:
                translated_errors.append(translations.get(msg, msg))

            raise serializers.ValidationError({"password": translated_errors})

        return data

    def create(self, validated_data):
        try:
            validated_data.pop('password2')
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password']
            )
            logger.info(f"Successfully created user: {user.username}")
            return user
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise serializers.ValidationError({
                "error": f"Error creating user: {str(e)}"
            })

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email') 

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, email):
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return email

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = get_user_model().objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError("Invalid user identification")

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired token")

        attrs['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data['user'] # type: ignore
        user.set_password(self.validated_data['password']) # type: ignore
        user.save()
        return user
