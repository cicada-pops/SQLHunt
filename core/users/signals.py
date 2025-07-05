import logging

from django.contrib.auth.models import User as AuthUser
from django.db import IntegrityError, transaction
from django.db.models.signals import post_delete, post_save, pre_delete, pre_save
from django.dispatch import receiver
from users.models import Case, User, UserProgress

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Case)
@transaction.atomic
def create_userprogress_for_all_users(sender, instance, created, **kwargs):
    if created:
        for user in User.objects.using('users').all():
            try:
                with transaction.atomic(using='users'):
                    UserProgress.objects.using('users').get_or_create(
                        user=user,
                        case=instance
                    )
            except IntegrityError as e:
                raise IntegrityError(f"Error while creating userprogres data: {str(e)}")


@receiver(post_save, sender=User)
@transaction.atomic
def create_userprogress_for_new_user(sender, instance, created, **kwargs):
    if created:
        for case in Case.objects.using('users').all():
            try:
                with transaction.atomic(using='users'):
                    UserProgress.objects.using('users').get_or_create(
                        user=instance,
                        case=case
                    )
            except IntegrityError as e:
                raise IntegrityError(f"Error while creating userprogres data: {str(e)}")


@receiver(post_save, sender=AuthUser)
@transaction.atomic
def create_user_on_profile_creation(sender, instance, created, **kwargs):
    if created:
        try:
            with transaction.atomic(using='users'):
                 User.objects.using('users').get_or_create(id=instance.id)
                
        except IntegrityError as e:
            instance.delete()
            raise IntegrityError(f"Error while creating user data: {str(e)}")


@receiver(post_delete, sender=AuthUser)
@transaction.atomic
def delete_user_on_profile_deletion(sender, instance, **kwargs):
    try:
        with transaction.atomic(using='users'):
            User.objects.using('users').filter(id=instance.id).delete()
            
    except IntegrityError as e:
        raise IntegrityError(f"Error while deleting user data: {str(e)}")


@receiver(pre_save, sender=UserProgress)
@transaction.atomic
def grant_xp_on_status_completed(sender, instance, **kwargs):
    if instance.pk:  
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.status != 'завершено' and instance.status == 'завершено':
                user = instance.user
                user.xp += instance.case.reward_xp
                user.save(update_fields=['xp'])
        except Exception as e:
            logger.error(f"Error granting XP on UserProgress save (UserProgress id={instance.pk}): {e}", exc_info=True)


@receiver(pre_delete, sender=Case)
@transaction.atomic
def deduct_xp_on_case_deletion(sender, instance, **kwargs):
    try:
        completed_progresses = UserProgress.objects.using('users').filter(case=instance, status='завершено')

        with transaction.atomic(using='users'):
            for progress in completed_progresses.select_related('user'):
                user = progress.user
                user.xp = max(user.xp - instance.reward_xp, 0)  
                user.save(update_fields=['xp'])
    except Exception as e:
        logger.error(f"Error deducting XP on Case deletion (Case id={instance.id}): {e}", exc_info=True)
