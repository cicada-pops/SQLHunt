import random
from datetime import timedelta

from faker import Faker

from services.generator.data.tables import (
    ACCESSORIES,
    BUILD,
    CHARGE_STATUSES,
    CLOTHES,
    COLORS,
    CONFIRMED_ALIBI,
    CRIME_TYPE_TO_ARTICLES,
    DETAILS,
    EVIDENCE_CATALOG,
    FALSE_ALIBI,
    HAIR_COLORS,
    HAIR_STYLES,
    PRONOUNS,
    SUSPECT_STATUSES,
    TRAITS,
    UNCONFIRMED_ALIBI,
)

fake = Faker("ru_RU")

def get_name():
    return fake.name()

def get_job():
    return fake.job()

def get_date_of_birth():
    return fake.date_of_birth(minimum_age=18, maximum_age=90)

def get_date_between(earliest_date, latest_date):
    return fake.date_between(start_date=earliest_date, end_date=latest_date)

def get_gender(full_name):
    parts = full_name.lower().split()
    for part in parts:
        if part.endswith(('вна', 'ова')):
            return "жен"
        if part.endswith(("ович", "евич", "ич", "ов", "ев")):
            return "муж"
    return "жен"

def get_color(gender, clothing_item):
    base_item = clothing_item.split()[-1]

    if base_item in COLORS[gender]:
        return random.choice(COLORS[gender][base_item])

    for key in COLORS[gender]:
        if key in clothing_item or clothing_item in key:
            return random.choice(COLORS[gender][key])
        
def get_build(gender):
    return random.choice(BUILD[gender])

def get_hair_style(gender):
    return random.choice(HAIR_STYLES[gender])

def get_hair_color():
    return random.choice(HAIR_COLORS)

def get_height(gender):
    return random.randint(170, 200) if gender == 'муж' else random.randint(150, 185)

def generate_appearance(gender):
  top = random.choice(CLOTHES['верх'][gender])
  top_color = get_color(gender, top) or ""
  
  bottom = random.choice(CLOTHES['низ'][gender])
  bottom_color = get_color(gender, bottom) or ""

  shoes = random.choice(CLOTHES['обувь'][gender])
  shoes_color = get_color(gender, shoes) or ""

  accessory = random.choice(ACCESSORIES[gender])
  traits = random.sample(TRAITS, k=random.randint(1, 3))

  details = []
  if random.random() > 0.85:  
    details.append(random.choice(DETAILS))

  return {
      "top": f"{top_color} {top}",
      "bottom": f"{bottom_color} {bottom}",
      "shoes": f"{shoes_color} {shoes}",
      "accessory": accessory,
      "traits": traits,
      "details": details
  }

def get_location():
    return fake.address().replace('\n', ', ')

def get_description(name, job):
    gender = get_gender(name)
    height = get_height(gender)
    build = get_build(gender)
    hair_style = get_hair_style(gender)
    hair_color = get_hair_color()
    appearance = generate_appearance(gender)

    description = (
        f"{build.capitalize()} {'мужчина' if gender == 'муж' else 'женщина'} {height} см. "
        + (f"Прическа: {hair_style}, {hair_color} волосы. " if hair_style != 'лысый' else f"Прическа: {hair_style}. ")
        + f"Одет{'а' if gender == 'жен' else ''} в: {appearance['top']}, {appearance['bottom']}, {appearance['shoes']}, {appearance['accessory']}. "
        + f"Особые приметы: {', '.join(appearance['traits'])}. "
        + f"Профессия: {job}{'; Привычки: ' + '; '.join(appearance['details']) if appearance['details'] else ''}."
    )

    return description

def get_suspect_status():
  return random.choice(SUSPECT_STATUSES)


def get_charge_status():
  return random.choice(CHARGE_STATUSES)

def get_random_date_between(start_date, end_date):
    delta = (end_date - start_date).days
    return start_date + timedelta(days=random.randint(0, delta if delta > 0 else 0))

