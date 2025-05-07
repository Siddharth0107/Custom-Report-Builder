from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Reports,ReportColumns,ReportFilters,ReportTemplateDetails,ReportTemplateMaster,ReportTemplates,TemplateColumns,TemplateFilters
from .serializers import ReportTemplatesMasterSerializer,ReportSerializer
from django.db import transaction
from collections import defaultdict
from django.conf import settings
import logging
import os
import json
import re
from django.forms.models import model_to_dict
from datetime import datetime
logger = logging.getLogger(__name__)

def is_valid_template_name(name: str) -> bool:
    """
    Validates the template name.
    - Must start with a letter (A-Z or a-z or 0-9)
    - Can contain letters, digits, spaces, underscores, and hyphens
    - No special characters like / @ # ! etc
    """
    if not name:
        return False
    pattern = r'^[A-Za-z0-9][A-Za-z0-9 _-]*$'
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
        template_filters = data.get('report_filters',[])
        if not is_valid_template_name(template_name):
          return Response({
            "error": "Template name must start with a letter or digits and can only contain letters, numbers, spaces, underscores (_) or hyphens (-)."
        }, status=status.HTTP_400_BAD_REQUEST)
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

        # Fetch parent report
        try:
            report = Reports.objects.get(id=parent_report_id)
        except Reports.DoesNotExist:
            return Response({"error": "Parent report not found."}, status=status.HTTP_404_NOT_FOUND)
        
        

        # if report.template_count >= 5:
        #     return Response({"error": "Max 5 subreports allowed."}, status=status.HTTP_403_FORBIDDEN)

        # Check for template name uniqueness under this report
        # if ReportTemplates.objects.filter(name=template_name, parent_report_id=parent_report_id).exists():
        #     return Response({
        #         "error": f"A template with the name '{template_name}' already exists for this report."
        #     }, status=status.HTTP_400_BAD_REQUEST)

        # Validate selected columns against report's main columns
        valid_db_columns = set(
            ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True)
        )

        # invalid_columns = selected_db_columns - valid_db_columns
        # if invalid_columns:
        #     return Response({
        #         "error": "Some selected columns are invalid for this report.",
        #         "invalid_columns": list(invalid_columns)
        #     }, status=status.HTTP_400_BAD_REQUEST)

        # Prevent templates with ALL columns selected
        # if selected_db_columns == valid_db_columns:
        #     return Response({
        #         "error": "You cannot create a subreport with all columns selected. Please select a subset."
        #     }, status=status.HTTP_400_BAD_REQUEST)


        existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id)
        # for template in existing_templates:
        #     existing_template_columns = set(
        #         TemplateColumns.objects.filter(template_id=template.id).values_list('column_name', flat=True)
        #     )
        #     if existing_template_columns == selected_db_columns:
        #         return Response({
        #             "error": "A subreport with the exact same columns already exists.",
        #             "template_id": template.id,
        #             "template_name": template.name
        #         }, status=status.HTTP_409_CONFLICT)

        # Create Template and TemplateColumns
        with transaction.atomic():
            template = ReportTemplateMaster.objects.create(
                name=template_name,
                parent_report_id=parent_report_id
            )

            # template_columns = [
            #     TemplateColumns(
            #         template=template,
            #         column_name=col['column_name'],
            #         label=col['label']
            #     )
            #     for col in selected_columns if col.get('column_name') and col.get('label')
            # ]
            # TemplateColumns.objects.bulk_create(template_columns)
            # template_filters = [
            # TemplateFilters(
            #         template=template,
            #         filter_name=col['filter_name'],
            #         filter_label=col['filter_label']
            #     )
            #     for col in template_filters if col.get('filter_name') and col.get('filter_label')
            # ]
            # TemplateFilters.objects.bulk_create(template_filters)
            ReportTemplateDetails.objects.create(
                template=template,
                data={
                    "columns": selected_columns,
                    "filters": template_filters
                }
            )
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
        templates = ReportTemplateMaster.objects.select_related('parent_report').all()
        serializer = ReportTemplatesMasterSerializer(templates, many=True)
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
        template_filters = data.get('report_filters',[])

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
            template = ReportTemplateMaster.objects.select_for_update().filter(id=template_id).first()
            if not template:
                return Response({"error": "Template not found."}, status=status.HTTP_404_NOT_FOUND)

            parent_report_id = template.parent_report_id

            # # Check name uniqueness (excluding current template)
            # if ReportTemplates.objects.filter(
            #     name=template_name,
            #     parent_report_id=parent_report_id
            # ).exclude(id=template.id).exists():
            #     return Response({
            #         "error": f"A template with the name '{template_name}' already exists for this report."
            #     }, status=status.HTTP_400_BAD_REQUEST)

            # Validate columns against report main columns
            valid_db_columns = set(
                ReportColumns.objects.filter(report_id=parent_report_id).values_list('column_name', flat=True)
            )

            # invalid_columns = selected_db_columns - valid_db_columns
            # if invalid_columns:
            #     return Response({
            #         "error": "Some selected columns are invalid for this report.",
            #         "invalid_columns": list(invalid_columns)
            #     }, status=status.HTTP_400_BAD_REQUEST)

            # Prevent selecting all columns
            # if selected_db_columns == valid_db_columns:
            #     return Response({
            #         "error": "Cannot create a template with all columns selected. Please choose a subset."
            #     }, status=status.HTTP_400_BAD_REQUEST)

            # Check for duplicate templates (columns match)
            # existing_templates = ReportTemplates.objects.filter(parent_report_id=parent_report_id).exclude(id=template.id)
            # for t in existing_templates:
            #     existing_cols = set(
            #         TemplateColumns.objects.filter(template_id=t.id).values_list('column_name', flat=True)
            #     )
            #     if existing_cols == selected_db_columns:
            #         return Response({
            #             "error": "A template with the same column selection already exists.",
            #             "template_id": t.id,
            #             "template_name": t.name
            #         }, status=status.HTTP_409_CONFLICT)

            # Update template name
            template.name = template_name
            template.save()

            # Update columns
            ReportTemplateDetails.objects.filter(template_id=template_id).delete()
            
            ReportTemplateDetails.objects.create(
                template=template,
                data={
                    "columns": selected_columns,
                    "filters": template_filters
                }
            )

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
        template = ReportTemplateMaster.objects.get(id=templateId)
        report = template.parent_report
        if report.template_count <= 0:
            return Response({
                "error": "No sub-reports left to delete.Something went wrong!"
            }, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            ReportTemplateDetails.objects.filter(template_id=template.id).delete()
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
    # file_path = os.path.join(settings.BASE_DIR, 'data', 'task_report.json')
    file_path = os.path.join(settings.BASE_DIR, 'data', 'task_report_new.json')
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading task report: {e}")
        return None
    

@api_view(['POST'])
def get_filter_options(request):
    try:
        report_data = load_task_report()
        if not report_data:
            return Response({'message': 'Report data not found'}, status=404)

        data = request.data
        template_id = int(data.get('template_id')) 
        try:
            template_report = ReportTemplateMaster.objects.get(id=template_id)
        except:
            return Response({'message': f'Template with {template_id} not found'}, status=404)
        template_report_data = model_to_dict(template_report)
        report_id = template_report_data['parent_report']
        report = next((item for item in report_data if item['id'] == report_id), None)
        if not report:
            return Response({'message': 'Report not found'}, status=404)
        
        template_details = ReportTemplateDetails.objects.filter(template_id=template_id).first()
        if not template_details or not template_details.data:
            return Response({'message': 'No template detail data found'}, status=404)

        filters_json = template_details.data.get('filters', [])
        report_filters = ReportFilters.objects.filter(report_id=report_id)
        report_filter_map = {
            rf.filter_name: {'filter_type': rf.filter_type, 'is_compulsory': rf.is_compulsory}
            for rf in report_filters
        }
        rows = report.get('rows', [])
        filter_values = {}
        for row in rows:
            for filter_item in filters_json:
                fname = filter_item['filter_name']
                if fname in row:
                    filter_values.setdefault(fname, set()).add(row[fname])
       
        result = []
        for filter_item in filters_json:
            fname = filter_item['filter_name']
            flabel = filter_item['filter_label']
            values = list(filter_values.get(fname, []))
            meta = report_filter_map.get(fname, {})
            result.append({
                'filter_name': fname,
                'filter_label': flabel,
                'values': values,
                'filter_type': meta.get('filter_type', ''),
                'is_compulsory': meta.get('is_compulsory', False)
            })

        return Response({'data': result}, status=200)
    except Exception as e:
        return Response({'message': str(e)}, status=500)

# def get_filter_options(request):
#     try:
   
#         report_data = load_task_report()
        
#         if not report_data:
#             return Response({'message': 'Report data not found'}, status=404)
        
#         data = request.data
#         template_id = int(data.get('template_id')) 
#         template_report = ReportTemplates.objects.get(id=template_id)
#         template_report_data = model_to_dict(template_report)
#         report_id = template_report_data['parent_report']

#         report = next((item for item in report_data if item['id'] == report_id), None)
#         if not report:
#             return Response({'message': 'Report not found'}, status=404)

#         selected_filters = TemplateFilters.objects.filter(template_id=template_id)
#         selected_columns = selected_filters.values_list('filter_name', flat=True)
        
#         filters = {}

#         for row in report.get('rows', []):  
#             for field, value in row.items(): 
#                 if field in selected_columns:
#                     filters.setdefault(field, set()).add(value)

       
#         filters = {k: list(v) for k, v in filters.items()}

#         return Response({'data': filters})

#     except Exception as e:
#         return Response({'message': str(e)}, status=500)



# @api_view(['GET'])
# def get_template_report_data(request):
#     try:
#         data = request.data
#         template_id = data.get('template_id')
#         selected_filters = data.get('filters', {})  
        
#         template = ReportTemplates.objects.select_related('parent_report').get(id=template_id)
        
#         selected_columns = list(
#             TemplateColumns.objects.filter(template_id=template_id)
#             .values('column_name', 'label')
#         )
        
#         column_names = [col['column_name'] for col in selected_columns]
#         labels = {col['column_name']: col['label'] for col in selected_columns}
        
#         full_data = load_task_report()
        
#         report_id = template.parent_report.id  
#         report = next((r for r in full_data if r.get('id') == report_id), None)
        
#         if not report:
#             return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
#      # Extract and parse from/to dates
#         from_date_str, to_date_str = selected_filters.get('from_to_date', [None, None])

       
#         from_date = datetime.strptime(from_date_str, "%Y-%m-%d") if from_date_str else None
#         to_date = datetime.strptime(to_date_str, "%Y-%m-%d") if to_date_str else None

#         # Apply all filters including date range
#         filtered_rows = [
#             {key: row.get(key, None) for key in column_names if key in row}
#             for row in report["rows"]
#             if all(
#                 value_matches(row.get(field), value)
#                 for field, value in selected_filters.items()
#                 if value and field != 'from_to_date'
#             ) and (
#                 (not from_date or datetime.strptime(row.get('transaction_date', ''), "%Y-%m-%d") >= from_date) and
#                 (not to_date or datetime.strptime(row.get('transaction_date', ''), "%Y-%m-%d") <= to_date)
#             )
#         ]

#         if not filtered_rows:
#             return Response({"error": "No records found for the given filters"}, status=status.HTTP_404_NOT_FOUND)
        
#         return Response({
#             "template_id": template.id,
#             "template_name": template.name,
#             "report_name": template.parent_report.report_name,
#             "columns": [col['label'] for col in selected_columns], 
#             "data": filtered_rows  
#         }, status=status.HTTP_200_OK)

#     except ReportTemplates.DoesNotExist:
#         return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def value_matches(row_value, filter_value):

    if isinstance(filter_value, list):
        return row_value in filter_value  
    return row_value == filter_value

@api_view(['POST'])
# def get_template_report_data(request):
#     try:
        
#         data = request.data
#         template_id = data.get('template_id')
#         selected_filters = data.get('filters', {}) 
#         try: 
#          template = ReportTemplateMaster.objects.select_related('parent_report').get(id=template_id)
#         except:
#             return Response({"error": f"Template with id {template_id} not found".format(template_id)}, status=status.HTTP_404_NOT_FOUND)
#         template_detail = ReportTemplateDetails.objects.filter(template=template).first()
#         if not template_detail or not isinstance(template_detail.data, dict):
#             return Response({"error": "Template data not found."}, status=status.HTTP_404_NOT_FOUND)
#         template_data = model_to_dict(template_detail)
#         selected_columns = template_detail.data.get('columns', [])
#         column_names = [col['column_name'] for col in selected_columns]
#         labels = {col['column_name']: col['label'] for col in selected_columns}
        
#         full_data = load_task_report()
#         report_id = template.parent_report.id  
#         report = next((r for r in full_data if r.get('id') == report_id), None)
        
#         if not report:
#             return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
 
#         from_date_str, to_date_str = selected_filters.get('from_to_date', [None, None])
       
#         from_date = datetime.strptime(from_date_str, "%Y-%m-%d") if from_date_str else None
#         to_date = datetime.strptime(to_date_str, "%Y-%m-%d") if to_date_str else None

#         filtered_rows = [
#             {key: row.get(key, None) for key in column_names if key in row}
#             for row in report["rows"]
#             if all(
#                 value_matches(row.get(field), value)
#                 for field, value in selected_filters.items()
#                 if value and field != 'from_to_date'
#             ) and (
#                 (not from_date or datetime.strptime(row.get('transaction_date', ''), "%Y-%m-%d") >= from_date) and
#                 (not to_date or datetime.strptime(row.get('transaction_date', ''), "%Y-%m-%d") <= to_date)
#             )
#         ]

#         if not filtered_rows:
#             return Response({"error": "No records found for the given filters"}, status=status.HTTP_404_NOT_FOUND)
        
#         return Response({
#             "template_id": template.id,
#             "template_name": template.name,
#             "report_name": template.parent_report.report_name,
#             "columns":  [labels.get(col, col) for col in column_names],
#             "data": filtered_rows  
#         }, status=status.HTTP_200_OK)

#     except ReportTemplateMaster.DoesNotExist:
#         return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_template_report_data(request):
    try:
        
        data = request.data
        template_id = data.get('template_id')
        report_id = data.get('report_id')
        selected_filters = data.get('filters', {}) 
        full_data = load_task_report()
        if template_id:
            try: 
             template = ReportTemplateMaster.objects.select_related('parent_report').get(id=template_id)
            except:
                return Response({"error": f"Template with id {template_id} not found".format(template_id)}, status=status.HTTP_404_NOT_FOUND)
            report_id = template.parent_report.id  
            template_detail = ReportTemplateDetails.objects.filter(template=template).first()
            if not template_detail or not isinstance(template_detail.data, dict):
                return Response({"error": "Template data not found."}, status=status.HTTP_404_NOT_FOUND)
        
            selected_columns = template_detail.data.get('columns', [])
            column_names = [col['column_name'] for col in selected_columns]
            labels = {col['column_name']: col['label'] for col in selected_columns}
        elif report_id:
            report_id = int(report_id)
            report = next((r for r in full_data if r.get('id') == report_id), None)
            if not report:
                return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
            
            column_names = [col["column_name"] for col in report["columns"]]
            labels = {col["column_name"]: col["label"] for col in report["columns"]}
            template = None 
        else:
            return Response({"error": "Either template_id or report_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        report = next((r for r in full_data if r.get('id') == report_id), None)
        if not report:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
 
        from_date_str, to_date_str = selected_filters.get('from_to_date', [None, None])
       
        from_date = datetime.strptime(from_date_str, "%Y-%m-%d") if from_date_str else None
        to_date = datetime.strptime(to_date_str, "%Y-%m-%d") if to_date_str else None

        filtered_rows = [
            {key: row.get(key, None) for key in column_names if key in row}
            for row in report["rows"]
            if all(
                value_matches(row.get(field), value)
                for field, value in selected_filters.items()
                if value and field != 'from_to_date'
            ) and (
                (not from_date or datetime.strptime(row.get('transaction_date', ''), "%Y-%m-%d") >= from_date) and
                (not to_date or datetime.strptime(row.get('transaction_date', ''), "%Y-%m-%d") <= to_date)
            )
        ]
       
        if not filtered_rows:
            return Response({"error": "No records found for the given filters"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "template_id": template.id if template else None,
            "template_name": template.name if template else None,
            "report_name": template.parent_report.report_name if template else report["name"],
            "columns": [labels[field] for field in column_names if field in labels],
            "data": filtered_rows
        },status=status.HTTP_200_OK)

    except ReportTemplateMaster.DoesNotExist:
        return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
