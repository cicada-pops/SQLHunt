from django.contrib.auth.models import User as AuthUser
from django.db import IntegrityError, transaction
from django.db.models import F
from django.db.models.functions import Greatest
from django.db.models.signals import post_delete, post_save, pre_delete
from django.dispatch import receiver
from users.models import Case, User, UserProgress


@receiver(post_save, sender=Case)
@transaction.atomic(using='users')
def create_userprogress_for_all_users(sender, instance, created, **kwargs):
    if created:
        users = User.objects.using('users').all()
        progresses = [
            UserProgress(user=user, case=instance)
            for user in users
            if not UserProgress.objects.using('users').filter(user=user, case=instance).exists()
        ]
        UserProgress.objects.using('users').bulk_create(progresses, ignore_conflicts=True)


@receiver(post_save, sender=User)
@transaction.atomic(using='users')
def create_userprogress_for_new_user(sender, instance, created, **kwargs):
    if created:
        cases = Case.objects.using('users').all()
        progresses = [
            UserProgress(user=instance, case=case)
            for case in cases
            if not UserProgress.objects.using('users').filter(user=instance, case=case).exists()
        ]
        UserProgress.objects.using('users').bulk_create(progresses, ignore_conflicts=True)


@receiver(post_save, sender=AuthUser)
@transaction.atomic(using='users')
def create_user_on_profile_creation(sender, instance, created, **kwargs):
    if created:
        try:
            if not User.objects.using('users').filter(id=instance.id).exists():
                User.objects.using('users').create(id=instance.id)   
        except IntegrityError as e:
            instance.delete()
            raise IntegrityError(f"Error while creating user data: {str(e)}")


@receiver(post_delete, sender=AuthUser)
@transaction.atomic(using='users')
def delete_user_on_profile_deletion(sender, instance, **kwargs):
    try:
        User.objects.using('users').filter(id=instance.id).delete()
    except IntegrityError as e:
        raise IntegrityError(f"Error while deleting user data: {str(e)}")


@receiver(pre_delete, sender=Case)
@transaction.atomic(using='users')
def deduct_xp_on_case_deletion(sender, instance, **kwargs):
    try:
        user_ids = list(
            UserProgress.objects.using('users')
            .filter(case=instance, status='завершено')
            .values_list('user_id', flat=True)
        )
        if user_ids:
            User.objects.using('users').filter(id__in=user_ids).update(
                xp=Greatest(F('xp') - instance.reward_xp, 0)
            )
    except IntegrityError as e:
        raise IntegrityError(f"Error while deducting XP on case deletion: {str(e)}")
