from django.db import IntegrityError, transaction
from django.db.models import F
from django.db.models.functions import Greatest
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver

from core.users.models import Case, User, UserProgress


@receiver(post_save, sender=Case)
@transaction.atomic(using="users")
def create_userprogress_for_all_users(sender, instance, created, **kwargs):
    if created:
        users = User.objects.using("users").all()
        progresses = [
            UserProgress(user=user, case=instance)
            for user in users
            if not UserProgress.objects.using("users")
            .filter(user=user, case=instance)
            .exists()
        ]
        UserProgress.objects.using("users").bulk_create(
            progresses, ignore_conflicts=True
        )

@receiver(post_save, sender=User)
@transaction.atomic(using="users")
def create_userprogress_for_new_user(sender, instance, created, **kwargs):
    if created:
        cases = Case.objects.using("users").all()
        progresses = [
            UserProgress(user=instance, case=case)
            for case in cases
            if not UserProgress.objects.using("users")
            .filter(user=instance, case=case)
            .exists()
        ]
        UserProgress.objects.using("users").bulk_create(
            progresses, ignore_conflicts=True
        )

@receiver(pre_delete, sender=Case)
@transaction.atomic(using="users")
def deduct_xp_on_case_deletion(sender, instance, **kwargs):
    try:
        user_ids = list(
            UserProgress.objects.using("users")
            .filter(case=instance, status="завершено")
            .values_list("user_id", flat=True)
        )
        if user_ids:
            User.objects.using("users").filter(id__in=user_ids).update(
                xp=Greatest(F("xp") - instance.reward_xp, 0)
            )
    except IntegrityError as e:
        raise IntegrityError(f"Error while deducting XP on case deletion: {str(e)}")
