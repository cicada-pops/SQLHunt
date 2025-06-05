from django.core.exceptions import ValidationError
from django.test import TestCase
from users.models import AvailableTable, Case, User, UserProgress


class UsersModelTest(TestCase):
    databases = {'users'}

    def test_valid_user(self):
        user = User.objects.create(xp=10)
        user.full_clean()
        user.save()

    def test_invalid_negative_xp(self):
        user = User(xp=-5)
        with self.assertRaises(ValidationError):
            user.full_clean()


class CaseModelTest(TestCase):
    databases = {'users'}

    def test_valid_case(self):
        case = Case.objects.create(
            title="Test Case",
            description="A test case",
            required_xp=5,
            answer="some valid answer"
        )
        case.full_clean()
        case.save()

    def test_invalid_negative_required_xp(self):
        case = Case(title="Invalid XP Case", description="Bad case", required_xp=-1,  answer="some invalid answer")
        with self.assertRaises(ValidationError):
            case.full_clean()


class AvailableTablesModelTest(TestCase):
    databases = {'users'}

    def test_available_tables_unique(self):
        case = Case.objects.create(title="Case", description="desc", required_xp=0, answer="some valid answer")
        AvailableTable.objects.create(case=case, table="evidence")
        with self.assertRaises(Exception):
            AvailableTable.objects.create(case=case, table="evidence")


class UserProgressModelTest(TestCase):
    databases = {'users'}

    def setUp(self):
        self.user = User.objects.create(xp=10)
        self.case = Case.objects.create(title="Case 1", description="desc", required_xp=5, answer="some valid answer")

    def test_valid_user_progress(self):
        progress = UserProgress(user=self.user, case=self.case, status='в процессе', answers={})
        progress.clean()
        progress.save()

    def test_not_enough_xp(self):
        low_xp_user = User.objects.create(xp=2)
        progress = UserProgress(user=low_xp_user, case=self.case, status='не начато', answers={})
        with self.assertRaises(ValidationError):
            progress.clean()

    def test_unique_user_case(self):
        UserProgress.objects.create(user=self.user, case=self.case, status='в процессе', answers={})
        with self.assertRaises(Exception):
            UserProgress.objects.create(user=self.user, case=self.case, status='в процессе', answers={})
