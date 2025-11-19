
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import ExamAssignment, StudentResponse, SuspiciousActivity, AuditLog, Exam
from .serializers import (ExamAssignmentSerializer, StudentResponseSerializer, 
                          SuspiciousActivitySerializer, AuditLogSerializer)

class ExamAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ExamAssignment.objects.all()
    serializer_class = ExamAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'instructor':
            return ExamAssignment.objects.filter(exam__instructor=user)
        elif user.role == 'student':
            return ExamAssignment.objects.filter(student=user)
        return ExamAssignment.objects.none()

    @action(detail=True, methods=['post'], url_path='start')
    def start_exam(self, request, pk=None):
        assignment = self.get_object()
        if assignment.start_time:
            return Response({'error': 'Exam already started.'}, status=status.HTTP_400_BAD_REQUEST)
        assignment.start_time = timezone.now()
        assignment.save()
        return Response(self.get_serializer(assignment).data)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit_exam(self, request, pk=None):
        assignment = self.get_object()
        if assignment.is_completed:
            return Response({'error': 'Exam already submitted.'}, status=status.HTTP_400_BAD_REQUEST)
        assignment.end_time = timezone.now()
        assignment.is_completed = True
        assignment.save()
        # Logic for auto-grading can be added here
        return Response(self.get_serializer(assignment).data)

class StudentResponseViewSet(viewsets.ModelViewSet):
    queryset = StudentResponse.objects.all()
    serializer_class = StudentResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return StudentResponse.objects.filter(assignment__student=user)

    def perform_create(self, serializer):
        serializer.save()

class SuspiciousActivityViewSet(viewsets.ModelViewSet):
    queryset = SuspiciousActivity.objects.all()
    serializer_class = SuspiciousActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
