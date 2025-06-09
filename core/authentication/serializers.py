import logging

from django.contrib.auth import get_user_model
from rest_framework import serializers

logger = logging.getLogger(__name__)

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'password': {'required': True},
            'password2': {'required': True},
        }

    def validate(self, data): # type: ignore
        logger.info(f"Validating registration data for username: {data.get('username')}")
        
        # Validate passwords match
        if data['password'] != data['password2']:
            logger.warning("Password mismatch in registration")
            raise serializers.ValidationError({
                "password": "Пароли не совпадают"
            })

        # Validate username
        if User.objects.filter(username=data['username']).exists():
            logger.warning(f"Username already exists: {data['username']}")
            raise serializers.ValidationError({
                "username": "Этот псевдоним уже занят"
            })

        # Validate email
        if User.objects.filter(email=data['email']).exists():
            logger.warning(f"Email already exists: {data['email']}")
            raise serializers.ValidationError({
                "email": "Эта эл. почта уже занята"
            })

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

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value 
