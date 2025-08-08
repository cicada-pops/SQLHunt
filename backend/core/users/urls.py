from django.urls import include, path

from . import views

urlpatterns = [
    path(
        "api/",
        include(
            [
                path("userprogress/", views.get_user_progress, name="user_progress"),
                path(
                    "cases/",
                    include(
                        [
                            path("", views.get_case_list, name="case_list"),
                            path(
                                "<int:case_id>/",
                                include(
                                    [
                                        path(
                                            "schema/",
                                            views.schema_view,
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
