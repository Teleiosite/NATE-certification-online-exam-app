
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamAssignmentViewSet, 
    StudentResponseViewSet, 
    SuspiciousActivityViewSet, 
    AuditLogViewSet
)

router = DefaultRouter()
router.register(r'assignments', ExamAssignmentViewSet)
router.register(r'responses', StudentResponseViewSet)
router.register(r'suspicious-activity', SuspiciousActivityViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
