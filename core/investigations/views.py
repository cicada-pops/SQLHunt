from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from users.models import Case

from services.schema_creator import get_schema


@api_view(['GET'])
def schema_view(request, case_id):
    try:
        Case.objects.get(pk=case_id)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

    schema = get_schema(case_id)
    return Response(schema)
