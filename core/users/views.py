from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UserProgress, User
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_progress(request):
    """
    Получить прогресс пользователя по всем делам
    """
    try:
        logger.info(f"Получен запрос от пользователя ID: {request.user.id}")
        
        # Получаем прогресс пользователя напрямую по ID
        progress = UserProgress.objects.filter(user_id=request.user.id)
        logger.info(f"Получен прогресс: {progress.count()} записей")
        
        # Преобразуем в список
        result = list(progress.values('case_id'))
        logger.info(f"Подготовлен ответ: {result}")
        
        return Response(result)
    except Exception as e:
        logger.error(f"Ошибка при получении прогресса: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)
