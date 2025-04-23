from django.db import models
from django.db.models import JSONField  

class ReportPermission(models.Model):
    role_id = models.IntegerField()
    role_name =  models.CharField(max_length = 200)
    report_id = models.IntegerField()
    report_name =  models.CharField(max_length = 200)
    columns = models.JSONField() 
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Role {self.role_id} - Report {self.report_id}"
