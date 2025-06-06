from celery.result import AsyncResult
from celery_app import app
from investigations.tasks import execute_safe_sql
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import Case, User, UserProgress

from services.schema_creator import get_schema


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def schema_view(request, case_id):
    try:
        Case.objects.get(pk=case_id)
    except Case.DoesNotExist:
        return Response({'error': 'Дело не найдено'}, status=status.HTTP_404_NOT_FOUND)

    schema = get_schema(case_id)
    return Response(schema)


class ExecuteSQLView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_user = request.user
        try:
            user = User.objects.get(id=auth_user.id)
        except User.DoesNotExist:
          return Response({"error": "Профиль пользователя не найден"}, status=400)
        sql = request.data.get("sql", "").strip()
        case_id = request.data.get("case_id")

        if not sql:
            return Response({"error": "Поле 'sql' не может быть пустым"}, status=status.HTTP_400_BAD_REQUEST)
        if not case_id:
            return Response({"error": "Поле 'case_id' обязательно"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({"error": "Дело не найдено"}, status=status.HTTP_404_NOT_FOUND)

        try:
            UserProgress.objects.get(user=user, case=case)
        except UserProgress.DoesNotExist:
            return Response({"error": "Прогресс по делу не найден"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            task = execute_safe_sql.delay(user.id, case.id, sql)  # type: ignore
        except Exception as e:
            return Response({"error": f"Ошибка запуска задачи: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class TaskStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        result = AsyncResult(task_id, app=app)
        if result.successful():
            return Response({"status": result.status, "result": result.result})
        elif result.failed():
            return Response({"status": result.status, "error": str(result.result)})
        else:
            return Response({"status": result.status})
