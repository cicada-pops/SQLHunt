from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthViewTests(APITestCase):
    databases = {"users"}

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("api_register")
        self.login_url = reverse("api_login")
        self.user_url = reverse("api_user_data")
        self.logout_url = reverse("api_logout")
        self.password_reset_url = reverse("api_password_reset")
        self.password_reset_confirm_url = reverse("api_password_reset_confirm")
        self.csrf_url = reverse("csrf")

        self.user = User.objects.create_user(
            username="user", email="user@example.com", password="password-123"
        )

    def test_register_user_successfully(self):
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "password2": "newpassword123",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)  # type: ignore

    def test_register_user_passwords_do_not_match(self):
        data = {
            "username": "user1",
            "email": "user1@example.com",
            "password": "password1",
            "password2": "password2",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)  # type: ignore
        self.assertIn("Passwords do not match", response.data["password"][0])  # type: ignore

    def test_login_successful(self):
        data = {"username": "user", "password": "password-123"}
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)  # type: ignore

    def test_login_invalid_credentials(self):
        data = {"username": "user2", "password": "wrongpass"}
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_valid_token(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.force_authenticate(user=self.user)  # type: ignore
        response = self.client.post(self.logout_url, {"refresh": str(refresh)})
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

    def test_logout_invalid_token(self):
        self.client.force_authenticate(user=self.user)  # type: ignore
        response = self.client.post(self.logout_url, {"refresh": "badtoken"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_user_data_authenticated(self):
        self.client.force_authenticate(user=self.user)  # type: ignore
        response = self.client.get(self.user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)  # type: ignore

    def test_get_user_data_unauthenticated(self):
        response = self.client.get(self.user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_csrf_token_get(self):
        response = self.client.get(self.csrf_url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("CSRF cookie set", response.json()["detail"])

    def test_password_reset_email_sent(self):
        data = {"email": self.user.email}
        response = self.client.post(self.password_reset_url, data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Password reset email has been sent", response.data["detail"])  # type: ignore

    def test_password_reset_email_invalid(self):
        data = {"email": "invalid@example.com"}
        response = self.client.post(self.password_reset_url, data)
        self.assertEqual(response.status_code, 400)

    def test_password_reset_confirm_success(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        data = {
            "uid": uid,
            "token": token,
            "password": "password-123",
        }
        response = self.client.post(self.password_reset_confirm_url, data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Password has been reset", response.data["detail"])  # type: ignore

    def test_password_reset_confirm_mismatch(self):
        data = {
            "uid": "bad",
            "token": "bad",
            "password": "password-123",
        }
        response = self.client.post(self.password_reset_confirm_url, data)
        self.assertEqual(response.status_code, 400)

class ThrottleTests(APITestCase):
    databases = {"users"}

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="user", email="user@example.com", password="password-123"
        )
        self.login_url = reverse("api_login")
        self.user_url = reverse("api_user_data")
        

    def test_user_throttle(self):
        self.client.force_authenticate(user=self.user)
        for _ in range(101):
            response = self.client.get(self.user_url)
            self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_429_TOO_MANY_REQUESTS))
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                self.assertIn("Request was throttled", response.data["detail"])  # type: ignore

    def test_anon_throttle(self):
        for _ in range(61):
            response = self.client.post(self.login_url)
            self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_429_TOO_MANY_REQUESTS))
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                self.assertIn("Request was throttled", response.data["detail"])  # type: ignore