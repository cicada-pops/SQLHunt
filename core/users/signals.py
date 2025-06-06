from django.db import IntegrityError, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import Case, User, UserProgress


@receiver(post_save, sender=Case)
def create_userprogress_for_all_users(sender, instance, created, **kwargs):
    if created:
        users = User.objects.using('users').filter(xp__gte=instance.required_xp)
        for user in users:
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
