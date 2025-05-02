from rest_framework import serializers
from .models import ReportPermission,TemplateColumns,ReportTemplates,Reports,ReportColumns,ReportFilters,TemplateFilters,TemplateDetails,TemplateMaster
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

class ReportColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportColumns
        fields = ['column_name','label']
        
class ReportFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportFilters
        fields = ['id','report_id','filter_name','filter_label','exist_in_report','is_compulsory','filter_type']
        
class ReportSerializer(serializers.ModelSerializer):
    report_columns = ReportColumnSerializer(many=True)
    report_filters = ReportFilterSerializer(many =True)
    class Meta:
        model = Reports
        fields = ['id','report_name','report_columns','report_filters']
    
class ReportTemplateColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateColumns
        fields = ['column_name','label']
        
class TemplateDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateDetails
        fields = ['field_type','field_name','field_label']
        
class ReportTemplateFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateFilters
        fields = ['filter_name','filter_label']
        
class ReportTemplatesSerializer(serializers.ModelSerializer):
    
    parent_report = ReportSerializer()
    fields = TemplateDetailsSerializer(many=True)
    # template_filter = ReportTemplateFilterSerializer(many=True)
    
    class Meta:
        model = TemplateMaster
        fields = ['id','name','parent_report','fields']

    def get_columns(self, obj):
        return TemplateColumns.objects.filter(template=obj).values_list('column_name', flat=True)