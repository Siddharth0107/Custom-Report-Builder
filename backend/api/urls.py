from django.urls import path
from .views import demo_api

urlpatterns = [
    path('demo/', demo_api),
]
