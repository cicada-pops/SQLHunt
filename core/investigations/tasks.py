import re

import sqlparse
from celery_app import app
from django.db import connections
from sqlglot import exp, parse_one
from sqlparse.tokens import DML, Keyword

FORBIDDEN_KEYWORDS = {
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE',
    'REPLACE', 'GRANT', 'REVOKE', 'INTO', 'MERGE', 'CALL'
}

FORBIDDEN_PATTERNS = [
    r'--',                
    r'/\*.*\*/',         
    r';',               
    r'\bWITH\b',         
    r'\bRECURSIVE\b',
    r'\bUNION\b',
    r'\bINTO\b',
]

def has_limit(token_list) -> bool:
    for token in token_list.tokens:
        if token.ttype is Keyword and token.value.upper() == 'LIMIT':
            return True
        elif token.is_group:
            if has_limit(token):
                return True
    return False

def extract_tables(sql: str) -> set:
    try:
        parsed = parse_one(sql)
        return {t.name for t in parsed.find_all(exp.Table)}
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
    cleaned_sql = sqlparse.format(raw_sql.strip(), strip_comments=True).strip().rstrip(';')

    if contains_forbidden_patterns(cleaned_sql):
        raise ValueError("Запрос содержит запрещённые конструкции.")

    parsed = sqlparse.parse(cleaned_sql)
    if not parsed or len(parsed) != 1:
        raise ValueError("Разрешён только один SELECT-запрос.")

    statement = parsed[0]

    if statement.get_type() != 'SELECT':
        raise ValueError("Разрешён только SELECT-запрос.")

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

@app.task() 
def execute_safe_sql(user_id, case_id, sql):
    from users.models import AvailableTable

    allowed_tables = set(
        AvailableTable.objects.filter(case_id=case_id).values_list("table", flat=True)
    )

    try:
        validated_sql = validate_and_prepare_query(sql, allowed_tables)
    except Exception as e:
        return {"error": str(e)}

    try:
        with connections["investigations"].cursor() as cursor:
            cursor.execute(validated_sql)
            columns = [col[0] for col in cursor.description] # type: ignore
            rows = cursor.fetchall()
            return {"columns": columns, "rows": rows}
    except Exception as e:
        return {"error": str(e)}

