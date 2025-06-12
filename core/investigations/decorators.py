from functools import wraps

from rest_framework import status
from rest_framework.response import Response
from users.models import Case, User


def validate_case_access(view_func):
    @wraps(view_func)
    def _wrapped_view(view_self_or_request, *args, **kwargs):
        # Определяем, является ли первый аргумент request или self
        if hasattr(view_self_or_request, 'user'):
            # Это request в случае функции-представления
            request = view_self_or_request
        else:
            # Это self в случае метода класса, request будет первым аргументом
            request = args[0]
            args = args[1:]  # Убираем request из args, так как он уже обработан

        case_id = kwargs.get("case_id") or request.query_params.get("case_id") or request.data.get("case_id")
        if not case_id:
            return Response({'error': 'Не передан case_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            case = Case.objects.get(pk=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Дело не найдено'}, status=status.HTTP_404_NOT_FOUND)

        try:
            user_xp = User.objects.get(id=request.user.id)
            if user_xp.xp < case.required_xp:
                return Response({'error': 'Недостаточно опыта для доступа к делу'}, status=status.HTTP_403_FORBIDDEN)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        request.case = case
        if hasattr(view_self_or_request, 'user'):
            # Для функции-представления
            return view_func(request, *args, **kwargs)
        else:
            # Для метода класса
            return view_func(view_self_or_request, request, *args, **kwargs)

    return _wrapped_view
