import re

from celery import shared_task
from sqlglot import exp, parse_one


def extract_tables(sql: str) -> set:
    try:
        parsed = parse_one(sql)
        return {t.name for t in parsed.find_all(exp.Table)}
    except Exception:
        return set()

def is_query_safe(sql: str) -> bool:
    sql_upper = sql.strip().upper()
    if not sql_upper.startswith(("SELECT", "WITH")):
        return False
    forbidden_patterns = ["pg_", "information_schema", "auth_user", "django_"]
    return not any(p in sql_upper for p in forbidden_patterns)

def apply_limit(sql: str) -> str:
    sql = sql.strip().rstrip(";")
    if not re.search(r"LIMIT\\s+\\d+", sql, re.IGNORECASE):
        return f"{sql} LIMIT 1000"
    return sql

@shared_task
def execute_safe_sql(user_id, case_id, sql):
    from django.db import connections
    from users.models import AvailableTable

    if not is_query_safe(sql):
        return {"error": "Недопустимый SQL-запрос"}

    tables_used = extract_tables(sql)
    allowed_tables = set(
        AvailableTable.objects.filter(case_id=case_id).values_list("table", flat=True)
    )

    if not tables_used.issubset(allowed_tables):
        return {"error": f"Доступ запрещён к таблицам: {tables_used - allowed_tables}"}

    sql = apply_limit(sql)

    try:
        with connections["investigations"].cursor() as cursor:
            cursor.execute(sql)
            columns = [col[0] for col in cursor.description] # type: ignore
            rows = cursor.fetchall()
            return {"columns": columns, "rows": rows}
    except Exception as e:
        return {"error": str(e)}
