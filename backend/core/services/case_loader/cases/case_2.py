from datetime import date

from core.investigations.models import (
    Alibi,
    Article,
    Case,
    Charge,
    CrimeScene,
    Person,
    Statement,
    Suspect,
)
from django.db import transaction

from ...generator.utils.utils import (
    get_date_of_birth,
    get_description,
    get_job,
    get_name,
    get_random_date_between,
)
from .base_case import BaseCase


class FinalMeeting(BaseCase):
    title = "Последняя встреча"
    short_description = "Ссора в кафе, убийство через два дня, свидетель с описанием. Кто был на той встрече?"
    required_xp = 100
    reward_xp = 100
    answer = 451
    available_tables = [
        "cases",
        "person",
        "suspect",
        "alibi",
        "statement",
        "suspect_cases",
        "charge",
        "article",
    ]

    description = """
        3 мая 2023 года банкир Игорь Седов был найден мёртвым в собственной квартире на улице Полярной. Следствие установило, что за два дня до смерти — 1 мая — Седов встречался с неизвестным мужчиной в кафе «Грин Плейс». Очевидец сообщил о вспыхнувшем конфликте и в своих показаниях указал приметы собеседника.
        Найдите человека, который:
          \t• обвинялся по статьям, связанным с мошенничеством,
          \t• до сих пор находится на свободе,
          \t• не имеет алиби,
          \t• а его описание совпадает с показаниями свидетеля.\n
        План расследования и остальные подробности в материалах дела №71. Ответом должен быть ID этого человека.
        """

    def create_investigation(self):
        with transaction.atomic(using="investigations"):
            case = Case.objects.using("investigations").create(
                description=(
                    "Банкир Игорь Седов, ранее несколько раз упоминавшийся в уголовных делах о мошенничестве, был найден мертвым "
                    "в своей квартире на улице Полярной, дом 1, квартира 459. Смерть наступила от удара по голове тупым предметом.\n\n"
                    "В деле есть важное свидетельство: незадолго до смерти Седова видели в кафе “Грин Плейс” "
                    "в сопровождении неизвестного мужчины. Один из свидетелей дал показания. "
                    "В уликах также упоминаются дела, в которых фигурировали схемы финансового мошенничества. Помните, что настоящий преступник может не проходить подозреваемым по этом делу\n\n"
                    """ План расследования:\n
                     1. Изучите показания свидетеля, обратите внимание на профессию подозреваемого.\n
                     2. Найдите подозреваемых, обвинявшихся по статьям о мошенничестве, находящихся на свободе и не имеющих алиби по этому делу (или имеющих не подтвержденное).\n
                     3. Среди них выделите тех, чья профессия в описании person подходит под показания\n
                     4. Итоговый подозреваемый — тот, кто подходит под все эти критерии.
                """
                ),
                date_opened=date(2023, 5, 3),
                type="убийство",
                status="открыто",
                resolution="не раскрыто",
            )

            CrimeScene.objects.using("investigations").create(
                case=case,
                location="г. Тверь, ул Полярная, д. 1 к. 459, 080534",
                date=date(2023, 5, 3),
            )
            random_person = Person.objects.order_by("?").first()
            Statement.objects.create(
                case=case,
                person=random_person,
                statement=(
                    "1 мая я зашел в кафе «Грин Плейс» около двух часов дня купить кофе. "
                    "Я сидел за соседним столиком и невольно стал свидетелем спора между двумя мужчинами. "
                    "Они вели себя довольно громко — один явно обвинял другого в нечестности, упоминая какие-то документы. "
                    "Что особенно запомнилось — у одного из мужчин был кожаный портфель, и на нём было выгравировано "
                    "название адвокатской фирмы, если не ошибаюсь. "
                    "Я не слышал всего разговора, но они выглядели очень напряжённо. "
                    "После спора один из мужчин быстро ушёл, другой остался и позвонил кому-то по телефону."
                ),
                date_of_statement=date(2023, 5, 5),
            )

            Person.objects.using("investigations").filter(id=self.answer).delete()
            criminal = Person.objects.using("investigations").create(
                id=self.answer,
                name="Олег Сергеевич Волков",
                date_birth=date(1983, 3, 14),
                description="Сутулый мужчина 171 см. Прическа: каскад, русые волосы. Одет в: темно-бордовый костюм тройка с галстуком, синие джинсы-бойфренды, коричневые лоферы с кисточками, кожаный портфель. Особые приметы: отсутствуют. Профессия: Адвокат.",
            )
            suspect = Suspect.objects.using("investigations").create(
                person=criminal, status="на свободе"
            )
            suspect.cases.add(case)

            Alibi.objects.using("investigations").create(
                status="не подтверждено",
                description="Говорит, что 03.05 был весь день дома один, разбирал дела.",
                case=case,
                suspect=suspect,
            )

            suspect_specs = [
                (True, 159),
                (False, None),
                (True, 169),
            ]

            for is_charged, article in suspect_specs:
                name = get_name()
                job = get_job()
                if job == "Адвокат":
                    job = "Юрист"

                person = Person.objects.create(
                    name=name,
                    date_birth=get_date_of_birth(),
                    description=get_description(name, job),
                )

                suspect = Suspect.objects.create(
                    person=person,
                    status="на свободе",
                )
                suspect.cases.add(case)
                if is_charged and article:
                    article = Article.objects.get(id=article)
                    Charge.objects.create(
                        article=article,
                        suspect=suspect,
                        date_accusation=get_random_date_between(
                            date(2015, 12, 31), date(2020, 12, 31)
                        ),
                        status="прекращено",
                    )

            name4 = get_name()
            job4 = "Адвокат"

            person4 = Person.objects.create(
                name=name4,
                date_birth=get_date_of_birth(),
                description=get_description(name4, job4),
            )

            suspect4 = Suspect.objects.create(
                person=person4,
                status="на свободе",
            )
            suspect4.cases.add(case)

            Alibi.objects.create(
                suspect=suspect4,
                description="Был в суде, имеются записи с камер",
                status="подтверждено",
                case=case,
            )

            return case
