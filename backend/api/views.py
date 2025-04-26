from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ReportPermission,Reports,ReportColumns,RoleAndReportRelation,ReportColumnPermission,ReportTemplates,TemplateColumns

from .serializers import ReportPermissionSerializer,ReportTemplatesSerializer,ReportSerializer
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



# -------------second approach -------------------
# report lsiting
@api_view(['GET'])
def get_all_reports(request):
    try:
        report_data = Reports.objects.all().values('id','report_name','template_count')
    
        return Response({"message":"Report data fetched successfully",
                         "data":list(report_data),
                         "status":'Success'})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# columns listing by report id
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

# report with its columns
@api_view(['GET'])
def get_all_reports_with_columns(request):
    try:
        reports = Reports.objects.prefetch_related('report_columns')
        serializer = ReportSerializer(reports,many=True)
        return Response({"message":"Report data fetched successfully",
                         "data":serializer.data,
                         "status":'Success'})   

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# create template
# @api_view(['POST'])
# def create_report_template(request):
#     try:
#         data = request.data
#         parent_report_id = data.get('parent_report_id')
#         template_name = data.get('template_name')
#         selected_columns = data.get('columns', []) 

#         if not (parent_report_id and template_name and selected_columns):
#             return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

#         report = Reports.objects.get(id=parent_report_id)

#         if report.template_count >= 5:
#             return Response({"error": f"Max 5 subreports allowed"}, status=status.HTTP_403_FORBIDDEN)
        
#         if ReportTemplates.objects.filter(name=template_name, parent_report_id=parent_report_id).exists():
#             return Response({
#                 "error":  f"A template with the name '{template_name}' already exists for this report."
#             }, status=status.HTTP_400_BAD_REQUEST)
#          #  Check for existing templates with same column set
#         existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id)
#         selected_set = set(selected_columns)

#         for template in existing_templates:
#             existing_cols = set(
#                 TemplateColumns.objects.filter(template_id=template.id).values_list('column_name', flat=True)
#             )
#             if existing_cols == selected_set:
#                 return Response({
#                     "error": "A sub-report with the exact same columns already exists.",
#                     "template_id": template.id,
#                     "template_name": template.name
#                 }, status=status.HTTP_409_CONFLICT)
#          # Check if all columns are selected
#         all_columns = set(ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True))
#         if selected_set == all_columns:
#             return Response({
#                 "error": "You cannot create a sub-report with all columns selected. Please select a subset of columns."
#             }, status=status.HTTP_400_BAD_REQUEST)
#         with transaction.atomic():
#             template = ReportTemplates.objects.create(
#                 name=template_name,
#                 parent_report_id=parent_report_id
#             )
#             TemplateColumns.objects.bulk_create([
#                 TemplateColumns(template_id=template.id, column_name=col) for col in selected_columns
#             ])
#             report.template_count += 1
#             report.save()

#         return Response({"message": "Template created successfully"}, status=status.HTTP_201_CREATED)

