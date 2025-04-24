"""
python manage.py makemigrations
python manage.py migrate
"""


# #create template

# @api_view(['POST'])
# def create_report_template(request):
#     try:
#         data = request.data
#         parent_report_id = data.get('parent_report_id')
#         template_name = data.get('template_name')
#         selected_columns = data.get('columns', [])  # List of strings

#         if not (parent_report_id and template_name and selected_columns):
#             return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

#         report = Report.objects.get(id=parent_report_id)

#         if report.template_count >= 5:
#             return Response({"error": "Max subreports reached"}, status=status.HTTP_403_FORBIDDEN)

#         with transaction.atomic():
#             template = ReportTemplate.objects.create(
#                 name=template_name,
#                 parent_report_id=parent_report_id
#             )
#             TemplateColumn.objects.bulk_create([
#                 TemplateColumn(template_id=template.id, column_name=col) for col in selected_columns
#             ])
#             report.template_count += 1
#             report.save()

#         return Response({"message": "Template created successfully"}, status=status.HTTP_201_CREATED)

#     except Report.DoesNotExist:
#         return Response({"error": "Parent report not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # list template
# @api_view(['GET'])
# def list_report_templates(request):
#     try:
#         templates = ReportTemplate.objects.select_related('parent_report').all()
#         result = []

#         for template in templates:
#             columns = TemplateColumn.objects.filter(template_id=template.id).values_list('column_name', flat=True)
#             result.append({
#                 "template_id": template.id,
#                 "template_name": template.name,
#                 "parent_report": {
#                     "id": template.parent_report.id,
#                     "name": template.parent_report.name
#                 },
#                 "columns": list(columns)
#             })

#         return Response(result, status=status.HTTP_200_OK)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # delete template
# @api_view(['DELETE'])
# def delete_template(request, template_id):
#     try:
#         template = ReportTemplate.objects.get(id=template_id)
#         report = template.parent_report

#         with transaction.atomic():
#             TemplateColumn.objects.filter(template_id=template.id).delete()
#             template.delete()

#             # Decrease template_count in parent report
#             if report.template_count > 0:
#                 report.template_count -= 1
#                 report.save()

#         return Response({"message": "Template deleted"}, status=status.HTTP_200_OK)
#     except ReportTemplate.DoesNotExist:
#         return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # edit template
# @api_view(['PUT'])
# def update_template(request, template_id):
#     try:
#         data = request.data
#         new_columns = data.get('columns', [])  # New list of column names

#         if not new_columns:
#             return Response({"error": "No columns provided"}, status=status.HTTP_400_BAD_REQUEST)

#         if not ReportTemplate.objects.filter(id=template_id).exists():
#             return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)

#         with transaction.atomic():
#             TemplateColumn.objects.filter(template_id=template_id).delete()
#             TemplateColumn.objects.bulk_create([
#                 TemplateColumn(template_id=template_id, column_name=col) for col in new_columns
#             ])

#         return Response({"message": "Template updated"}, status=status.HTTP_200_OK)

#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




