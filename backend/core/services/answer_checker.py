from django.db import transaction
from users.models import Case, User, UserProgress


def normalize_answer(answer):
  return " ".join(str(answer).strip().lower().split())

@transaction.atomic(using="users")
def check_answer(answer, case_id, user_id):
  user = User.objects.get(pk=user_id)
  case = Case.objects.get(pk=case_id)
  progress, _ = UserProgress.objects.get_or_create(user=user, case=case)

  normalized_answer = normalize_answer(answer)
  is_correct = normalized_answer == normalize_answer(case.answer)

  if is_correct:
    if progress.status != "завершено":
      progress.status = "завершено"
      user.xp += case.reward_xp
      progress.save(using="users")
      user.save(using="users")
      
    return True
  
  if progress.status != "завершено":
    progress.status = 'в процессе'
    progress.save(using="users")

  return False




