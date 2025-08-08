from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.test import TestCase

from core.users.models import AvailableTable, Case, User, UserProgress


class UsersModelTest(TestCase):
    databases = {"users"}

    def test_valid_user(self):
        user = User.objects.create(xp=10)
        user.full_clean()
        user.save()

    def test_invalid_negative_xp(self):
        user = User(xp=-5)
        with self.assertRaises(ValidationError):
            user.full_clean()


class CaseModelTest(TestCase):
    databases = {"users"}

    def test_valid_case(self):
        case = Case.objects.create(
            title="Test Case",
            description="A test case",
            required_xp=5,
            reward_xp=5,
            answer="some valid answer",
        )
        case.full_clean()
        case.save()

    def test_invalid_negative_required_xp(self):
        case = Case(
            title="Invalid XP Case",
            description="Bad case",
            required_xp=-1,
            answer="some invalid answer",
            reward_xp=5,
        )
        with self.assertRaises(ValidationError):
            case.full_clean()

    def test_unique_title(self):
        Case.objects.create(
            title="Duplicate Title",
            description="Some description",
            required_xp=0,
            reward_xp=5,
            answer="answer",
        )
        with self.assertRaises(IntegrityError):
            Case.objects.create(
                title="Duplicate Title",
                description="Another description",
                required_xp=1,
                reward_xp=10,
                answer="another answer",
            )


class AvailableTablesModelTest(TestCase):
    databases = {"users"}

    def test_available_tables_unique(self):
        case = Case.objects.create(
            title="Case",
            description="desc",
            required_xp=0,
            answer="some valid answer",
            reward_xp=5,
        )
        AvailableTable.objects.create(case=case, table="evidence")
        with self.assertRaises(IntegrityError):
            AvailableTable.objects.create(case=case, table="evidence")


class UserProgressModelTest(TestCase):
    databases = {"users"}

    def setUp(self):
        self.user = User.objects.create(xp=10)
        self.case = Case.objects.create(
            title="Case 1",
            description="desc",
            required_xp=5,
            answer="some valid answer",
            reward_xp=5,
        )

    def test_valid_user_progress(self):
        UserProgress.objects.all().delete()
        progress = UserProgress(user=self.user, case=self.case, status="в процессе")
        progress.full_clean()
        progress.save()
        self.assertIsNotNone(progress.pk)

    def test_not_enough_xp(self):
        low_xp_user = User.objects.create(xp=2)
        progress = UserProgress(user=low_xp_user, case=self.case, status="не начато")
        with self.assertRaises(ValidationError):
            progress.full_clean()

    def test_unique_user_case(self):
        UserProgress.objects.all().delete()
        UserProgress.objects.create(user=self.user, case=self.case, status="в процессе")
        with self.assertRaises(IntegrityError):
            UserProgress.objects.create(
                user=self.user, case=self.case, status="в процессе"
            )
