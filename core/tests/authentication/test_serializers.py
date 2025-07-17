from authentication.serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    UserRegistrationSerializer,
)
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.test import TestCase
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

User = get_user_model()


class UserRegistrationSerializerTest(TestCase):
    databases = {'auth', 'users'}

    def test_valid_registration(self):
        data = {
            "username": "user",
            "email": "user@example.com",
            "password": "password-123",
            "password2": "password-123"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.email, "user@example.com")
        self.assertTrue(user.check_password("password-123"))

    def test_password_mismatch(self):
        data = {
            "username": "user1",
            "email": "user1@example.com",
            "password": "password-123",
            "password2": "different123"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)
        self.assertEqual(serializer.errors["password"][0], "Пароли не совпадают") # type: ignore

    def test_short_password(self):
        data = {
            "username": "user2",
            "email": "user2@example.com",
            "password": "123",
            "password2": "123"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)
        self.assertIn("Пароль слишком короткий", serializer.errors["password"]) # type: ignore
    
    def test_numeric_password(self):
        data = {
            "username": "user5",
            "email": "user5@example.com",
            "password": "12345678",
            "password2": "12345678"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)
        self.assertIn("Пароль не должен состоять только из цифр", serializer.errors["password"]) # type: ignore

    def test_non_unique_email(self):
        User.objects.create_user(username="user3", email="user3@example.com", password="password123")
        data = {
            "username": "newuser",
            "email": "user3@example.com",
            "password": "password-123",
            "password2": "password-123"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertIn("Пользователь с таким email уже зарегистрирован", serializer.errors["email"][0]) # type: ignore

    def test_non_unique_username(self):
        User.objects.create_user(username="user4", email="user4@example.com", password="password-123")
        data = {
            "username": "user4",
            "email": "newuser@example.com",
            "password": "password-123",
            "password2": "password-123"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertIn("Пользователь с таким именем уже существует", serializer.errors["username"][0]) # type: ignore


class PasswordResetSerializerTest(TestCase):
    databases = {'auth', 'users'}

    def test_valid_email(self):
        User.objects.create_user(username="reset", email="reset@example.com", password="password-123")
        serializer = PasswordResetSerializer(data={"email": "reset@example.com"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_email(self):
        serializer = PasswordResetSerializer(data={"email": "notfound@example.com"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertIn("User with this email does not exist.", serializer.errors["email"]) # type: ignore


class PasswordResetConfirmSerializerTest(TestCase):
    databases = {'auth', 'users'}

    def setUp(self):
        self.user = User.objects.create_user(username="confirm", email="confirm@example.com", password="password-123")
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)

    def test_valid_token(self):
        data = {
            "uid": self.uid,
            "token": self.token,
            "password": "newpassword123"
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_invalid_uid(self):
        data = {
            "uid": "invalid",
            "token": self.token,
            "password": "newpassword123"
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_invalid_token(self):
        data = {
            "uid": self.uid,
            "token": "invalid",
            "password": "newpassword123"
        }
        serializer = PasswordResetConfirmSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertIn("Invalid or expired token", serializer.errors["non_field_errors"]) # type: ignore
