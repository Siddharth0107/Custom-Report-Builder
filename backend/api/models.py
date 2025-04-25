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

class Roles(models.Model):
    role_name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

class Reports(models.Model):
    report_name = models.CharField(max_length=200)
    template_count = models.IntegerField(default=0)

class ReportColumns(models.Model):
    report_id = models.ForeignKey(Reports,on_delete=models.CASCADE,related_name='report_columns')
    column_name = models.CharField(max_length=200)
    
class RoleAndReportRelation(models.Model):
    role_id = models.IntegerField()
    report_id= models.IntegerField()

class ReportColumnPermission(models.Model):
    role = models.ForeignKey(Roles, on_delete=models.CASCADE)
    report = models.ForeignKey(Reports, on_delete=models.CASCADE)
    column = models.ForeignKey(ReportColumns, on_delete=models.CASCADE)
    is_selected = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class ReportTemplates(models.Model):
    name = models.CharField(max_length=200)
    parent_report = models.ForeignKey(Reports,on_delete=models.CASCADE,related_name='report_templates')
    timestamp = models.DateTimeField(auto_now_add=True)

class TemplateColumns(models.Model):
    # report_id = models.IntegerField()
    template = models.ForeignKey(ReportTemplates,on_delete=models.CASCADE,related_name='template')
    column_name = models.CharField(max_length=200,default='default')
    timestamp = models.DateTimeField(auto_now_add=True)
