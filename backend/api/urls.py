from django.urls import path

from .views import get_all_reports,get_templates,get_report_columns,get_all_reports_with_columns,create_report_template,update_template

urlpatterns = [
    # path('report_permissions/', set_report_permissions),
    # path('all_permissions/', get_report_permissions),
    # path('show_report_permission/<str:role_id>/', show_report_permission),

    path('get-all-reports/', get_all_reports),
    path('get-all-columns/<int:report_id>/', get_report_columns),
    path('get-reports/', get_all_reports_with_columns),
    path('create-template/', create_report_template),
    path('get-templates/', get_templates),
    path('update-template/<int:template_id>/',update_template)
]
