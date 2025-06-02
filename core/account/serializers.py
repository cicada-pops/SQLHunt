from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
import logging

logger = logging.getLogger(__name__)

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

    def validate(self, data):
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
            Profile.objects.create(user=user)
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