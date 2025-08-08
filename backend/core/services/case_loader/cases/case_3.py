from core.investigations.models import (
    Case,
    Person,
    Suspect,
)
from django.db import connections

from ...generator.utils.utils import (
    get_date_of_birth,
    get_description,
    get_job,
    get_name,
)
from .base_case import BaseCase


class DetectiveArchive(BaseCase):
    title = "Архивные закономерности"
    short_description = (
        "Хроники подозрений: кто чаще других попадал в поле зрения следствия?"
    )
    description = (
        "Вас перевели в архив. Иногда здесь всплывают интересные закономерности.\n"
        "Ваша задача — определить, сколько уголовных дел связано с каждым человеком "
        "в период с 2010 по 2020 год включительно. При этом необходимо учитывать всех людей, "
        "даже если они не фигурировали ни в одном деле.\n"
        "В ответе укажите ID человека, связанного с максимальным количеством уголовных дел за этот период."
    )
    available_tables = ["person", "cases", "suspect", "suspect_cases"]
    reward_xp = 100
    required_xp = 150
    answer = 679

    def create_investigation(self):
        name = get_name()
        job = get_job()

        Person.objects.using("investigations").filter(id=self.answer).delete()
        person = Person.objects.create(
            id=self.answer,
            name=name,
            date_birth=get_date_of_birth(),
            description=get_description(name, job),
        )

        suspect = Suspect.objects.create(person=person, status="на свободе")
        case_ids = [4, 5, 7, 9, 20, 24]
        cases = list(Case.objects.using("investigations").filter(id__in=case_ids))
        suspect.cases.add(*cases)

        def get_answer():
            with connections["investigations"].cursor() as cursor:
                cursor.execute("""
                    SELECT p.id
                    FROM person p
                    LEFT JOIN suspect s ON s.person_id = p.id
                    LEFT JOIN suspect_cases sc ON s.id = sc.suspect_id
                    LEFT JOIN cases c ON sc.case_id = c.id AND c.date_opened BETWEEN '2010-01-01' AND '2020-12-31'
                    GROUP BY p.id
                    ORDER BY COUNT(DISTINCT c.id) DESC
                    LIMIT 1
                """)
                row = cursor.fetchone()
                return row[0] if row else suspect.id  # type: ignore

        self.answer = get_answer()
        return Case.objects.using("investigations").get(id=4)
