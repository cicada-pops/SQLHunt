from django.db import IntegrityError, transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from users.models import User

from .models import Profile


@receiver(post_save, sender=Profile)
def create_user_on_profile_creation(sender, instance, created, **kwargs):
    if created:
        try:
            with transaction.atomic(using='users'):
                User.objects.using('users').create(id=instance.id)
                
        except IntegrityError as e:
            instance.delete()
            raise IntegrityError(f"Error while creating user data: {str(e)}")


@receiver(post_delete, sender=Profile)
def delete_user_on_profile_deletion(sender, instance, **kwargs):
    try:
        with transaction.atomic(using='users'):
            User.objects.using('users').filter(id=instance.id).delete()
            
    except IntegrityError as e:
        raise IntegrityError(f"Error while deleting user data: {str(e)}")
