from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ReportPermission,Reports,ReportColumns,RoleAndReportRelation,ReportColumnPermission,ReportTemplates,TemplateColumns

from .serializers import ReportPermissionSerializer
from .serializers import ReportPermissionListSerializer
from django.db import DatabaseError,transaction
import logging
from collections import defaultdict


logger = logging.getLogger(__name__)

# Flow 1: for create or update atleast one column required
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
            else:
                return Response({"message": "At least one column required"})
        
        return Response({"message": "Report permissions saved successfully"}, status=status.HTTP_200_OK)

    except DatabaseError as e:
        logger.error(f"Database error: {str(e)}")
        return Response({"error": "Database error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
            logger.exception("Unexpected error occurred")
            return Response({"error": "An unexpected error occurred.", "details": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# Flow 2: no field validation
# @api_view(['POST'])
# def set_report_permissions(request):

#     if not isinstance(request.data, list):
#         return Response({"error": "Expected a list of entries"}, status=status.HTTP_400_BAD_REQUEST)
#     try:
#         for entry in request.data:
#             role = entry.get("role", {})
#             entry["role_id"] = role.get("id")
#             entry["role_name"] = role.get("name")
#             serializer = ReportPermissionSerializer(data=entry)
#             if not serializer.is_valid():
#                 return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#             validated = serializer.validated_data
#             selected_columns = [
#                 {"column": col["column"], "is_selected": True}
#                 for col in validated["all_fields"] if col["is_selected"]
#             ]
         
#             # if selected_columns:
#             ReportPermission.objects.update_or_create(
#                     role_id=validated["role_id"],
#                     report_id=validated["report_id"],
#                     defaults={
#                         'columns': selected_columns,
#                         'role_name':validated['role_name'],
#                         'report_name':validated['report_name']
#                         }
#                 )
            
        
#         return Response({"message": "Report permissions saved successfully"}, status=status.HTTP_200_OK)

#     except DatabaseError as e:
#         logger.error(f"Database error: {str(e)}")
#         return Response({"error": "Database error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     except Exception as e:
#             logger.exception("Unexpected error occurred")
#             return Response({"error": "An unexpected error occurred.", "details": str(e)},
#                             status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_report_permissions(request):
    try:
        permissions = ReportPermission.objects.all()
        if not permissions:
            return Response({"message": "No report permissions found"}, status=status.HTTP_404_NOT_FOUND)
        grouped_data = defaultdict(dict)
        for perm in permissions:
            role_id = str(perm.role_id)   
            report_id = str(perm.report_id)

            grouped_data[role_id][report_id] = {
                "report_name": perm.report_name,
                "columns": perm.columns  
            }

        return Response(grouped_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("Error building nested report permissions")
        return Response({
            "error": "An error occurred while fetching report permissions",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET'])
def show_report_permission(request, role_id):
    try:
        if not role_id:
            return Response({"error": "Invalid role ID"}, status=status.HTTP_400_BAD_REQUEST)

        permissions = ReportPermission.objects.filter(role_id=role_id)
        if not permissions.exists():
            return Response({"error": "No report permissions found for this role"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReportPermissionListSerializer(permissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": "Something went wrong", "details": str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['GET'])
def get_role_report_permissions(request):
    try:
        relations = RoleAndReportRelation.objects.select_related('role', 'report').all()
        if not relations:
            return Response({"message": "No role-report relations found"}, status=status.HTTP_404_NOT_FOUND)

        grouped_data = defaultdict(dict)

        for rel in relations:
            role_id = str(rel.role.id)
            report_id = str(rel.report.id)

            # Get all columns for this report
            all_columns = ReportColumns.objects.filter(report=rel.report)

            # Get permissions for this role-report
            permissions = ReportColumnPermission.objects.filter(
                role=rel.role,
                report=rel.report
            )
            permission_map = {perm.column.id: perm.is_selected for perm in permissions}

            # Compose column info
            column_data = [
                {
                    "column_name": col.column_name,
                    "is_selected": permission_map.get(col.id, False)
                }
                for col in all_columns
            ]

            grouped_data[role_id][report_id] = {
                "report_name": rel.report.report_name,
                "columns": column_data
            }

        return Response(grouped_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("Error building nested report permissions")
        return Response({
            "error": "An error occurred while fetching report permissions",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
def get_all_reports(request):
    try:
        report_data = Reports.objects.all().values('id','report_name','template_count')
    
        return Response(list(report_data),status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_report_columns(request,report_id):
    if not report_id:
          return Response("message : report_id required")
    try:
        columns = ReportColumns.objects.filter(report_id = report_id).values_list('id',flat=True)
        if not columns:
            return Response("message : No data found")
        return Response({
            "report_id":report_id,
            "columns":list(columns)
        },status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_all_reports_with_columns(request):
    try:
        reports = Reports.objects.all()
        report_columns = ReportColumns.objects.all()

        result = defaultdict(dict)

        for report in reports:
            result[report.id] = {
                "report_name": report.report_name,
                "template_count": report.template_count,
                "columns": []
            }

        for col in report_columns:
            result[col.report_id]["columns"].append(col.column_name)

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
"""
{
  "parent_report_id": 1,
  "template_name": "Important Tasks Report",
  "columns": [
    "task_id",
    "transaction_date",
    "priority",
    "assigned_to"
  ]
}

"""
@api_view(['POST'])
def create_report_template(request):
    try:
        data = request.data
        parent_report_id = data.get('parent_report_id')
        template_name = data.get('template_name')
        selected_columns = data.get('columns', []) 

        if not (parent_report_id and template_name and selected_columns):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        report = Reports.objects.get(id=parent_report_id)

        if report.template_count >= 5:
            return Response({"error": "Max subreports allowed"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            template = ReportTemplates.objects.create(
                name=template_name,
                parent_report_id=parent_report_id
            )
            TemplateColumns.objects.bulk_create([
                TemplateColumns(template_id=template.id, column_name=col) for col in selected_columns
            ])
            report.template_count += 1
            report.save()

        return Response({"message": "Template created successfully"}, status=status.HTTP_201_CREATED)

    except Reports.DoesNotExist:
        return Response({"error": "Parent report not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
