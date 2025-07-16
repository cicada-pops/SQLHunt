import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserProgress

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_progress(request):
    """
    Получить прогресс пользователя по всем делам
    """
    try:
        logger.info(f"Получен запрос от пользователя ID: {request.user.id}")
      
        progress = list(UserProgress.objects.filter(user_id=request.user.id).values('case_id', 'status'))
        logger.info(f"Подготовлен ответ: {progress}")
        
        return Response(progress)
    except Exception as e:
        logger.error(f"Ошибка при получении прогресса: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=500)
