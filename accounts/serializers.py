
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model, authenticate
from .models import CustomUser, EngineeringSpecialization

class EngineeringSpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineeringSpecialization
        fields = ('id', 'name', 'code', 'description')

class CustomUserSerializer(serializers.ModelSerializer):
    specialization = EngineeringSpecializationSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'specialization', 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    specialization = serializers.PrimaryKeyRelatedField(
        queryset=EngineeringSpecialization.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = ('email', 'first_name', 'last_name', 'password', 'password2', 'role', 'specialization')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if attrs.get('role') == 'student' and not attrs.get('specialization'):
            raise serializers.ValidationError({"specialization": "Specialization is required for students."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user
