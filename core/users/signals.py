from django.contrib.auth.models import User as AuthUser
from django.db import IntegrityError, transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from users.models import Case, User, UserProgress


@receiver(post_save, sender=Case)
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
def create_userprogress_for_new_user(sender, instance, created, **kwargs):
    if created:
        available_cases = Case.objects.using('users').filter(required_xp__lte=instance.xp)
        for case in available_cases:
            try:
                with transaction.atomic(using='users'):
                    UserProgress.objects.using('users').get_or_create(
                        user=instance,
                        case=case
                    )
            except IntegrityError as e:
                raise IntegrityError(f"Error while creating userprogres data: {str(e)}")

@receiver(post_save, sender=AuthUser)
def create_user_on_profile_creation(sender, instance, created, **kwargs):
    if created:
        try:
            with transaction.atomic(using='users'):
                 User.objects.using('users').get_or_create(id=instance.id)
                
        except IntegrityError as e:
            instance.delete()
            raise IntegrityError(f"Error while creating user data: {str(e)}")


@receiver(post_delete, sender=AuthUser)
def delete_user_on_profile_deletion(sender, instance, **kwargs):
    try:
        with transaction.atomic(using='users'):
            User.objects.using('users').filter(id=instance.id).delete()
            
    except IntegrityError as e:
        raise IntegrityError(f"Error while deleting user data: {str(e)}")
