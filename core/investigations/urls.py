from django.urls import path

from . import views

urlpatterns = [
    path('api/schema/<int:case_id>/', views.schema_view, name='case_schema'),
    path("api/execute-sql/", views.ExecuteSQLView.as_view(), name="execute_sql"),
    path("api/task-status/<str:task_id>/", views.TaskStatusView.as_view(), name="task_status"),
]

