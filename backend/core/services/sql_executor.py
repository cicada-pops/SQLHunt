import re

import sqlparse
from core.users.models import AvailableTable
from django.db import connections
from sqlglot import exp, parse
from sqlparse.tokens import DML, Keyword

FORBIDDEN_KEYWORDS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "REPLACE",
    "GRANT",
    "REVOKE",
    "INTO",
    "MERGE",
    "CALL",
    "EXEC",
}

FORBIDDEN_PATTERNS = [
    r"--",
    r"/\*.*\*/",
    r";",
    r"\bRECURSIVE\b",
    r"\bINTO\b",
]


def has_limit(token_list) -> bool:
    for token in token_list.tokens:
        if token.ttype is Keyword and token.value.upper() == "LIMIT":
            return True
        elif token.is_group:
            if has_limit(token):
                return True
    return False


def extract_tables(sql: str) -> set[str]:
    try:
        expressions = parse(sql)
        tables = set()
        for tree in expressions:
            tables.update(
                t.name
                for t in tree.find_all(exp.Table)
                if t and t.name  # type: ignore
            )
        return tables
    except Exception:
        return set()


def contains_forbidden_keywords(token_list) -> bool:
    for token in token_list.tokens:
        if token.ttype in (Keyword, DML) and token.value.upper() in FORBIDDEN_KEYWORDS:
            return True
        elif token.is_group:
            if contains_forbidden_keywords(token):
                return True
    return False


def contains_forbidden_patterns(raw_sql: str) -> bool:
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, raw_sql, flags=re.IGNORECASE | re.DOTALL):
            return True
    return False


def validate_and_prepare_query(raw_sql: str, allowed_user_tables: set[str]) -> str:
    cleaned_sql = (
        sqlparse.format(raw_sql.strip(), strip_comments=True).strip().rstrip(";")
    )
    parsed = sqlparse.parse(cleaned_sql)

    if not parsed:
        raise ValueError("Пустой или некорректный SQL-запрос.")

    statement = parsed[0]

    if statement.get_type() != "SELECT":
        raise ValueError("Разрешён только SELECT-запрос.")

    if contains_forbidden_patterns(cleaned_sql):
        raise ValueError("Запрос содержит запрещённые конструкции.")

    if contains_forbidden_keywords(statement):
        raise ValueError("Запрос содержит запрещённые SQL-операции.")

    tables_in_query = extract_tables(cleaned_sql)
    for table in tables_in_query:
        if table is None:
            continue
        if table not in allowed_user_tables:
            raise ValueError(f"Доступ к таблице '{table}' в этом кейсе запрещён.")

    if not has_limit(statement):
        cleaned_sql += " LIMIT 1000"

    return cleaned_sql


def run_validated_sql_query(user_id: int, case_id: int, raw_sql: str) -> dict:
    allowed_tables = set(
        AvailableTable.objects.filter(case_id=case_id).values_list("table", flat=True)
    )

    try:
        validated_sql = validate_and_prepare_query(raw_sql, allowed_tables)
    except Exception as e:
        return {"error": str(e)}

    try:
        with connections["investigations"].cursor() as cursor:
            cursor.execute(validated_sql)
            columns = [col[0] for col in cursor.description]  # type: ignore
            rows = cursor.fetchall()
            return {"columns": columns, "rows": rows}
    except Exception as e:
        return {"error": str(e)}
