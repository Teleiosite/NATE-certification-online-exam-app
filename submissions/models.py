
import uuid
from django.db import models
from django.conf import settings
from exams.models import Exam, Question

class ExamAssignment(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Not Started'
        IN_PROGRESS = 'in_progress', 'In Progress'
        SUBMITTED = 'submitted', 'Submitted'
        GRADED = 'graded', 'Graded'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='assignments')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    question_randomization_seed = models.CharField(max_length=255, blank=True)
    time_taken_seconds = models.IntegerField(null=True, blank=True)
    retake_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('exam', 'student')
        ordering = ['-assigned_at']
        indexes = [
            models.Index(fields=['exam', 'student']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.student}'s assignment for {self.exam}"

class StudentResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_assignment = models.ForeignKey(ExamAssignment, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='responses')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='responses')
    answer_text = models.TextField(null=True, blank=True)
    answer_options = models.JSONField(default=list, blank=True)
    is_flagged = models.BooleanField(default=False)
    is_answered = models.BooleanField(default=False)
    auto_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    manual_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    instructor_feedback = models.TextField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('exam_assignment', 'question')
        ordering = ['created_at']

    def __str__(self):
        return f"Response by {self.student} to {self.question}"

class SuspiciousActivity(models.Model):
    class ActivityType(models.TextChoices):
        TAB_SWITCH = 'tab_switch', 'Tab Switch'
        RIGHT_CLICK = 'right_click', 'Right Click'
        DEVTOOLS_OPEN = 'devtools_open', 'DevTools Opened'
        COPY_ATTEMPT = 'copy_attempt', 'Copy Attempt'
        PASTE_ATTEMPT = 'paste_attempt', 'Paste Attempt'
        IP_CHANGE = 'ip_change', 'IP Address Change'
        RAPID_ANSWERS = 'rapid_answers', 'Rapid Answering'
        ANSWER_MODIFICATION = 'answer_modification', 'Answer Modification'
        MULTIPLE_LOGINS = 'multiple_logins', 'Multiple Logins'
        POSSIBLE_COLLUSION = 'possible_collusion', 'Possible Collusion'

    class Severity(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam_assignment = models.ForeignKey(ExamAssignment, on_delete=models.CASCADE, related_name='suspicious_activities')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='suspicious_activities')
    activity_type = models.CharField(max_length=30, choices=ActivityType.choices)
    severity = models.CharField(max_length=10, choices=Severity.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    instructor_reviewed = models.BooleanField(default=False)
    action_taken = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['exam_assignment']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['severity']),
        ]

    def __str__(self):
        return f"{self.get_activity_type_display()} by {self.student}"

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=100)
    entity_id = models.UUIDField()
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        return f"{self.action} on {self.entity_type} {self.entity_id} by {self.user}"
