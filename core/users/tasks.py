from celery_app import app

from services.sql_executor import run_validated_sql_query


@app.task()
def execute_safe_sql(user_id, case_id, raw_sql):
    try:
        result = run_validated_sql_query(user_id, case_id, raw_sql)
        return result  
    except Exception as e:
        return {"error": str(e)}