def get_available_evidence_types(crime_type):
    return [etype for etype in EVIDENCE_CATALOG if crime_type in EVIDENCE_CATALOG[etype]]

def get_random_evidence_description(evidence_type, crime_type):
    options = EVIDENCE_CATALOG.get(evidence_type, {}).get(crime_type, [])
    return random.choice(options) if options else None

def get_false_alibi():
  return random.choice(FALSE_ALIBI)

def get_confirmed_alibi():
  return random.choice(CONFIRMED_ALIBI)

def get_unconfirmed_alibi():
  return random.choice(UNCONFIRMED_ALIBI)

def get_sample_suspects(n, available_ids):
  return random.sample(available_ids, min(n, len(available_ids)))

def get_suspect_count():
    roll = random.random()
    if roll < 0.20:
        return 0
    elif roll < 0.45:
        return 1
    elif roll < 0.75:
        return 2
    elif roll < 0.95:
        return random.randint(3, 4)
    else:
        return 5

def get_articles(case_type):
   return CRIME_TYPE_TO_ARTICLES.get(case_type, [])

def get_testimony(suspect_gender, witness_gender):
   return {
        "Находился в другом городе, подтверждено билетами": [
            f"Я {PRONOUNS[witness_gender]['saw']} у {PRONOUNS[suspect_gender]['him']} билеты, которые доказали, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в другом городе.",
            f"Как {PRONOUNS[witness_gender]['colleague']} могу подтвердить — {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в другом городе, это видно по билетам."
        ],
        "Был на работе, коллеги подтверждают": [
            f"Да, я {PRONOUNS[witness_gender]['saw']} {PRONOUNS[suspect_gender]['him']} в офисе. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на работе весь день.",
            f"Мы работали вместе — {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в офисе всё время, коллеги меня поддержат."
        ],
        "Находился в больнице, есть запись в журнале": [
            f"Я дежурил(а) в тот день. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} в больнице, это подтверждается записью.",
            f"В журнале больницы видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} там весь день. Я лично {PRONOUNS[witness_gender]['saw']} запись."
        ],
        "Был в командировке, подтверждено документами компании": [
            f"Я оформлял(а) командировку для {PRONOUNS[suspect_gender]['himself']}. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} в командировке согласно документам.",
            f"Компания выдала документы, из которых видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в другом городе, я их подписывал(а)."
        ],
        "Находился на свадьбе родственника, есть фото и видео": [
            f"Я был(а) на той свадьбе. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} там весь вечер — в фото и видео он(а) запечатлен(а).",
            f"На фотографии видно {PRONOUNS[suspect_gender]['him']}, он(а) действительно {PRONOUNS[suspect_gender]['was']} на свадьбе родственника."
        ],
        "Посещал конференцию, подтверждено регистрацией": [
            f"Я был(а) организатором конференции. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} зарегистрирован(а) и присутствовал(а) на всех сессиях.",
            f"Список участников конференции подтверждает — {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на месте, я видел(а) его(её) бейдж."
        ],
        "Был в отпуске за границей, подтверждено штампами в паспорте": [
            f"Я проверял(а) паспорта. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} за границей, штампы в паспорте налицо.",
            f"При пересечении границы я видел(а) {PRONOUNS[suspect_gender]['him']}: штампы подтверждают, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в отпуске."
        ],
        "Находился на спортивном мероприятии, есть билеты и записи с камер": [
            f"У меня есть видеозаписи и билеты, я видел(а) {PRONOUNS[suspect_gender]['him']} на этом матче. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на трибуне.",
            f"Билеты и камеры фиксируют {PRONOUNS[suspect_gender]['him']}. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на спортивном мероприятии."
        ],
        "Был на учебе, подтверждено расписанием и преподавателем": [
            f"Я преподаватель, в расписании видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на занятии. Я лично {PRONOUNS[witness_gender]['saw']} {PRONOUNS[suspect_gender]['him']}.",
            f"В ведомости и расписании зафиксировано, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на учебе. Я ставил(а) ему(ей) посещение."
        ],
        "Посещал курсы повышения квалификации, есть сертификат": [
            f"Я инструктор курсов. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на занятиях, сертификат у него(неё) есть.",
            f"В списке слушателей и сертификате видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на курсах повышения квалификации."
        ],
        "Находился в ремонтируемой квартире, подтверждено договором с бригадой": [
            f"Я являюсь представителем бригады. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} в квартире во время ремонта, договор у меня.",
            f"По договору видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в ремонтируемой квартире. Я лично {PRONOUNS[witness_gender]['saw']} документы."
        ],
        "Был в гостях у родителей, соседи подтверждают": [
            f"Соседи мне сказали, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} у родителей весь день.",
            f"Я сам(а) звонил(а) родителям — они подтвердили, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} у них в гостях."
        ],
        "Находился на даче, есть записи с камер наблюдения": [
            f"У меня есть видео с дачи — {PRONOUNS[suspect_gender]['him']} видно целый день. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на даче.",
            f"На записи с камер видно, как {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на участке. Я проверял(а) запись."
        ],
        "Был в автосервисе, подтверждено чеком и показаниями механика": [
            f"Я механик. Видел(а) {PRONOUNS[suspect_gender]['him']} — он(а) {PRONOUNS[suspect_gender]['was']} в сервисе, чек на руках.",
            f"Чек на оплату ремонта указывает, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в автосервисе. Я лично обслуживал(а) {PRONOUNS[suspect_gender]['him']}."
        ],
        "Посещал врача, подтверждено записью в медицинской карте": [
            f"Я медицинская сестра, в карте написано, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} у врача. Я лично {PRONOUNS[witness_gender]['saw']} запись.",
            f"Медкарта подтверждает, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} у доктора. Я сама(сам) ставил(а) запись."
        ],
        "Находился в банке, подтверждено выпиской по счету": [
            f"Я банковский служащий. По выписке видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в отделении.",
            f"В системе банка зафиксировано, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} там. Я проверял(а) его(её) счет."
        ],
        "Был на концерте, есть билеты и фото с мероприятия": [
            f"Я фотограф. Есть снимки, где {PRONOUNS[suspect_gender]['him']} видно среди зрителей. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на концерте.",
            f"Билеты и фотографии подтверждают, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на концерте. Я лично {PRONOUNS[witness_gender]['saw']} его(её)."
        ],
        "Находился в спортзале, подтверждено системой электронного пропуска": [
            f"Я администратор спортзала. Система фиксирует, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в тренажерном зале.",
            f"По электронному пропуску видно, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в спортзале. Я сам(а) проверял(а) вход."
        ],
        "Был в кино, подтверждено покупкой билетов онлайн": [
            f"Я работник кинотеатра. Билеты онлайн показывают, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на сеансе.",
            f"Система кинотеатра подтверждает — {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} в зале. Я видел(а) подтверждение покупки."
        ],
        "Находился на экскурсии, гид и группа подтверждают": [
            f"Я экскурсовод, вся группа видела {PRONOUNS[suspect_gender]['him']}. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на экскурсии.",
            f"Гид и другие участники поездки могут подтвердить: {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} на экскурсии весь день."
        ],
        "Утверждает, что был дома один, но доказательств нет": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} дома один, но никто этого не видел.",
            f"Нет свидетелей. {PRONOUNS[suspect_gender]['he'].capitalize()} мог(ла) находиться дома, но подтверждений нет."
        ],
        "Говорит, что был в кинотеатре, но билеты потерял": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в кино, но билетов у него(неё) нет.",
            f"Без билетов невозможно проверить. {PRONOUNS[suspect_gender]['he'].capitalize()} мог(ла) придумать эту историю."
        ],
        "Заявляет, что находился у друзей, но те не подтверждают": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} у друзей, но они это отрицают.",
            f"Друзья говорят, что {PRONOUNS[suspect_gender]['he']} не был(а) у них. Нет подтверждений."
        ],
        "Утверждает, что гулял в парке, но свидетелей нет": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в парке, но никто не видел.",
            f"Нет доказательств. {PRONOUNS[suspect_gender]['he'].capitalize()} мог(ла) гулять, но никто этого не подтвердил."
        ],
        "Говорит, что был в кафе, но камеры не зафиксировали": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в кафе, но камеры ничего не зафиксировали.",
            f"Без видеозаписи сложно поверить. {PRONOUNS[suspect_gender]['he'].capitalize()} мог(ла) говорить правду, но доказательств нет."
        ],
        "Заявляет, что ездил за город, но GPS-данные отсутствуют": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} за городом, но GPS-данные пусты.",
            f"Без GPS-подтверждения сомнительно. {PRONOUNS[suspect_gender]['he'].capitalize()} мог(ла) быть там, но доказательств нет."
        ],
        "Утверждает, что спал весь день, но соседи не видели": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} дома, но соседи это не подтверждают.",
            f"Соседи не замечали {PRONOUNS[suspect_gender]['him']}, когда он(а) якобы спал(а). Доказательств нет."
        ],
        "Говорит, что был в библиотеке, но записи посещений нет": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в библиотеке, но записи отсутствуют.",
            "Без записи о входе и выходе это трудно проверить. Нет доказательств."
        ],
        "Заявляет, что помогал знакомым с переездом, но те отрицают": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} у знакомых, но они отрицают.",
            f"Знакомые говорят, что {PRONOUNS[suspect_gender]['he']} не был(а) у них. Доказательств нет."
        ],
        "Утверждает, что ремонтировал машину, но в сервисе его не было": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в автосервисе, но сервис этого не подтверждает.",
            f"Механики не видели {PRONOUNS[suspect_gender]['him']}. Нет чеков и записей."
        ],
        "Говорит, что ходил в магазин, но камеры его не зафиксировали": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в магазине, но камеры не увидели {PRONOUNS[suspect_gender]['him']}.",
            "Без записи с камер нельзя проверить. Доказательств нет."
        ],
        "Заявляет, что был на рыбалке, но снасти остались дома": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} на рыбалке, но снасти у него(неё) остались дома.",
            f"Без снастей трудно поверить. {PRONOUNS[suspect_gender]['he']} мог(ла) сказать это, но доказательств нет."
        ],
        "Утверждает, что посещал тренажерный зал, но система не зарегистрировала вход": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в спортзале, но пропуск не зафиксирован.",
            f"Система не видела {PRONOUNS[suspect_gender]['him']}. Нет подтверждений от тренеров или камер."
        ],
        "Говорит, что был у врача, но в клинике его не видели": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} у врача, но в регистратуре нет записи.",
            f"Клиника не зафиксировала {PRONOUNS[suspect_gender]['him']}. Нет медкарты."
        ],
        "Заявляет, что ездил на такси, но водитель не подтверждает": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} на такси, но водитель не видел {PRONOUNS[suspect_gender]['him']}.",
            "Водитель не подтвердил. Нет данных о поездке."
        ],
        "Утверждает, что был на футбольном матче, но билетов нет": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} на матче, но у него(неё) нет билетов.",
            f"Без билетов нельзя проверить. Камеры стадиона не видели {PRONOUNS[suspect_gender]['him']}."
        ],
        "Говорит, что ходил в баню, но администрация его не помнит": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в бане, но сотрудники не видели {PRONOUNS[suspect_gender]['him']}.",
            f"Администрация бани не помнит {PRONOUNS[suspect_gender]['him']}. Нет доказательств."
        ],
        "Заявляет, что был в другом районе, но свидетелей нет": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} в другом районе, но никто этого не видел.",
            f"Без свидетелей сомнительно. {PRONOUNS[suspect_gender]['he']} мог(ла) быть там, но доказательств нет."
        ],
        "Утверждает, что встречался с деловым партнером, но тот отрицает": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что {PRONOUNS[suspect_gender]['was']} у партнера, но тот отрицает.",
            f"Партнер говорит, что {PRONOUNS[suspect_gender]['he']} не был(а) у него. Доказательств нет."
        ],
        "Говорит, что потерял телефон и не может подтвердить местонахождение": [
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['claims']}, что потерял(а) телефон и не может подтвердить, где {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']}.",
            f"Без телефона сложно проверить. Не могу подтвердить алиби {PRONOUNS[suspect_gender]['him']}."
        ],
        "Предоставил поддельные документы о пребывании за границей": [
            f"Я эксперт в документах и вижу, что печати поддельные. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не за границей.",
            f"Документы сфабрикованы. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался обмануть следствие, это явно видно."
        ],
        "Сфабриковал доказательства с помощью сообщника": [
            f"Я видел(а), как {PRONOUNS[suspect_gender]['he']} договаривался(ась) с кем-то о ложных показаниях.",
            f"Это сговор! {PRONOUNS[suspect_gender]['he'].capitalize()} попросил(а) друга создать фальшивые доказательства."
        ],
        "Давал заведомо ложные показания": [
            f"Я знаю правду и могу сказать, что {PRONOUNS[suspect_gender]['he']} лжёт.",
            f"{PRONOUNS[suspect_gender]['he'].capitalize()} несколько раз менял(а) показания — это явная ложь."
        ],
        "Использовал фальшивые авиабилеты для алиби": [
            f"Я специалист по билету. Те билеты поддельные. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не на самолёте.",
            f"Билеты не настоящие — {PRONOUNS[suspect_gender]['he'].capitalize()} пытался ввести следствие в заблуждение."
        ],
        "Подделал записи в рабочем журнале": [
            f"Я видел(а) оригинальные записи. Эти правки сделаны позже. {PRONOUNS[suspect_gender]['he'].capitalize()} лжёт о своём местонахождении.",
            f"Записи изменены. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался скрыть, где {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']}."
        ],
        "Договорился с лжесвидетелями для подтверждения алиби": [
            f"Я хочу заявить, что {PRONOUNS[suspect_gender]['he']} искал(а) свидетелей, которые бы солгали.",
            f"Это подстроено! {PRONOUNS[suspect_gender]['he'].capitalize()} заплатил(а) людям за ложные показания."
        ],
        "Изменил данные GPS на телефоне, чтобы скрыть местоположение": [
            f"Я эксперт по GPS-данным. Треки поддельные. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался скрыть, где {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']}.",
            f"GPS-лог исправлен. {PRONOUNS[suspect_gender]['he'].capitalize()} сфальсифицировал(а) информацию о своём перемещении."
        ],
        "Использовал чужой паспорт для подтверждения поездки": [
            f"Паспорт не его(её). Я это проверял(а). {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не тем, за кого себя выдавал(а).",
            f"Биометрия не совпадает. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался обмануть, используя чужой паспорт."
        ],
        "Создал фальшивые чеки, чтобы подтвердить покупки": [
            f"Чеки оказались поддельными. Я эксперт по финансовым документам. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не совершал(а) этих покупок.",
            f"Документы подделаны. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался скрыть своё истинное местонахождение."
        ],
        "Подделал подпись врача в медицинской справке": [
            f"Я специалист по почерку. Эта подпись не его(её). {PRONOUNS[suspect_gender]['he'].capitalize()} пытался обмануть врачей.",
            f"Подпись подделана. {PRONOUNS[suspect_gender]['he'].capitalize()} представил(а) фальшивую медсправку."
        ],
        "Использовал фотошоп для создания поддельных фотографий": [
            f"Я эксперт по изображениям. Эти фото отретушированы. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не там.",
            f"На фотографиях видны следы монтажа. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался скрыть своё местонахождение."
        ],
        "Внес ложные данные в систему электронных пропусков": [
            f"Я администратор системы. Записи изменены. {PRONOUNS[suspect_gender]['he'].capitalize()} не получал(а) доступ в то время.",
            f"Все показания логов фальсифицированы. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался использовать систему обманным путём."
        ],
        "Подкупил сотрудника, чтобы тот дал ложные показания": [
            f"Я сотрудник охраны и отрицаю, что давал(а) показания. {PRONOUNS[suspect_gender]['he'].capitalize()} подкупил(а) меня.",
            f"Это сговор! {PRONOUNS[suspect_gender]['he'].capitalize()} платил(а) сотруднику за ложь."
        ],
        "Использовал поддельные камеры наблюдения для записи": [
            f"Я инженер по видеокамерам. Эту запись никто не вел. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не там.",
            f"Я инженер по видеокамерам. Все записи камеры поддельные. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался скрыть своё перемещение."
        ],
        "Сфабриковал переписку в мессенджерах": [
            f"Я эксперт по цифровому анализу. Переписка поддельная. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не в это время.",
            f"Я эксперт по цифровому анализу. Чаты изменены. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался сфабриковать доказательства."
        ],
        "Подделал гостиничные документы о проживании": [
            f"Я администратор отеля. Бумаги подделаны. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не проживал(а) здесь.",
            f"Регистрация ложная. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался обмануть отель."
        ],
        "Взломал систему учета рабочего времени": [
            f"Я ИТ-специалист. Логи изменены. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} на рабочем месте в другое время.",
            f"Система показала, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} не там, где он(а) утверждает."
        ],
        "Использовал поддельные банковские выписки": [
            f"Я бухгалтер. Выписки фальшивые. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не совершал(а) операции.",
            f"Я бухгалтер. Все транзакции оказались поддельными. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался ввести в заблуждение."
        ],
        "Создал фальшивые свидетельские показания": [
            f"Я свидетель и отрицаю, что давал(а) показания. {PRONOUNS[suspect_gender]['he'].capitalize()} заплатил(а) мне за ложь.",
            f"Эти свидетельства ложные. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался сфабриковать дело."
        ],
        "Подделал записи в полицейском протоколе": [
            f"Я полицейский. Протокол изменён: печати не настоящие. {PRONOUNS[suspect_gender]['he'].capitalize()} {PRONOUNS[suspect_gender]['was']} не там.",
            f"Читаю оригинал — там другие данные. {PRONOUNS[suspect_gender]['he'].capitalize()} пытался изменить протокол."
        ]
    }

