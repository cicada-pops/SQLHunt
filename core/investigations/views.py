from celery.result import AsyncResult
from investigations.tasks import execute_safe_sql
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import Case, UserProgress

from services.schema_creator import get_schema


@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def schema_view(request, case_id):
    try:
        Case.objects.get(pk=case_id)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

    schema = get_schema(case_id)
    return Response(schema)


class ExecuteSQLView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        sql = request.data.get("sql", "").strip()
        if not sql:
            return Response({"error": "Поле 'sql' не может быть пустым"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        try:
            active_case_id = UserProgress.objects.get(user=user).current_case_id # type: ignore
        except UserProgress.DoesNotExist:
            return Response({"error": "Активное дело не найдено"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            task = execute_safe_sql.delay(user.id, active_case_id, sql) # type: ignore
        except Exception as e:
            return Response({"error": f"Ошибка запуска задачи: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class TaskStatusView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        result = AsyncResult(task_id)
        if result.ready():
            return Response({"status": result.status, "result": result.result})
        return Response({"status": result.status})
