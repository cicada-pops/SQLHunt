from django.test import TransactionTestCase

from core.users.models import Case, User, UserProgress


class UsersSignalTests(TransactionTestCase):
    databases = {"users"}

    def setUp(self):
        self.user = User.objects.create_user(
            username="test1", password="12345678"
        )

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
        new_user = User.objects.create_user(
            username="test2", password="12345678"
        )

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
