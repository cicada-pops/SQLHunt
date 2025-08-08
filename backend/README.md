# Development Commands

- Open the `backend/.env` file in a text editor and configure your environment variables as needed.

- Open a terminal window and navigate to the project's root directory.

- To start all services in detached mode and build containers if needed, run:  
  ```
  make up
  ```
- To stop all running containers, run:
  ```
  make down
  ```
- To view logs of a specific service (e.g., db1), run:
  ```
  make logs db1
  ```
- To open an interactive shell inside a running container (e.g., app container), run:
  ```
  make shell app
  ```
- To run any Django management command inside the app container (e.g., load_cases), run:
  ```
  make manage load_cases
  ```
- To create super user, run:
  ```
  make createsuperuser
  ```
- To create migrations, run:
  ```
  make makemigrations
  ```
- To apply migrations, run:
  ```
  make migrate
  ```
- To remove all migration files except __init__.py, run:
  ```
  make clean_migrations:
  ```
- To remove all Python cache files, run:
  ```
  make clean
  ```
- To run code quality checks (using ruff), run:
  ```
  make check
  ```
- To automatically fix code style issues, run:
  ```
  make lint
  ```
- To run tests in parallel with database reuse, run:
  ```
  make test
  ```
- To run tests in parallel without database reuse, run:
  ```
  make test_reset
  ```
- To update dependencies (rebuild containers), run:
  ```
  make update_dependencies
  ```

> [!IMPORTANT]
> Since the root directory is backend, use absolute paths when importing (e.g., make test core.tests.users)