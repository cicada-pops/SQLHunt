from django.db import transaction
from users.models import Case, User, UserProgress


def normalize_answer(answer):
    return " ".join(answer.strip().lower().split())

@transaction.atomic(using="users")
def check_answer(answer, case_id, user_id):
    user = User.objects.get(pk=user_id)
    case = Case.objects.get(pk=case_id)
    progress, _ = UserProgress.objects.get_or_create(user=user, case=case)

    if normalize_answer(answer) == normalize_answer(case.answer):
         if progress.status != "завершено":
            progress.status = "завершено"
            progress.save(using="users")

            user.xp += case.reward_xp
            user.save(using="users")
         return True
    return False




