from django.urls import path
from . import views

urlpatterns = [
    # Fields
    path("fields/", views.FieldListCreateView.as_view(), name="field-list-create"),
    path("fields/<int:pk>/", views.FieldDetailView.as_view(), name="field-detail"),
    # Field updates
    path("fields/<int:field_id>/updates/", views.FieldUpdateListView.as_view(), name="field-updates"),
    path("fields/<int:field_id>/updates/create/", views.FieldUpdateCreateView.as_view(), name="field-update-create"),
    # Dashboard
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    # Users
    path("agents/", views.AgentListView.as_view(), name="agent-list"),
    path("me/", views.CurrentUserView.as_view(), name="current-user"),
]
