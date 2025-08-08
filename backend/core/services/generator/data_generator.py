import csv
import os
import random
from datetime import datetime, timedelta

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
from django.db import connections

from .utils.utils import (
    get_articles,
    get_available_evidence_types,
    get_charge_status,
    get_confirmed_alibi,
    get_date_between,
    get_date_of_birth,
    get_description,
    get_false_alibi,
    get_job,
    get_location,
    get_name,
    get_random_date_between,
    get_random_evidence_description,
    get_sample_suspects,
    get_suspect_count,
    get_suspect_status,
    get_unconfirmed_alibi,
)


class InvestigationsDataGenerator:
    def __init__(self):
        self.persons = []
        self.cases = []
        self.suspects = []
        self.articles = []
        self.charges = []
        self.alibis = []
        self.statements = []
        self.scenes = []
        self.evidence = []
        self.case_suspects = []

    def generate_persons(self, count: int = 1500):
        for _ in range(count):
            name = get_name()
            date_of_birth = get_date_of_birth()
            job = get_job()
            description = get_description(name, job)

            person = Person.objects.using("investigations").create(
                name=name, date_birth=date_of_birth, description=description
            )
            self.persons.append(person)

    def generate_cases(self, csv_path=None):
        if csv_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(base_dir, "data", "case.csv")

        with open(csv_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                date_opened = datetime.strptime(row["date_opened"], "%Y-%m-%d").date()
                date_closed = (
                    datetime.strptime(row["date_closed"], "%Y-%m-%d").date()
                    if row["date_closed"]
                    else None
                )
                case = Case.objects.using("investigations").create(
                    description=row["description"],
                    date_opened=date_opened,
                    date_closed=date_closed,
                    type=row["type"],
                    resolution=row["resolution"],
                    status=row["status"],
                )
                self.cases.append(case)

    def generate_suspects(self, count: int = 500):
        persons_sample = random.sample(self.persons, min(count, len(self.persons)))
        for person in persons_sample:
            suspect = Suspect.objects.using("investigations").create(
                person=person, status=get_suspect_status()
            )
            self.suspects.append(suspect)

    def generate_articles(self, csv_path=None):
        if csv_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(base_dir, "data", "article.csv")

        with open(csv_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                article = Article.objects.using("investigations").create(
                    id=row["id"], description=row["description"]
                )
                self.articles.append(article)

    def generate_charges(self, count: int = 100):
        if not self.articles or not self.suspects:
            raise ValueError("Сначала нужно сгенерировать articles и suspects")

        end_date = datetime.now()
        start_date = end_date - timedelta(days=25 * 365)
        date_range = (end_date - start_date).days

        for _ in range(count):
            article = random.choice(self.articles)
            suspect = random.choice(self.suspects)
            random_days = random.randint(0, date_range)
            date_accusation = start_date + timedelta(days=random_days)

            status = get_charge_status()
            charge = Charge.objects.using("investigations").create(
                article=article,
                suspect=suspect,
                date_accusation=date_accusation.date(),
                status=status,
            )
            self.charges.append(charge)

    def generate_alibis(self):
        used_suspects = set()

        for case_id, suspect_id in self.case_suspects:
            if suspect_id in used_suspects:
                continue
            used_suspects.add(suspect_id)

            case = next(c for c in self.cases if c.id == case_id)
            suspect = next(s for s in self.suspects if s.id == suspect_id)

            if random.random() < 0.3:
                status = "ложное"
                description = get_false_alibi()
            else:
                status = random.choices(
                    ["подтверждено", "не подтверждено"], weights=[0.6, 0.4]
                )[0]
                description = (
                    get_confirmed_alibi()
                    if status == "подтверждено"
                    else get_unconfirmed_alibi()
                )

            alibi = Alibi.objects.using("investigations").create(
                status=status, case=case, description=description, suspect=suspect
            )
            self.alibis.append(alibi)

    def generate_statements(self, csv_path=None):
        if not self.cases or not self.persons:
            raise ValueError("Сначала нужно сгенерировать cases и persons")

        if csv_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(base_dir, "data", "statement.csv")

        with open(csv_path, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                try:
                    case = next(c for c in self.cases if c.id == int(row["case_id"]))
                    person = next(
                        p for p in self.persons if p.id == int(row["person_id"])
                    )

                    date_of_statement = datetime.strptime(
                        row["date_of_statement"], "%Y-%m-%d"
                    ).date()
                    if date_of_statement < case.date_opened:
                        date_of_statement = case.date_opened + timedelta(
                            days=random.randint(1, 30)
                        )

                    statement = Statement.objects.using("investigations").create(
                        case=case,
                        person=person,
                        statement=row["statement"],
                        date_of_statement=date_of_statement,
                    )
                    self.statements.append(statement)

                except StopIteration:
                    print(f"Не найдено case или person для statement: {row}")
                    continue
                except Exception as e:
                    print(f"Ошибка при создании statement: {e}")
                    continue

    def generate_crime_scenes(self):
        used_locations = set()

        def get_unique_location():
            while True:
                location = get_location()
                if location not in used_locations:
                    used_locations.add(location)
                    return location

        for case in self.cases:
            latest_date = case.date_opened - timedelta(days=1)
            earliest_date = latest_date - timedelta(days=30)
            crime_date = get_date_between(earliest_date, latest_date)
            location = get_unique_location()

            scene = CrimeScene.objects.using("investigations").create(
                location=location, date=crime_date, case=case
            )
            self.scenes.append(scene)

    def generate_evidence(self):
        for scene in self.scenes:
            case = scene.case
            crime_type = case.type
            date_opened = case.date_opened
            date_closed = case.date_closed or datetime.now().date()

            num_evidences = random.randint(1, 5)

            for _ in range(num_evidences):
                available_types = get_available_evidence_types(crime_type)
                if not available_types:
                    continue

                evidence_type = random.choice(available_types)
                description = get_random_evidence_description(evidence_type, crime_type)
                if not description:
                    continue

                evidence_date = get_random_date_between(date_opened, date_closed)

                evidence = Evidence.objects.using("investigations").create(
                    type=evidence_type,
                    description=description,
                    date=evidence_date,
                    scene=scene,
                )
                self.evidence.append(evidence)

    def generate_case_suspect(self):
        suspect_to_articles = {}
        for charge in self.charges:
            sid = charge.suspect.id
            aid = charge.article.id
            if sid not in suspect_to_articles:
                suspect_to_articles[sid] = set()
            suspect_to_articles[sid].add(aid)

        article_to_suspects = {}
        for sid, articles in suspect_to_articles.items():
            for aid in articles:
                if aid not in article_to_suspects:
                    article_to_suspects[aid] = []
                article_to_suspects[aid].append(sid)

        all_suspect_ids = [s.id for s in self.suspects]

        for case in self.cases:
            case_id = case.id
            case_type = case.type

            num_suspects = get_suspect_count()

            chosen_suspects = set()
            matching_articles = get_articles(case_type=case_type)
            matching_suspects = set()
            for aid in matching_articles:
                matching_suspects.update(article_to_suspects.get(aid, []))

            matching_suspects = list(matching_suspects)
            if matching_suspects and num_suspects > 0 and random.random() < 0.6:
                matched = random.choice(matching_suspects)
                chosen_suspects.add(matched)

            if len(chosen_suspects) < num_suspects:
                remaining = list(set(all_suspect_ids) - chosen_suspects)
                chosen_suspects.update(
                    get_sample_suspects(num_suspects - len(chosen_suspects), remaining)
                )

            for sid in chosen_suspects:
                suspect = next(s for s in self.suspects if s.id == sid)
                suspect.cases.add(case)
                self.case_suspects.append((case_id, sid))

    def clear_all_data(self):
        tables = [
            "evidence",
            "alibi",
            "statement",
            "suspect",
            "charge",
            "crime_scene",
            "article",
            "person",
            "cases",
            "suspect_cases",
        ]

        with connections["investigations"].cursor() as cursor:
            for table in tables:
                cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')

    def run(self, persons=1500, suspects=500, charges=100):
        self.clear_all_data()
        self.generate_persons(count=persons)
        self.generate_cases()
        self.generate_suspects(count=suspects)
        self.generate_case_suspect()
        self.generate_articles()
        self.generate_charges(count=charges)
        self.generate_alibis()
        self.generate_statements()
        self.generate_crime_scenes()
        self.generate_evidence()
