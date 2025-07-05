from django.urls import include, path

from . import views

urlpatterns = [
    path('api/cases/', 
         include(
            [   
                path('', views.get_case_list, name='case_list'),
                path("<str:task_id>/", views.TaskStatusView.as_view(), name="task_status"),
               
                path('<int:case_id>/' , 
                     include(
                        [
                            path('schema/', views.schema_view, name='case_schema'),
                            path("execute-sql/", views.ExecuteSQLView.as_view(), name="execute_sql"),
                            path("submit-answer/", views.SubmitAnswerView.as_view(), name="submit_answer"),
                        ]
                    )
                ),
            ]
        ),
    )
]


