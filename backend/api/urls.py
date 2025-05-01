from django.urls import path

from .views import get_all_reports,get_templates,get_report_columns,get_all_reports_with_columns,create_report_template,update_template,delete_template,get_template_report_data,get_filter_options

urlpatterns = [
    # path('report_permissions/', set_report_permissions),
    # path('all_permissions/', get_report_permissions),
    # path('show_report_permission/<str:role_id>/', show_report_permission),

    path('get-all-reports/', get_all_reports),
    path('get-all-columns/<int:report_id>/', get_report_columns),
    path('get-reports/', get_all_reports_with_columns),
    path('create-template/', create_report_template),
    path('get-templates/', get_templates),
    path('update-template/',update_template),
    path('delete-template/',delete_template),
    path('create-sub-report/',get_template_report_data),
    path('get-filter-values/',get_filter_options)
    
]