def get_default_testimony(suspect_gender):
  return {
        'подтверждено': [
            f"Я подтверждаю, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} там, где указано.",
            f"Могу засвидетельствовать правдивость этих сведений о {PRONOUNS[suspect_gender]['hima']}."
        ],
        'не подтверждено': [
            f"Нет доказательств, что {PRONOUNS[suspect_gender]['he']} {PRONOUNS[suspect_gender]['was']} там.",
            f"Я сомневаюсь в правдивости этих слов {PRONOUNS[suspect_gender]['him']}."
        ],
        'ложное': [
            f"Это явная ложь! {PRONOUNS[suspect_gender]['he'].capitalize()} пытается ввести всех в заблуждение.",
            f"Я обнаружил(а), что доказательства сфабрикованы. {PRONOUNS[suspect_gender]['he'].capitalize()} лжет."
        ]
    }

def get_random_testimony(alibi_description, witness_name, suspect_name):
          witness_gender = get_gender(witness_name)
          suspect_gender = get_gender(suspect_name)
          testimony_map = get_testimony(suspect_gender=suspect_gender, witness_gender=witness_gender)
          default_testimonies = get_default_testimony(suspect_gender=suspect_gender)
          
          if alibi_description in testimony_map:
            return random.choice(testimony_map[alibi_description])
          elif alibi_description in CONFIRMED_ALIBI:
              return random.choice(default_testimonies['подтверждено'])
          elif alibi_description in UNCONFIRMED_ALIBI:
              return random.choice(default_testimonies['не подтверждено'])
          elif alibi_description in FALSE_ALIBI:
              return random.choice(default_testimonies['ложное'])
          else:
              return f"Я не могу подтвердить алиби у {PRONOUNS[suspect_gender]['him']}."
