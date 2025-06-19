from celery.result import AsyncResult
from celery_app import app
from django.core.exceptions import ObjectDoesNotExist
from investigations.decorators import validate_case_access
from investigations.tasks import execute_safe_sql
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import Case as UserCase
from users.models import User, UserProgress

from services.answer_checker import check_answer
from services.schema_creator import get_schema


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@validate_case_access
def schema_view(request, case_id):
    """
    Get the database schema for a specific case.
    """
    try:
        schema = get_schema(case_id)
        return Response(schema)
    except ObjectDoesNotExist as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class ExecuteSQLView(APIView):
    permission_classes = [IsAuthenticated]

    @validate_case_access
    def post(self, request, case_id):
        sql = request.data.get("sql", "").strip()
        if not sql:
            return Response({"error": "Поле 'sql' не может быть пустым"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(id=request.user.id)
        case = request.case  

        try:
            UserProgress.objects.get(user=user, case=case)
        except UserProgress.DoesNotExist:
            return Response({"error": "Прогресс по делу не найден"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            task = execute_safe_sql.delay(user.id, case.id, sql)
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


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    @validate_case_access
    def post(self, request, case_id):
        answer = request.data.get("answer", "")
        success = check_answer(answer=answer, user_id=request.user.id, case_id=request.case.id)
        return Response({"correct": success})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_case_list(request):
    """
    Возвращает список всех доступных дел с их основной информацией.
    """
    cases = UserCase.objects.using('users').all()
    case_list = [
        {
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'short_description': case.short_description,
            'required_xp': case.required_xp,
            'reward_xp': case.reward_xp,
        }
        for case in cases
    ]
    return Response(case_list)
