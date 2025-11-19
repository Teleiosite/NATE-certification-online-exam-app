
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExamViewSet, QuestionViewSet, QuestionBankViewSet

router = DefaultRouter()
router.register(r'exams', ExamViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'question-banks', QuestionBankViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
