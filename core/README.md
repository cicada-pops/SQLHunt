# SQL Hunt

## Структура проекта

```
/core/
├── README.md
├── manage.py
├── celery_app.py
├── config/              # Django settings
├── account/             # Аутентификация
├── users/               # Пользователи
├── investigations/      # Учебная БД
├── services/
└── tests/
```

## Начало работы

### Настройка базы данных PostgreSQL

1. Убедитесь, что PostgreSQL установлен на
   вашем компьютере. Если нет, установите его, следуя инструкциям официального сайта PostgreSQL.
2. Зайдите в оболочку и создайте пользователя.

   ```psql
   psql postgres 
   CREATE USER sqlhunt WITH PASSWORD 'your_password';
   ALTER USER sqlhunt CREATEDB;
   ```
3. Создайте 4 новые базы данных и выдайте привелегии:

   ```psql
   CREATE DATABASE users_db OWNER sqlhunt;
   CREATE DATABASE investigations_db OWNER sqlhunt;
   CREATE DATABASE auth_db OWNER sqlhunt;
   CREATE DATABASE celery_results OWNER sqlhunt;
   GRANT ALL PRIVILEGES ON DATABASE users_db TO sqlhunt;
   GRANT ALL PRIVILEGES ON DATABASE investigations_db TO sqlhunt;
   GRANT ALL PRIVILEGES ON DATABASE auth_db TO sqlhunt;
   GRANT ALL PRIVILEGES ON DATABASE celery_results TO sqlhunt;
   GRANT ALL ON SCHEMA public TO sqlhunt;
   exit
   ```

### Настройка Celery и RabbitMQ

1. Убедитесь, что RabbitMQ установлен на
   вашем компьютере. Если нет, установите егo через brew.

   ```bash
   brew install rabbitmq
   ```
2. После запуска нам необходимо создать пользователя RabbitMQ, виртуальный хост и разрешить этому пользователю доступ к этому виртуальному хосту:

   ```bash
   brew services start rabbitmq
   rabbitmqctl add_user sqlhunt 'your_password'
   rabbitmqctl add_vhost sqlhunt
   rabbitmqctl set_user_tags sqlhunt administrator
   rabbitmqctl set_permissions -p sqlhunt sqlhunt ".*" ".*" ".*"
   ```

### Установка и запуск проекта

1. Создайте и активируйте виртуальное окружение в корне проекта:

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

4. Выполните миграции, перейдя в каталог приложения:

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py migrate users --database=users
   python manage.py migrate investigations --database=investigations
   python manage.py migrate django_celery_results --database=celery
   ```
   Примечание: Так как база данных default пуста, то при каждом запуске migrate необходимо вручную указывать имя базы данных.
5. Сгенерируйте данные и загрузите дела

   ```
   python manage.py generate_investigations
   python manage.py load_cases
   ```
   Примечание: для очистки данных используйте параметр --clear
6. Создайте суперпользователя:

   ```bash
   python manage.py createsuperuser
   ```
7. Запустите celery:

   ```
   celery -A celery_app worker --loglevel=info
   ```
8. Запустите сервер разработки:

   ```bash
   python manage.py runserver_plus sqlhunt.com:8000 --cert-file cert.crt
   ```
   Примечание: Мы указали команде runserver_plus имя файла SSL/TLS-сертификата. Django Extensions автоматически сгенерирует ключ и сертификат. Пройдите по URL-адресу [https://sqlhunt.com:8000/](https://sqlhunt.com:8000/)
