from functools import wraps

from rest_framework import status
from rest_framework.response import Response
from users.models import Case, User


def validate_case_access(view_func):
    @wraps(view_func)
    def _wrapped_view(view_self, request, *args, **kwargs):
        # For class-based views, request is the first arg after self
        # For function-based views, request is the first arg
        actual_request = request if hasattr(request, 'user') else view_self

        case_id = kwargs.get("case_id") or actual_request.query_params.get("case_id") or actual_request.data.get("case_id")
        if not case_id:
            return Response({'error': 'Не передан case_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            case = Case.objects.get(pk=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Дело не найдено'}, status=status.HTTP_404_NOT_FOUND)

        try:
            user_xp = User.objects.get(id=actual_request.user.id)
            if user_xp.xp < case.required_xp:
                return Response({'error': 'Недостаточно опыта для доступа к делу'}, status=status.HTTP_403_FORBIDDEN)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        actual_request.case = case
        return view_func(view_self, request, *args, **kwargs)

    return _wrapped_view
