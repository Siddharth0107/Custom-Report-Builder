from django.urls import path
from .views import set_report_permissions
from .views import get_report_permissions
from .views import show_report_permission


urlpatterns = [
    path('report_permissions/', set_report_permissions),
    path('all_permissions/', get_report_permissions),
    path('show_report_permission/<str:role_id>/', show_report_permission),
]
