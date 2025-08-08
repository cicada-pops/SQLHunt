from django.contrib.auth.models import User as AuthUser
from django.test import TransactionTestCase

from core.users.models import Case, User, UserProgress


class UsersSignalTests(TransactionTestCase):
    databases = {"users"}

    def setUp(self):
        self.auth_user = AuthUser.objects.create_user(
            username="test1", password="12345678"
        )
        self.user = User.objects.using("users").get(id=self.auth_user.id)

    def test_user_deleted_on_authuser_delete(self):
        uid = self.auth_user.id
        self.auth_user.delete()
        self.assertFalse(User.objects.using("users").filter(id=uid).exists())

    def test_user_created_on_authuser_creation(self):
        user = AuthUser.objects.create_user(username="test2", password="12345678")
        profile = User.objects.using("users").filter(id=user.id).first()
        self.assertIsNotNone(profile)

    def test_create_userprogress_on_case_creation(self):
        case = Case.objects.using("users").create(
            title="A",
            description="A",
            short_description="A",
            reward_xp=100,
            answer="A",
            required_xp=0,
        )
        is_progress_exists = (
            UserProgress.objects.using("users")
            .filter(user=self.user, case=case)
            .exists()
        )
        self.assertTrue(is_progress_exists)

    def test_create_userprogress_on_user_creation(self):
        case = Case.objects.using("users").create(
            title="B",
            description="B",
            short_description="B",
            reward_xp=100,
            answer="B",
            required_xp=0,
        )
        new_auth_user = AuthUser.objects.create_user(
            username="test2", password="12345678"
        )
        new_user = User.objects.using("users").get(id=new_auth_user.id)

        progress_exists = (
            UserProgress.objects.using("users")
            .filter(user=new_user, case=case)
            .exists()
        )
        self.assertTrue(progress_exists)

    def test_deduct_xp_on_case_deletion(self):
        case = Case.objects.using("users").create(
            title="E",
            description="E",
            short_description="E",
            reward_xp=100,
            answer="E",
            required_xp=0,
        )

        progress = UserProgress.objects.using("users").get(user=self.user, case=case)
        progress.status = "завершено"
        self.user.xp += 100

        self.user.save(using="users")
        progress.save(using="users")

        self.user.refresh_from_db(using="users")
        self.assertEqual(self.user.xp, 100)

        case.delete(using="users")

        self.user.refresh_from_db(using="users")
        self.assertEqual(self.user.xp, 0)
