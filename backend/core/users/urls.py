from django.urls import include, path

from . import views

urlpatterns = [
    path(
        "api/",
        include(
            [
                path("userprogress/", views.UserProgressListView.as_view(), name="user_progress"),
                path(
                    "cases/",
                    include(
                        [
                            path("", views.CaseListView.as_view(), name="case_list"),
                            path(
                                "<int:case_id>/",
                                include(
                                    [
                                        path(
                                            "schema/",
                                            views.SchemaView.as_view(),
                                            name="case_schema",
                                        ),
                                        path(
                                            "execute-sql/",
                                            views.ExecuteSQLView.as_view(),
                                            name="execute_sql",
                                        ),
                                        path(
                                            "submit-answer/",
                                            views.SubmitAnswerView.as_view(),
                                            name="submit_answer",
                                        ),
                                    ]
                                ),
                            ),
                        ]
                    ),
                ),
                path(
                    "sql-task/<str:task_id>/",
                    views.TaskStatusView.as_view(),
                    name="task_status",
                ),
            ]
        ),
    )
]
