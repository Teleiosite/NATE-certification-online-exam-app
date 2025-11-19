
from rest_framework import serializers
from .models import ExamAssignment, StudentResponse, SuspiciousActivity, AuditLog
from accounts.serializers import CustomUserSerializer
from exams.serializers import ExamDetailSerializer

class StudentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentResponse
        fields = ('id', 'assignment', 'question', 'selected_option', 'is_correct', 'points_awarded')

class ExamAssignmentSerializer(serializers.ModelSerializer):
    student = CustomUserSerializer(read_only=True)
    exam = ExamDetailSerializer(read_only=True)
    responses = StudentResponseSerializer(many=True, read_only=True)

    class Meta:
        model = ExamAssignment
        fields = ('id', 'student', 'exam', 'start_time', 'end_time', 'score', 'is_completed', 'responses')

class SuspiciousActivitySerializer(serializers.ModelSerializer):
    assignment = ExamAssignmentSerializer(read_only=True)

    class Meta:
        model = SuspiciousActivity
        fields = ('id', 'assignment', 'activity_type', 'timestamp', 'details', 'severity')

class AuditLogSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
