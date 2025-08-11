from core.users.models import AvailableTable
from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import connections


def get_schema(case_id):
    """
    Get the database schema for tables available to a specific case.

    Args:
        case_id: The ID of the case to get the schema for.

    Returns:
        A list of dictionaries containing table schema information.

    Raises:
        ObjectDoesNotExist: If no available tables are found for the case.
    """
    try:
        allowed_tables = list(
            AvailableTable.objects.filter(case_id=case_id).values_list(
                "table", flat=True
            )
        )
        if not allowed_tables:
            raise ObjectDoesNotExist(f"No available tables found for case {case_id}")

        schema = []

        with connections["investigations"].cursor() as cursor:
            for table in allowed_tables:
                cursor.execute(
                    """
                    SELECT 
                        c.column_name, 
                        c.data_type,
                        EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                              ON tc.constraint_name = kcu.constraint_name
                            WHERE tc.table_name = %s
                              AND kcu.column_name = c.column_name
                              AND tc.constraint_type = 'PRIMARY KEY'
                        ) AS is_primary,
                        EXISTS (
                            SELECT 1
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                              ON tc.constraint_name = kcu.constraint_name
                            WHERE tc.table_name = %s
                              AND kcu.column_name = c.column_name
                              AND tc.constraint_type = 'FOREIGN KEY'
                        ) AS is_foreign
                    FROM information_schema.columns c
                    WHERE c.table_name = %s;
                """,
                    [table, table, table],
                )
                columns_raw = cursor.fetchall()

                cursor.execute(
                    """
                    SELECT
                        kcu.column_name AS from_column,
                        ccu.table_name AS to_table,
                        ccu.column_name AS to_column
                    FROM 
                        information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                    WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name = %s;
                """,
                    [table],
                )
                fkeys_raw = cursor.fetchall()

                foreign_keys = [
                    {
                        "fromColumn": fk[0],
                        "toTable": fk[1],
                        "toColumn": fk[2],
                    }
                    for fk in fkeys_raw
                ]
                foreign_columns = {fk["fromColumn"] for fk in foreign_keys}

                investigations_app = apps.get_app_config("investigations")
                investigations_models = investigations_app.get_models()

                model = None
                for m in investigations_models:
                    if m._meta.db_table == table:
                        model = m
                        break

                model_fields_help = {}
                if model:
                    for field in model._meta.fields:
                        help_text = field.help_text or ""
                        model_fields_help[field.name] = help_text
                        model_fields_help[field.column] = help_text

                columns = []
                for col in columns_raw:
                    columns.append(
                        {
                            "name": col[0],
                            "type": col[1],
                            "isPrimary": col[2],
                            "isForeign": col[3] or col[0] in foreign_columns,
                            "help_text": model_fields_help.get(col[0], ""),
                        }
                    )

                schema.append(
                    {
                        "tableName": table,
                        "columns": columns,
                        "foreignKeys": foreign_keys,
                    }
                )

        return schema
