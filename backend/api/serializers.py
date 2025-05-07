from rest_framework import serializers
from .models import ReportPermission,TemplateColumns,ReportTemplates,Reports,ReportColumns,ReportFilters,TemplateFilters,ReportTemplateDetails,ReportTemplateMaster
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
        fields = ['column_name','label','report_id']
        
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
    
class ReportTemplateDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportTemplateDetails
        fields = ['data']
        
class ReportTemplateFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateFilters
        fields = ['filter_name','filter_label']
        
class ReportTemplatesMasterSerializer(serializers.ModelSerializer):
    parent_report = ReportSerializer()
    # details = ReportTemplateDetailsSerializer(many=True)
    template = serializers.SerializerMethodField()
    template_filter = serializers.SerializerMethodField()
    class Meta:
        model = ReportTemplates
        fields = ['id','name','parent_report','template','template_filter']

    def get_columns(self, obj):
        return TemplateColumns.objects.filter(template=obj).values_list('column_name', flat=True)
    
    def get_template(self, obj):
        if obj.details.exists():
            detail = obj.details.first()
            columns = detail.data.get("columns", [])
            return [{"column_name": col["column_name"], "label": col["label"]} for col in columns]
        return []

    def get_template_filter(self, obj):
        if obj.details.exists():
            detail = obj.details.first()
            filters = detail.data.get("filters", [])
            return [{"filter_name": f["filter_name"], "filter_label": f["filter_label"]} for f in filters]
        return []