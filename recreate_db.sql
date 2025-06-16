DROP DATABASE IF EXISTS users_db;
DROP DATABASE IF EXISTS investigations_db;
DROP DATABASE IF EXISTS auth_db;
DROP DATABASE IF EXISTS celery_results;

CREATE DATABASE users_db OWNER sqlhunt;
CREATE DATABASE investigations_db OWNER sqlhunt;
CREATE DATABASE auth_db OWNER sqlhunt;
CREATE DATABASE celery_results OWNER sqlhunt;

GRANT ALL PRIVILEGES ON DATABASE users_db TO sqlhunt;
GRANT ALL PRIVILEGES ON DATABASE investigations_db TO sqlhunt;
GRANT ALL PRIVILEGES ON DATABASE auth_db TO sqlhunt;
GRANT ALL PRIVILEGES ON DATABASE celery_results TO sqlhunt;
GRANT ALL ON SCHEMA public TO sqlhunt; 