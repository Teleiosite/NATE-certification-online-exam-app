
from rest_framework import viewsets, permissions
from .models import Exam, Question, QuestionBank
from .serializers import ExamListSerializer, ExamDetailSerializer, QuestionBankSerializer, QuestionSerializer

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamListSerializer
        return ExamDetailSerializer

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

class QuestionBankViewSet(viewsets.ModelViewSet):
    queryset = QuestionBank.objects.all()
    serializer_class = QuestionBankSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)
