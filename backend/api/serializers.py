from rest_framework import serializers
from .models import ReportPermission

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

    
