
import uuid
from django.db import models
from django.conf import settings
from accounts.models import EngineeringSpecialization

class Exam(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exams')
    specialization = models.ForeignKey(EngineeringSpecialization, on_delete=models.PROTECT, related_name='exams')
    total_points = models.IntegerField(default=0, help_text="Total points for the exam, calculated from questions.")
    duration_minutes = models.IntegerField()
    retake_limit = models.IntegerField(default=1)
    randomize_questions = models.BooleanField(default=False)
    randomize_answers = models.BooleanField(default=False)
    allow_review_before_submit = models.BooleanField(default=True)
    allow_review_after_submit = models.BooleanField(default=True)
    show_answers_after_submit = models.BooleanField(default=False)
    enable_proctoring = models.BooleanField(default=False)
    enable_camera = models.BooleanField(default=False)
    browser_lockdown = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['instructor']),
            models.Index(fields=['specialization']),
        ]

    def __str__(self):
        return self.title

class Question(models.Model):
    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = 'multiple_choice', 'Multiple Choice'
        MULTIPLE_SELECT = 'multiple_select', 'Multiple Select'
        SHORT_ANSWER = 'short_answer', 'Short Answer'
        ESSAY = 'essay', 'Essay'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    points = models.DecimalField(max_digits=5, decimal_places=2)
    explanation = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    order_index = models.IntegerField()
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['exam', 'order_index']
        indexes = [
            models.Index(fields=['exam']),
        ]

    def __str__(self):
        return f"Q{self.order_index}: {self.question_text[:50]}..."

class QuestionOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    option_image_url = models.URLField(blank=True)
    is_correct = models.BooleanField()
    partial_credit_points = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    order_index = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['question', 'order_index']

    def __str__(self):
        return self.option_text

class QuestionBank(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_banks')
    specialization = models.ForeignKey(EngineeringSpecialization, on_delete=models.CASCADE, related_name='question_banks')
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    topic = models.CharField(max_length=100, blank=True)
    difficulty_level = models.CharField(max_length=10, choices=Difficulty.choices, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
