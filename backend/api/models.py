from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('agent', 'Field Agent'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='agent')

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Field(models.Model):
    STAGE_CHOICES = [
        ('planted', 'Planted'),
        ('growing', 'Growing'),
        ('ready', 'Ready'),
        ('harvested', 'Harvested'),
    ]

    name = models.CharField(max_length=100)
    crop_type = models.CharField(max_length=100)
    planting_date = models.DateField()
    current_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='planted')
    assigned_agent = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_fields'
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_fields'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def status(self):
        """
        Computed field status:
        - Completed: stage is 'harvested'
        - At Risk: stuck in early stage > 90 days, or no updates in 30+ days
        - Active: everything else
        """
        today = timezone.now().date()
        days_since_planting = (today - self.planting_date).days

        if self.current_stage == 'harvested':
            return 'completed'

        last_update = self.updates.order_by('-created_at').first()
        if last_update:
            days_since_update = (timezone.now() - last_update.created_at).days
            if days_since_update > 30:
                return 'at_risk'

        if self.current_stage in ('planted', 'growing') and days_since_planting > 90:
            return 'at_risk'

        return 'active'

    def __str__(self):
        return self.name


class FieldUpdate(models.Model):
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='updates')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='field_updates')
    new_stage = models.CharField(max_length=20, choices=Field.STAGE_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.field.name} -> {self.new_stage} by {self.agent.username}"
