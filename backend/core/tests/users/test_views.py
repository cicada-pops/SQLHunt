from unittest.mock import MagicMock, patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from core.users.models import Case, User, UserProgress


class UsersViewTests(APITestCase):
    databases = {"users", "investigations"}

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

        self.case = Case.objects.using("users").create(
            title="A",
            description="A",
            short_description="A",
            required_xp=0,
            reward_xp=100,
            answer="A",
        )

    def test_get_case_list_success(self):
        url = reverse("case_list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore
        self.assertEqual(response.data[0]["id"], self.case.id)  # type: ignore

    def test_schema_view_success(self):
        with patch("core.users.views.get_schema") as mock_schema:
            mock_schema.return_value = {"tables": ["person", "evidence"]}
            url = reverse("case_schema", args=[self.case.id])  # type: ignore
            response = self.client.get(url)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["tables"], ["person", "evidence"])  # type: ignore

    def test_schema_view_not_found(self):
        with patch("core.users.views.get_schema", side_effect=Exception("not found")):
            url = reverse("case_schema", args=[self.case.id])  # type: ignore
            response = self.client.get(url)

            self.assertEqual(
                response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            self.assertIn("error", response.data)  # type: ignore

    def test_execute_sql_view_success(self):
        url = reverse("execute_sql", args=[self.case.id])  # type: ignore

        with patch("core.users.views.execute_safe_sql.delay") as mock_task:
            mock_task.return_value.id = "id"
            response = self.client.post(url, data={"sql": "SELECT 1"})

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data["task_id"], "id")  # type: ignore

    def test_execute_sql_view_no_sql(self):
        url = reverse("execute_sql", args=[self.case.id])  # type: ignore
        response = self.client.post(url, data={"sql": ""})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_execute_sql_view_progress_not_found(self):
        UserProgress.objects.all().delete()
        url = reverse("execute_sql", args=[self.case.id])  # type: ignore
        response = self.client.post(url, data={"sql": "SELECT 1"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Прогресс по делу не найден", response.data["error"])  # type: ignore

    def test_task_status_view_success(self):
        with patch("core.users.views.AsyncResult") as mock_async_result:
            mock_result = MagicMock()
            mock_result.status = "SUCCESS"
            mock_result.result = '{"key": "value"}'
            mock_async_result.return_value = mock_result

            url = reverse("task_status", args=["id"])
            response = self.client.get(url)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["status"], "SUCCESS")  # type: ignore
            self.assertEqual(response.data["result"], {"key": "value"})  # type: ignore

    def test_task_status_view_failed(self):
        with patch("core.users.views.AsyncResult") as mock_result:
            mock = MagicMock()
            mock.failed.return_value = True
            mock.status = "FAILURE"
            mock.result = Exception("Some error")
            mock_result.return_value = mock

            url = reverse("task_status", args=["id"])
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["status"], "FAILURE")  # type: ignore
            self.assertIn("error", response.data)  # type: ignore

    def test_submit_answer_correct(self):
        with patch("core.users.views.check_answer", return_value=True):
            url = reverse("submit_answer", args=[self.case.id])  # type: ignore
            response = self.client.post(url, data={"answer": "A"})

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data["correct"])  # type: ignore

    def test_submit_answer_incorrect(self):
        with patch("core.users.views.check_answer", return_value=False):
            url = reverse("submit_answer", args=[self.case.id])  # type: ignore
            response = self.client.post(url, data={"answer": "B"})

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertFalse(response.data["correct"])  # type: ignore

    def test_get_user_progress_success(self):
        url = reverse("user_progress")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["case_id"], self.case.id)  # type: ignore
        self.assertEqual(response.data[0]["status"], "не начато")  # type: ignore

    def test_get_user_progress_unauthorized(self):
        self.client.force_authenticate(user=None)  # type: ignore
        url = reverse("user_progress")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
