from rest_framework import serializers
from .models import ReportPermission
from .utils import encode_id

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
    role_id = serializers.SerializerMethodField()
    report_id = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()

    class Meta:
        model = ReportPermission
        fields = ['id', 'role_id', 'role_name', 'report_id', 'report_name', 'columns']

    def get_id(self, obj):
        return encode_id(obj.id)

    def get_role_id(self, obj):
        return encode_id(obj.role_id)

    def get_report_id(self, obj):
        return encode_id(obj.report_id)
    
    