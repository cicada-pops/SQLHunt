from django.db import connections
from users.models import AvailableTable


def get_schema(case_id):

    allowed_tables = AvailableTable.objects.filter(case_id=case_id).values_list('table', flat=True)

    schema = []

    with connections['investigations'].cursor() as cursor:
        for table in allowed_tables:
            cursor.execute("""
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
            """, [table, table, table])
            columns_raw = cursor.fetchall()

            cursor.execute("""
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
            """, [table])
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

            columns = []
            for col in columns_raw:
                columns.append({
                    "name": col[0],
                    "type": col[1],
                    "isPrimary": col[2],
                    "isForeign": col[3] or col[0] in foreign_columns,
                })

            schema.append({
                "tableName": table,
                "columns": columns,
                "foreignKeys": foreign_keys,
            })

    return schema
