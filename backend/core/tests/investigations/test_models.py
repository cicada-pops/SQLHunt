from datetime import date, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.investigations.models import (
    Alibi,
    Article,
    Case,
    Charge,
    CrimeScene,
    Evidence,
    Person,
    Statement,
    Suspect,
)


class PersonModelTest(TestCase):
    databases = {"investigations"}

    def test_person_validations(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        person.clean()
        person.save()

    def test_person_underage(self):
        person = Person.objects.create(
            name="Jane Doe", date_birth=date(2010, 1, 1), description="Test description"
        )
        with self.assertRaises(ValidationError):
            person.clean()


class CaseModelTest(TestCase):
    databases = {"investigations"}

    def test_case_validation(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        case.clean()
        case.save()

    def test_case_invalid_open_date(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date.today() + timedelta(days=1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        with self.assertRaises(ValidationError):
            case.clean()

    def test_case_invalid_closed_status(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=date(2023, 1, 1),
            type="убийство",
            status="открыто",
        )
        with self.assertRaises(ValidationError):
            case.clean()


class SuspectModelTest(TestCase):
    databases = {"investigations"}

    def test_suspect_status(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        suspect.save()

    def test_suspect_invalid_status(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        suspect = Suspect.objects.create(person=person, status="invalid_status")
        with self.assertRaises(ValidationError):
            suspect.clean()


class ChargeModelTest(TestCase):
    databases = {"investigations"}

    def test_charge_validation(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        article = Article.objects.create(id=1, description="Test article")
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        charge = Charge.objects.create(
            article=article,
            suspect=suspect,
            date_accusation=date(2023, 1, 1),
            status="ожидает решения",
        )
        charge.clean()
        charge.save()

    def test_charge_invalid_date(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date.today() + timedelta(days=1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        article = Article.objects.create(id=1, description="Test article")
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        charge = Charge.objects.create(
            article=article,
            suspect=suspect,
            date_accusation=date.today() + timedelta(days=1),
            status="ожидает решения",
        )
        with self.assertRaises(ValidationError):
            charge.clean()


class AlibiModelTest(TestCase):
    databases = {"investigations"}

    def test_alibi_status(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        alibi = Alibi.objects.create(
            status="подтверждено",
            case=case,
            description="Test description",
            suspect=suspect,
        )
        alibi.save()

    def test_alibi_invalid_status(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        alibi = Alibi.objects.create(
            status="invalid_status",
            case=case,
            description="Test description",
            suspect=suspect,
        )
        with self.assertRaises(ValidationError):
            alibi.clean()


class StatementModelTest(TestCase):
    databases = {"investigations"}

    def test_statement_validation(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        statement = Statement.objects.create(
            case=case,
            person=person,
            statement="Test statement",
            date_of_statement=date(2023, 1, 1),
        )
        statement.clean()
        statement.save()

    def test_statement_invalid_date(self):
        person = Person.objects.create(
            name="John Doe", date_birth=date(2000, 1, 1), description="Test description"
        )
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        suspect = Suspect.objects.create(person=person, status="в розыске")
        suspect.cases.add(case)
        statement = Statement.objects.create(
            case=case,
            person=person,
            statement="Test statement",
            date_of_statement=date.today() + timedelta(days=1),
        )
        with self.assertRaises(ValidationError):
            statement.clean()


class CrimeSceneModelTest(TestCase):
    databases = {"investigations"}

    def test_crime_scene_validation(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        crime_scene = CrimeScene.objects.create(
            location="Test location", date=date(2023, 1, 1), case=case
        )
        crime_scene.clean()
        crime_scene.save()

    def test_crime_scene_invalid_date(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        crime_scene = CrimeScene.objects.create(
            location="Test location", date=date.today() + timedelta(days=1), case=case
        )
        with self.assertRaises(ValidationError):
            crime_scene.clean()


class EvidenceModelTest(TestCase):
    databases = {"investigations"}

    def test_evidence_validation(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        crime_scene = CrimeScene.objects.create(
            location="Test location", date=date(2023, 1, 1), case=case
        )
        evidence = Evidence.objects.create(
            type="физическое",
            description="Test description",
            date=date(2023, 1, 1),
            scene=crime_scene,
        )
        evidence.clean()
        evidence.save()

    def test_evidence_invalid_date(self):
        case = Case.objects.create(
            description="Test case",
            date_opened=date(2023, 1, 1),
            date_closed=None,
            type="убийство",
            status="открыто",
        )
        crime_scene = CrimeScene.objects.create(
            location="Test location", date=date(2023, 1, 1), case=case
        )
        evidence = Evidence.objects.create(
            type="физическое",
            description="Test description",
            date=date.today() + timedelta(days=1),
            scene=crime_scene,
        )
        with self.assertRaises(ValidationError):
            evidence.clean()
