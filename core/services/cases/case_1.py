from datetime import date
from random import sample

from django.db import transaction
from investigations.models import Alibi, CrimeScene, Evidence, Person, Suspect
from investigations.models import Case as InvestigationCase

from ..generator.utils.utils import get_date_of_birth, get_description
from .base_case import BaseCase


class SilverKey(BaseCase):
    title = "Серебряный Ключ"
    description = (
        """
        1998 год. На окраине города в мотеле «Серебряный Ключ» планировалась тайная встреча между контрабандистами. 
        Но что-то пошло не так. Один из ключевых участников исчез, а в номере найдены следы борьбы, капли крови и брошенный диктофон с записанным обрывком фразы: ”…если он узнает про сделку в Роттердаме — всё пойдет прахом…” 
        В показаниях фигурирует таинственный свидетель, который утверждает, что видел одного из фигурантов поздно ночью на заправке, и может описать его.
        Найдите имя предателя, который:
          • упоминается в описании к улике как знающий про сделку в Роттердаме,
          • подходит под описание свидетеля
        Все подробности в материалах дела. Учтите, что настоящий преступник может не входить в число подозреваемых
        """
    )
    required_xp = 0
    reward_xp = 100
    available_tables = [
        "case",
        "person",
        "suspect",
        "crime_scene",
        "evidence",
        "alibi",
    ]

    def create_investigation(self):
        with transaction.atomic(using='investigations'):
          investigation_case = InvestigationCase.objects.using('investigations').create(
              description = (
                  "Во время дождливой ночи в одном из номеров мотеля «Серебряный Ключ» предварительно произошло похищение. "
                  "Следователи зафиксировали следы борьбы: перевёрнутый стол, след обуви в крови, частично вырванный лист из блокнота. "
                  "Был найден диктофон марки «Союз» с неполной записью. "
                  "На заправке в двух километрах от места происшествия работник ночной смены заявил, что видел мужчину, спешно садившегося в автомобиль без номеров около 2:30 ночи. "
                  "По его словам, у человека были рыжие волосы, он был одет в черную одежду и у него точно была «морская» татуировка.\n\n"

                  "План расследования:\n"
                  "1. Просмотрите всех подозреваемых дела и проверьте их описание по свидетельским показаниям.\n"
                  "2. Если среди подозреваемых нет подходящего, найдите улики по месту преступления.\n"
                  "3. Проверьте всех лиц с фамилиями, упомянутыми в диктофоне. Обратите внимание на привычки и особые приметы\n"
                  "4. Итоговый подозреваемый — тот, кто подходит под описание свидетеля.\n"
                  "Ответом должно быть ID этого человека."
              ),
              date_opened=date(1998, 6, 1),
              type="незаконная торговля",
              status="открыто"
          )

          crime_scene = CrimeScene.objects.using('investigations').create(
              location="г. Нижневартовск, наб. Локомотивная, д. 81 стр. 712, 524925",
              date=date(1998, 6, 1),
              case=investigation_case
          )

          Evidence.objects.using('investigations').create(
              type="аудиозапись",
              description="Диктофон с записью обсуждения сделки в Роттердаме. В ходе разговора всплыли фамилии: Крылов и Толстой. Слышны частые вздохи",
              date=date(1998, 6, 1),
              scene=crime_scene
          )

          persons = [
              ("Илья Артемович Крылов", "Повар"),
              ("Анатолий Игоревич Крылов", "Водитель автобуса"),
              ("Владислав Тимофеевич Крылов", "Механик"),
          ]

          for full_name, profession in persons:
              person = Person.objects.using('investigations').create(
                  name=full_name,
                  date_birth=get_date_of_birth(),
                  description=get_description(full_name, profession)
              )

          person = Person.objects.using('investigations').create(
              name="Дмитрий Романович Крылов",
              date_birth=date(1970, 5, 15),
              description="Худощявый мужчина 199 см. Прическа: каскад, рыжие волосы. Одет в: черная куртка, синие джинсы, коричневые лоферы с кисточками, перстень с печаткой. Особые приметы: татуировка в виде якоря на запястье, неестественно бледная кожа. Профессия: Электрик; Привычки: часто вздыхает."
          )
          self.answer = person.id # type: ignore

          person = Person.objects.using('investigations').create(
              name="Федор Алексеевич Толстой",
              date_birth=date(1968, 4, 21),
              description="Жилистый мужчина 190 см. Прическа: лысый. Одет в: сине-белая тельняшка, темно-серые брюки, серые туфли. Особые приметы: глаз с вертикальным зрачком. Профессия: Сварщик."
          )
          suspect = Suspect.objects.using('investigations').create(person=person, status="на свободе")
          suspect.cases.add(investigation_case)

          Alibi.objects.using('investigations').create(
              status="не подтверждено",
              description="Утверждает, что был на заправке, но камер не было.",
              case=investigation_case,
              suspect=suspect
          )

          suspect_ids = Suspect.objects.using('investigations').values_list("person_id", flat=True)
          persons = Person.objects.using('investigations').exclude(id__in=suspect_ids)

          alibi_variants = [
              ("подтверждено", "Находился в баре «Гнездо» — подтверждено официантом и камерой наблюдения."),
              ("не подтверждено", "Говорит, что был дома, но не может подтвердить — ни соседей, ни звонков."),
              ("ложное", "Утверждает, что был в поезде, но по базе билетов его там не было."),
          ]

          for person, (status, description) in zip(sample(list(persons), 3), alibi_variants):
              suspect = Suspect.objects.using('investigations').create(person=person, status="на свободе")
              suspect.cases.add(investigation_case)
              Alibi.objects.using('investigations').create(
                  status=status,
                  description=description,
                  case=investigation_case,
                  suspect=suspect
              )
          return investigation_case