#     except Reports.DoesNotExist:
#         return Response({"error": "Parent report not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_report_template(request):
    try:
        data = request.data
        parent_report_id = data.get('parent_report_id')
        template_name = data.get('template_name', '').strip()
        selected_columns = data.get('columns', [])

        # Validate required fields
        if not parent_report_id or not template_name or not selected_columns:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure selected_columns is a list of strings
        if not isinstance(selected_columns, list) or not all(isinstance(col, str) for col in selected_columns):
            return Response({"error": "Columns must be a list of strings."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter out duplicate columns
        selected_set = set(col.strip() for col in selected_columns if col.strip())

        # Fetch report
        try:
            report = Reports.objects.get(id=parent_report_id)
        except Reports.DoesNotExist:
            return Response({"error": "Parent report not found."}, status=status.HTTP_404_NOT_FOUND)

        if report.template_count >= 5:
            return Response({"error": "Max 5 subreports allowed."}, status=status.HTTP_403_FORBIDDEN)

        # Check for template name uniqueness under this report
        if ReportTemplates.objects.filter(name=template_name, parent_report_id=parent_report_id).exists():
            return Response({
                "error": f"A template with the name '{template_name}' already exists for this report."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate columns against actual report columns
        valid_columns = set(
            ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True)
        )

        invalid_columns = selected_set - valid_columns
        if invalid_columns:
            return Response({
                "error": "Some selected columns are invalid for this report.",
                "invalid_columns": list(invalid_columns)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Prevent templates with all columns selected
        if selected_set == valid_columns:
            return Response({
                "error": "You cannot create a sub-report with all columns selected. Please select a subset."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate column set
        existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id)
        for template in existing_templates:
            existing_cols = set(
                TemplateColumns.objects.filter(template_id=template.id).values_list('column_name', flat=True)
            )
            if existing_cols == selected_set:
                return Response({
                    "error": "A sub-report with the exact same columns already exists.",
                    "template_id": template.id,
                    "template_name": template.name
                }, status=status.HTTP_409_CONFLICT)

        # Create template
        with transaction.atomic():
            template = ReportTemplates.objects.create(
                name=template_name,
                parent_report_id=parent_report_id
            )
            TemplateColumns.objects.bulk_create([
                TemplateColumns(template_id=template.id, column_name=col) for col in selected_set
            ])
            report.template_count += 1
            report.save()

        return Response({
            "message": "Template created successfully.",
            "template_id": template.id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Error creating template:")
        return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# list templates with columns
@api_view(['GET'])
def get_templates(request):
    try:
        templates = ReportTemplates.objects.select_related('parent_report').all()
        serializer = ReportTemplatesSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# #update template
# @api_view(['PUT'])
# def update_template(request):
#     try:
#           data = request.data
#           templateId = data.get('template_id')
#           template_name = data.get('name')
#           new_columns = data.get('columns', [])
#           template = ReportTemplates.objects.filter(id=templateId).first()
#           if not template:
#             return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
#           if ReportTemplates.objects.filter(name=template_name, parent_report_id=template.parent_report_id).exclude(id=template.id).exists():
#             return Response({
#                 "error": "Template name already exists for this report."
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         #  Check for existing templates with same column set
#           existing_templates = ReportTemplates.objects.filter(parent_report_id=template.parent_report_id)
#           selected_set = set(new_columns)


#           for template in existing_templates:
#                 existing_cols = set(
#                     TemplateColumns.objects.filter(template_id=template.id).values_list('column_name', flat=True)
#                 )
#                 if existing_cols == selected_set:
#                     return Response({
#                         "error": "A sub-report with the exact same columns already exists.",
#                         "template_id": template.id,
#                         "template_name": template.name
#                     }, status=status.HTTP_409_CONFLICT)
#            # Check if all columns are selected
#           all_columns = set(ReportColumns.objects.filter(report_id=template.parent_report_id).values_list('column_name', flat=True))
#           if selected_set == all_columns:
#                     return Response({
#                         "error": "You cannot create a sub-report with all columns selected. Please select a subset of columns."
#                     }, status=status.HTTP_400_BAD_REQUEST)
       
        
#           with transaction.atomic():
#                 if template_name:
#                     template.name = template_name
#                     template.save()
#                 if new_columns:
#                     TemplateColumns.objects.filter(template_id=templateId).delete()
#                     TemplateColumns.objects.bulk_create([
#                         TemplateColumns(template_id=templateId, column_name=col) for col in new_columns
#                     ])
#                 return Response({"message": "Template updated successfully"}, status=status.HTTP_200_OK)

#     except Exception as e:

#         return Response({'error':str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_template(request):
    try:
        data = request.data
        template_id = data.get('template_id')
        template_name = data.get('name', '').strip()
        new_columns = data.get('columns', [])

        # Basic validation
        if not template_id:
            return Response({"error": "Template ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not template_name:
            return Response({"error": "Template name cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(new_columns, list) or not new_columns:
            return Response({"error": "At least one column must be selected."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock the template record to avoid concurrent modifications
            template = ReportTemplates.objects.select_for_update().filter(id=template_id).first()
            if not template:
                return Response({"error": "Template not found."}, status=status.HTTP_404_NOT_FOUND)

            parent_report_id = template.parent_report_id

            # Check for name conflict
            if ReportTemplates.objects.filter(
                name=template_name,
                parent_report_id=parent_report_id
            ).exclude(id=template.id).exists():
                return Response({
                    "error": f"A template with the name '{template_name}' already exists for this report."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate that all selected columns are valid for this report
            valid_columns = set(
                ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True)
            )
            selected_set = set(new_columns)

            if not selected_set.issubset(valid_columns):
                invalid_cols = selected_set - valid_columns
                return Response({
                    "error": "Some selected columns are invalid.",
                    "invalid_columns": list(invalid_cols)
                }, status=status.HTTP_400_BAD_REQUEST)

            # Prevent selecting all columns
            if selected_set == valid_columns:
                return Response({
                    "error": "Cannot create a template with all columns selected. Please choose a subset."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check for existing templates with the same set of columns
            existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id).exclude(id=template.id)

            for t in existing_templates:
                existing_cols = set(
                    TemplateColumns.objects.filter(template_id=t.id).values_list('column_name', flat=True)
                )
                if existing_cols == selected_set:
                    return Response({
                        "error": "A template with the same column selection already exists.",
                        "template_id": t.id,
                        "template_name": t.name
                    }, status=status.HTTP_409_CONFLICT)

            # Update template name and columns
            template.name = template_name
            template.save()

            TemplateColumns.objects.filter(template_id=template_id).delete()
            TemplateColumns.objects.bulk_create([
                TemplateColumns(template_id=template_id, column_name=col) for col in new_columns
            ])

        return Response({"message": "Template updated successfully."}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("Error updating template:")
        return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# delete template
@api_view(['DELETE'])
def delete_template(request):
    try:
        data = request.data
        templateId = data.get('template_id')
        template = ReportTemplates.objects.get(id=templateId)
        report = template.parent_report
        if report.template_count <= 0:
            return Response({
                "error": "No sub-reports left to delete.Something went wrong!"
            }, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            TemplateColumns.objects.filter(template_id=template.id).delete()
            template.delete()

            if report.template_count > 0:
                report.template_count -= 1
                report.save()
            else:
             raise ValueError("Template count cannot be negative.Something went wrong!")

        return Response({"message": "Template deleted successfully"}, status=status.HTTP_200_OK)
    except ReportTemplates.DoesNotExist:
        return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
    
