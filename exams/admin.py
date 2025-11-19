
from django.contrib import admin
from .models import Exam, Question, QuestionOption, QuestionBank

class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 1

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'exam', 'question_type', 'points', 'order_index')
    list_filter = ('question_type', 'exam__specialization')
    search_fields = ('question_text', 'exam__title')
    inlines = [QuestionOptionInline]

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'specialization', 'duration_minutes', 'total_points', 'created_at')
    list_filter = ('specialization', 'instructor', 'enable_proctoring')
    search_fields = ('title', 'description', 'instructor__email')
    readonly_fields = ('total_points',)

@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ('name', 'instructor', 'specialization', 'topic', 'difficulty_level')
    list_filter = ('specialization', 'instructor', 'difficulty_level')
    search_fields = ('name', 'description', 'topic')

