from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ReportPermission
from .serializers import ReportPermissionSerializer
from .serializers import ReportPermissionListSerializer
from django.db import DatabaseError
from .utils import decode_id
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def set_report_permissions(request):

    if not isinstance(request.data, list):
        return Response({"error": "Expected a list of entries"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        for entry in request.data:
            role = entry.get("role", {})
            entry["role_id"] = role.get("id")
            entry["role_name"] = role.get("name")
            serializer = ReportPermissionSerializer(data=entry)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated = serializer.validated_data
            selected_columns = [
                {"column": col["column"], "is_selected": True}
                for col in validated["all_fields"] if col["is_selected"]
            ]

            if selected_columns:
                ReportPermission.objects.update_or_create(
                    role_id=validated["role_id"],
                    report_id=validated["report_id"],
                    defaults={
                        'columns': selected_columns,
                        'role_name':validated['role_name'],
                        'report_name':validated['report_name']
                        }
                )
        
        return Response({"message": "Report permissions saved successfully"}, status=status.HTTP_200_OK)

    except DatabaseError as e:
        logger.error(f"Database error: {str(e)}")
        return Response({"error": "Database error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
            logger.exception("Unexpected error occurred")
            return Response({"error": "An unexpected error occurred.", "details": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_report_permissions(request):
     try:
        permissions = ReportPermission.objects.all()
        if not permissions:
            return Response({"message": "No report permissions found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReportPermissionListSerializer(permissions, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

        # return Response(permissions.values(), status=status.HTTP_200_OK)

     except Exception as e:
         logger.exception("Error fetching report permissions")
         return Response({"error": "An error occurred while fetching report permissions", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def show_report_permission(request, encoded_id):
    try:
        pid = decode_id(encoded_id)
        if not pid:
            return Response({"error": "Invalid report permission ID"}, status=status.HTTP_400_BAD_REQUEST)

        permission = ReportPermission.objects.get(id=pid)
        serializer = ReportPermissionListSerializer(permission)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except ReportPermission.DoesNotExist:
        return Response({"error": "Report Permission not found"}, status=status.HTTP_404_NOT_FOUND)