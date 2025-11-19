
from rest_framework import serializers
from .models import Exam, Question, QuestionOption, QuestionBank
from accounts.serializers import EngineeringSpecializationSerializer, CustomUserSerializer

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ('id', 'option_text', 'is_correct')

class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'question_text', 'question_type', 'points', 'options')

class ExamListSerializer(serializers.ModelSerializer):
    specialization = EngineeringSpecializationSerializer(read_only=True)
    instructor = CustomUserSerializer(read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ('id', 'title', 'specialization', 'duration_minutes', 'total_points', 'question_count', 'instructor')
    
    def get_question_count(self, obj):
        return obj.questions.count()

class ExamDetailSerializer(serializers.ModelSerializer):
    specialization = EngineeringSpecializationSerializer(read_only=True)
    instructor = CustomUserSerializer(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = '__all__'

class QuestionBankSerializer(serializers.ModelSerializer):
    specialization = EngineeringSpecializationSerializer(read_only=True)
    instructor = CustomUserSerializer(read_only=True)

    class Meta:
        model = QuestionBank
        fields = '__all__'
