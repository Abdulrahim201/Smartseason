from django.contrib.auth.models import User
from django.db.models import Count, Q
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Profile, Field, FieldUpdate
from .serializers import (
    UserSerializer, UserBasicSerializer,
    FieldSerializer, FieldListSerializer, FieldUpdateSerializer
)


# ── Permissions helpers ────────────────────────────────────────────────────────

def is_admin(user):
    try:
        return user.profile.role == 'admin'
    except Profile.DoesNotExist:
        return False


# ── Auth / Users ───────────────────────────────────────────────────────────────

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "User created successfully"},
            status=status.HTTP_201_CREATED
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserBasicSerializer(request.user)
        return Response(serializer.data)


class AgentListView(generics.ListAPIView):
    """Admin only: list all field agents."""
    serializer_class = UserBasicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return User.objects.none()
        return User.objects.filter(profile__role='agent')


# ── Fields ─────────────────────────────────────────────────────────────────────

class FieldListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return FieldListSerializer
        return FieldSerializer

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Field.objects.all().order_by('-created_at')
        return Field.objects.filter(assigned_agent=user).order_by('-created_at')

    def perform_create(self, serializer):
        if not is_admin(self.request.user):
            raise PermissionError("Only admins can create fields.")
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": "Only admins can create fields."}, status=403)
        return super().create(request, *args, **kwargs)


class FieldDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FieldSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if is_admin(user):
            return Field.objects.all()
        return Field.objects.filter(assigned_agent=user)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": "Only admins can edit field details."}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": "Only admins can delete fields."}, status=403)
        return super().destroy(request, *args, **kwargs)


# ── Field Updates ──────────────────────────────────────────────────────────────

class FieldUpdateCreateView(generics.CreateAPIView):
    serializer_class = FieldUpdateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        field_id = self.kwargs['field_id']
        user = request.user

        try:
            if is_admin(user):
                field = Field.objects.get(pk=field_id)
            else:
                field = Field.objects.get(pk=field_id, assigned_agent=user)
        except Field.DoesNotExist:
            return Response({"detail": "Field not found or not assigned to you."}, status=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_stage = serializer.validated_data['new_stage']
        field.current_stage = new_stage
        field.save()

        serializer.save(agent=user, field=field)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FieldUpdateListView(generics.ListAPIView):
    serializer_class = FieldUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        field_id = self.kwargs['field_id']
        user = self.request.user
        if is_admin(user):
            return FieldUpdate.objects.filter(field_id=field_id)
        return FieldUpdate.objects.filter(field_id=field_id, field__assigned_agent=user)


# ── Dashboard ──────────────────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if is_admin(user):
            fields = Field.objects.all()
        else:
            fields = Field.objects.filter(assigned_agent=user)

        total = fields.count()
        stage_breakdown = {}
        status_breakdown = {'active': 0, 'at_risk': 0, 'completed': 0}

        for f in fields:
            stage_breakdown[f.current_stage] = stage_breakdown.get(f.current_stage, 0) + 1
            status_breakdown[f.status] = status_breakdown.get(f.status, 0) + 1

        data = {
            "total_fields": total,
            "stage_breakdown": stage_breakdown,
            "status_breakdown": status_breakdown,
        }

        if is_admin(user):
            data["total_agents"] = User.objects.filter(profile__role='agent').count()
            data["recent_updates"] = FieldUpdateSerializer(
                FieldUpdate.objects.select_related('field', 'agent').order_by('-created_at')[:10],
                many=True
            ).data

        return Response(data)
