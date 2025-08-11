import json
import logging

from celery.result import AsyncResult
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.celery_app import app
from core.services.answer_checker import check_answer
from core.services.schema_creator import get_schema
from core.users.decorators import validate_case_access
from core.users.models import Case as UserCase
from core.users.models import User, UserProgress
from core.users.tasks import execute_safe_sql

logger = logging.getLogger(__name__)


class SchemaView(APIView):
    permission_classes = [IsAuthenticated]

    @validate_case_access
    def get(self, request, case_id):
        try:
            schema = get_schema(case_id)
            return Response(schema)
        except ObjectDoesNotExist as e:
            return Response({"error": str(e)}, status=404)


class ExecuteSQLView(APIView):
    permission_classes = [IsAuthenticated]

    @validate_case_access
    def post(self, request, case_id):
        sql = request.data.get("sql", "").strip()
        if not sql:
            return Response(
                {"error": "Поле 'sql' не может быть пустым"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.get(id=request.user.id)
        case = request.case

        try:
            UserProgress.objects.get(user=user, case=case)
        except UserProgress.DoesNotExist:
            return Response(
                {"error": "Прогресс по делу не найден"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            task = execute_safe_sql.delay(user.id, case.id, sql)
        except Exception as e:
            return Response(
                {"error": f"Ошибка запуска задачи: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class TaskStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        result = AsyncResult(task_id, app=app)

        if result.status == "SUCCESS":
            value = result.result
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    pass
            return Response({"status": result.status, "result": value})

        elif result.status == "FAILURE":
            return Response({"status": result.status, "error": str(result.result)})

        return Response({"status": result.status})


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    @validate_case_access
    def post(self, request):
        answer = request.data.get("answer", "")
        success = check_answer(
            answer=answer, user_id=request.user.id, case_id=request.case.id
        )
        return Response({"correct": success})


class CaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cases = UserCase.objects.using("users").values()
        return Response(cases)


class UserProgressListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = list(
            UserProgress.objects.filter(user_id=request.user.id).values(
                "case_id", "status"
            )
        )
        return Response(progress)
