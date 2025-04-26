from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Reports,ReportColumns,ReportTemplates,TemplateColumns
from .serializers import ReportTemplatesSerializer,ReportSerializer
from django.db import transaction
from collections import defaultdict
from django.conf import settings
import logging
import os
import json
import re


logger = logging.getLogger(__name__)

def is_valid_template_name(name: str) -> bool:
    """
    Validates the template name.
    - Must start with a letter (A-Z or a-z)
    - Can contain letters, digits, spaces, underscores, and hyphens
    - No special characters like / @ # ! etc
    """
    if not name:
        return False
    pattern = r'^[A-Za-z][A-Za-z0-9 _-]*$'
    return bool(re.match(pattern, name))

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

        if not isinstance(selected_columns, list) or not all(isinstance(col, dict) for col in selected_columns):
            return Response({"error": "Columns must be a list of objects with column_name and label."}, status=status.HTTP_400_BAD_REQUEST)

        # Extract column_name list from selected columns
        selected_db_columns = set(
            col.get('column_name') for col in selected_columns if col.get('column_name')
        )

        if not selected_db_columns:
            return Response({"error": "No valid columns selected."}, status=status.HTTP_400_BAD_REQUEST)

        if not is_valid_template_name(template_name):
          return Response({
            "error": "Template name must start with a letter and can only contain letters, numbers, spaces, underscores (_) or hyphens (-)."
        }, status=status.HTTP_400_BAD_REQUEST)
        # Fetch parent report
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

        # Validate selected columns against report's main columns
        valid_db_columns = set(
            ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True)
        )

        invalid_columns = selected_db_columns - valid_db_columns
        if invalid_columns:
            return Response({
                "error": "Some selected columns are invalid for this report.",
                "invalid_columns": list(invalid_columns)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Prevent templates with ALL columns selected
        if selected_db_columns == valid_db_columns:
            return Response({
                "error": "You cannot create a subreport with all columns selected. Please select a subset."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate template (column set match)
        existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id)
        for template in existing_templates:
            existing_template_columns = set(
                TemplateColumns.objects.filter(template_id=template.id).values_list('column_name', flat=True)
            )
            if existing_template_columns == selected_db_columns:
                return Response({
                    "error": "A subreport with the exact same columns already exists.",
                    "template_id": template.id,
                    "template_name": template.name
                }, status=status.HTTP_409_CONFLICT)

        # Create Template and TemplateColumns
        with transaction.atomic():
            template = ReportTemplates.objects.create(
                name=template_name,
                parent_report_id=parent_report_id
            )

            template_columns = [
                TemplateColumns(
                    template=template,
                    column_name=col['column_name'],
                    label=col['label']
                )
                for col in selected_columns if col.get('column_name') and col.get('label')
            ]
            TemplateColumns.objects.bulk_create(template_columns)

            # Increase template count
            report.template_count += 1
            report.save()

        return Response({
            "message": "Template created successfully."
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
 

@api_view(['PUT'])
def update_template(request):
    try:
        data = request.data
        template_id = data.get('template_id')
        template_name = data.get('name', '').strip()
        selected_columns = data.get('columns', [])

        # Validate required fields
        if not template_id or not template_name or not selected_columns:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        if not is_valid_template_name(template_name):
          return Response({
            "error": "Template name must start with a letter and can only contain letters, numbers, spaces, underscores (_) or hyphens (-)."
        }, status=status.HTTP_400_BAD_REQUEST)
        # Ensure selected_columns is a list of objects with column_name and label
        if not isinstance(selected_columns, list) or not all(isinstance(col, dict) for col in selected_columns):
            return Response({"error": "Columns must be a list of objects with column_name and label."}, status=status.HTTP_400_BAD_REQUEST)

        # Extract column_name set
        selected_db_columns = set(
            col.get('column_name') for col in selected_columns if col.get('column_name')
        )

        if not selected_db_columns:
            return Response({"error": "No valid columns selected."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock the template record
            template = ReportTemplates.objects.select_for_update().filter(id=template_id).first()
            if not template:
                return Response({"error": "Template not found."}, status=status.HTTP_404_NOT_FOUND)

            parent_report_id = template.parent_report_id

            # Check name uniqueness (excluding current template)
            if ReportTemplates.objects.filter(
                name=template_name,
                parent_report_id=parent_report_id
            ).exclude(id=template.id).exists():
                return Response({
                    "error": f"A template with the name '{template_name}' already exists for this report."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate columns against report main columns
            valid_db_columns = set(
                ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True)
            )

            invalid_columns = selected_db_columns - valid_db_columns
            if invalid_columns:
                return Response({
                    "error": "Some selected columns are invalid for this report.",
                    "invalid_columns": list(invalid_columns)
                }, status=status.HTTP_400_BAD_REQUEST)

            # Prevent selecting all columns
            if selected_db_columns == valid_db_columns:
                return Response({
                    "error": "Cannot create a template with all columns selected. Please choose a subset."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check for duplicate templates (columns match)
            existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id).exclude(id=template.id)
            for t in existing_templates:
                existing_cols = set(
                    TemplateColumns.objects.filter(template_id=t.id).values_list('column_name', flat=True)
                )
                if existing_cols == selected_db_columns:
                    return Response({
                        "error": "A template with the same column selection already exists.",
                        "template_id": t.id,
                        "template_name": t.name
                    }, status=status.HTTP_409_CONFLICT)

            # Update template name
            template.name = template_name
            template.save()

            # Update columns
            TemplateColumns.objects.filter(template_id=template_id).delete()
            new_template_columns = [
                TemplateColumns(
                    template_id=template_id,
                    column_name=col['column_name'],
                    label=col['label']
                )
                for col in selected_columns if col.get('column_name') and col.get('label')
            ]
            TemplateColumns.objects.bulk_create(new_template_columns)

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
    
def load_task_report():
    file_path = os.path.join(settings.BASE_DIR, 'data', 'task_report.json')
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading task report: {e}")
        return None

@api_view(['POST'])
def get_template_report_data(request):
    try:
        data = request.data
        template_id = data.get('template_id')

        template = ReportTemplates.objects.select_related('parent_report').get(id=template_id)

        selected_columns = list(
            TemplateColumns.objects.filter(template_id=template_id)
            .values('column_name', 'label')
        )
        column_names = [col['column_name'] for col in selected_columns]
        labels = {col['column_name']: col['label'] for col in selected_columns}
        full_data = load_task_report() 
        filtered_rows = [
            {key: row.get(key, None) for key in column_names if key in row}
            for row in full_data["rows"]
        ]
        if not filtered_rows or all(len(row) == 0 for row in filtered_rows):
            return Response({"error": "No record Found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "template_id": template.id,
            "template_name": template.name,
            "report_name": template.parent_report.report_name,
            "columns": [col['label'] for col in selected_columns],
            'test':labels,
            "data": filtered_rows
        }, status=status.HTTP_200_OK)

    except ReportTemplates.DoesNotExist:
        return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
