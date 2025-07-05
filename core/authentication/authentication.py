from django.contrib.auth.models import User
from django.db.models import Q
from users.models import User as UsersUser


class EmailAuthBackend:
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(Q(email__iexact=username))
            if user.check_password(password): # type: ignore
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
    
def create_users_user(backend, user, *args, **kwargs):
    if user:
        UsersUser.objects.using('users').get_or_create(id=user.pk)
