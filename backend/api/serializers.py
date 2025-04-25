from rest_framework import serializers
from .models import ReportPermission,TemplateColumns,ReportTemplates,Reports
class ColumnSerializer(serializers.Serializer):
    column = serializers.CharField()
    is_selected = serializers.BooleanField()


class ReportPermissionSerializer(serializers.Serializer):
    report_id = serializers.IntegerField(required=True)
    report_name = serializers.CharField(required=True)
    role_id = serializers.IntegerField(required=True)
    role_name = serializers.CharField(required=True)
    all_fields = ColumnSerializer(many=True,required=True)

class ReportPermissionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportPermission
        fields = ['report_id', 'report_name', 'columns']

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ['id','report_name']
    
class ReportTemplateColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateColumns
        fields = ['column_name']

class ReportTemplatesSerializer(serializers.ModelSerializer):
    parent_report = ReportSerializer()
    template = ReportTemplateColumnSerializer(many=True)
    class Meta:
        model = ReportTemplates
        fields = ['id','name','parent_report','template']

    def get_columns(self, obj):
        return TemplateColumns.objects.filter(template=obj).values_list('column_name', flat=True)