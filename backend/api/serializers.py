from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, Field, FieldUpdate


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False, default='agent')

    class Meta:
        model = User
        fields = ["id", "username", "password", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        role = validated_data.pop('role', 'agent')
        user = User.objects.create_user(**validated_data)
        # Use update_or_create to handle any existing profile
        Profile.objects.update_or_create(
            user=user,
            defaults={'role': role}
        )
        return user

class UserBasicSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "role"]

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            return 'agent'


class FieldUpdateSerializer(serializers.ModelSerializer):
    agent_username = serializers.CharField(source='agent.username', read_only=True)

    class Meta:
        model = FieldUpdate
        fields = ["id", "field", "agent", "agent_username", "new_stage", "notes", "created_at"]
        extra_kwargs = {
            "agent": {"read_only": True},
            "field": {"read_only": True},
        }


class FieldSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    assigned_agent_username = serializers.CharField(
        source='assigned_agent.username', read_only=True
    )
    updates = FieldUpdateSerializer(many=True, read_only=True)
    last_update = serializers.SerializerMethodField()

    class Meta:
        model = Field
        fields = [
            "id", "name", "crop_type", "planting_date", "current_stage",
            "status", "assigned_agent", "assigned_agent_username",
            "created_by", "created_at", "updated_at", "updates", "last_update"
        ]
        extra_kwargs = {"created_by": {"read_only": True}}

    def get_last_update(self, obj):
        update = obj.updates.first()
        if update:
            return FieldUpdateSerializer(update).data
        return None


class FieldListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested updates)."""
    status = serializers.ReadOnlyField()
    assigned_agent_username = serializers.CharField(
        source='assigned_agent.username', read_only=True
    )

    class Meta:
        model = Field
        fields = [
            "id", "name", "crop_type", "planting_date", "current_stage",
            "status", "assigned_agent", "assigned_agent_username",
            "created_at", "updated_at"
        ]
