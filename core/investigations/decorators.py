from functools import wraps

from rest_framework import status
from rest_framework.response import Response
from users.models import Case


def validate_case_access(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        case_id = kwargs.get("case_id") or request.query_params.get("case_id") or request.data.get("case_id")
        if not case_id:
            return Response({'error': 'Не передан case_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            case = Case.objects.get(pk=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Дело не найдено'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.total_xp < case.required_xp:
            return Response({'error': 'Недостаточно опыта для доступа к делу'}, status=status.HTTP_403_FORBIDDEN)

        request.case = case
        return view_func(request, *args, **kwargs)

    return _wrapped_view
