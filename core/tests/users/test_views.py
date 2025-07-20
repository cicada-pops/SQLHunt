from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from users.models import Case, User

AuthUser = get_user_model()

class GetUserProgressViewTests(APITestCase):
    databases = {'auth', 'users', 'investigations'}

    def setUp(self):
        self.client = APIClient()
        self.authuser = AuthUser.objects.create_user(username="testuser", password="testpass123")
        self.client.force_authenticate(user=self.authuser)
        self.user = User.objects.get(pk=self.authuser.pk)

        self.case = Case.objects.using('users').create(
            title="A",
            description="A",
            short_description="A",
            required_xp=0,
            reward_xp=100,
            answer='A'
        )
        
    def test_get_user_progress_success(self):
        url = reverse('user-progress')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['case_id'], self.case.id) # type: ignore
        self.assertEqual(response.data[0]['status'], 'не начато') # type: ignore

    def test_get_user_progress_unauthorized(self):
        self.client.force_authenticate(user=None) # type: ignore
        url = reverse('user-progress')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
