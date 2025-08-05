SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname IN ('users_db', 'investigations_db', 'auth_db'); 