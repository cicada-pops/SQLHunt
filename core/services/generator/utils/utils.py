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
    weights = [0.15, 0.20, 0.20, 0.20, 0.15, 0.10]
    choices = [0, 1, 2, 3, 4, 5]
    return random.choices(choices, weights=weights, k=1)[0]

def get_articles(case_type):
   return CRIME_TYPE_TO_ARTICLES.get(case_type, [])
