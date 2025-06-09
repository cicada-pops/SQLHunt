from django.urls import path

from . import views

urlpatterns = [
    path('api/cases/<int:case_id>/schema/', views.schema_view, name='case_schema'),
    path("api/cases/<int:case_id>/execute-sql/", views.ExecuteSQLView.as_view(), name="execute_sql"),
    path("api/tasks/<str:task_id>/status/", views.TaskStatusView.as_view(), name="task_status"),
    path("api/cases/<int:case_id>/submit-answer/", views.SubmitAnswerView.as_view(), name="submit_answer"),
    path("api/cases/<int:case_id>/", views.get_case_details, name="case_details"),
]


