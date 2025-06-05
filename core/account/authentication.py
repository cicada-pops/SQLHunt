from django.contrib.auth.models import User
from django.db.models import Q
from account.models import Profile

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
    
def create_profile(backend, user, *args, **kwargs):
    Profile.objects.get_or_create(user=user)
