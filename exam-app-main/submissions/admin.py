
from django.contrib import admin
from .models import ExamAssignment, StudentResponse, SuspiciousActivity, AuditLog

class StudentResponseInline(admin.TabularInline):
    model = StudentResponse
    extra = 0
    readonly_fields = ('student', 'question', 'answer_text', 'answer_options', 'auto_score', 'manual_score')

@admin.register(ExamAssignment)
class ExamAssignmentAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'status', 'score', 'started_at', 'submitted_at')
    list_filter = ('status', 'exam__specialization')
    search_fields = ('student__email', 'exam__title')
    inlines = [StudentResponseInline]

@admin.register(StudentResponse)
class StudentResponseAdmin(admin.ModelAdmin):
    list_display = ('student', 'question', 'exam_assignment', 'is_answered', 'auto_score', 'manual_score')
    list_filter = ('is_answered', 'is_flagged')
    search_fields = ('student__email', 'question__question_text')

@admin.register(SuspiciousActivity)
class SuspiciousActivityAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam_assignment', 'activity_type', 'severity', 'timestamp')
    list_filter = ('activity_type', 'severity', 'instructor_reviewed')
    search_fields = ('student__email', 'exam_assignment__exam__title')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'entity_type', 'entity_id', 'timestamp')
    list_filter = ('action', 'entity_type', 'user')
    search_fields = ('user__email', 'entity_id')

