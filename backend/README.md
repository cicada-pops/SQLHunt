# SQL Hunt

## Структура проекта

```
/backend/ 
├── .env 
├── requirements.txt
└── sqlhunt/ (Django Application Directory)
    ├── config/ (Django Settings)
    ├── users/ (User Management)
    ├── investigations/ (Cases and Investigations)
    ├── account/ (Authentication and Authorization)
    └── manage.py
```

## Начало работы

### Настройка базы данных PostgreSQL

1. Убедитесь, что PostgreSQL установлен на вашем компьютере. Если нет, установите его, следуя инструкциям официального сайта PostgreSQL.
2. Создайте 3 новые базы данных и пользователя:

   ```bash
   sudo -u postgres psql
   ```

   ```psql
   CREATE DATABASE users_db;
   CREATE DATABASE investigations_db;
   CREATE DATABASE auth_db;
   CREATE USER sqlhunt WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE users_db TO sqlhunt;
   GRANT ALL PRIVILEGES ON DATABASE investigations_db TO sqlhunt;
   GRANT ALL PRIVILEGES ON DATABASE auth_db TO sqlhunt;
   exit
   ```

### Установка и запуск проекта

1. Создайте и активируйте виртуальное окружение:

   ```bash
   python -m venv .venv
   source .venv/bin/activate 
   ```
2. Установите зависимости:

   ```bash
   pip install -r requirements.txt
   ```
3. Настройте переменные окружения в файле `.env`

Примечание: Секретный ключ django можно сгенерировать на сайте [https://djecrety.ir](https://djecrety.ir)

4. Выполните миграции:

   ```bash
   python3 manage.py makemigrations
   python3 manage.py migrate --database=auth
   python3 manage.py migrate --database=users
   python3 manage.py migrate --database=investigations
   ```
   Примечание: Так как база данных default пуста, то при каждом запуске migrate необходимо вручную указывать имя базы данных.
5. Создайте суперпользователя:

   ```bash
   python3 manage.py createsuperuser --database=auth
   ```
6. Запустите сервер разработки:

   ```bash
   python3 manage.py runserver_plus --cert-file cert.crt
   ```
   Примечание: Мы указали команде runserver_plus имя файла SSL/TLS-сертификата. Django Extensions автоматически сгенерирует ключ и сертификат. Пройдите по URL-адресу [https://sqlhunt.com:8000/](https://sqlhunt.com:8000/)
