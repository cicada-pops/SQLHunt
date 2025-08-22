# SQL Hunt

> [!TIP]
> The demo shows the main features and workflow of the project.
<p align="center">
  <img src="demo.gif" alt="SQLHunt Demo" width="800"/>
</p>

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.11 or higher)
- pnpm (package manager)
- uv (package manager)
- ruff (linter and code formatter)
- Docker (v28 or higher)
- Docker Compose (v2 or higher)


## Setup

1. Set up environment variables in the `backend/.env` file.

2. Run the services with the following command and navigate to [`http://localhost:3000`](http://localhost:3000):
    ```bash
    make up
    ```

> [!NOTE]
> For more information, see [`backend/README`](./backend/README.md)

> [!NOTE]
> If runserver_plus is used with an SSL certificate, Django Extensions will automatically generate the certificate and key. Don't forget to add permission to visit the site [https://sqlhunt.com:8000/](https://sqlhunt.com:8000/)

> [!IMPORTANT]
>
> You need to add the domain to your `/etc/hosts` file to access the project via the custom domain.  
> For example, add the following line:
>
> ```
> 127.0.0.1       sqlhunt.com
> ```
>
> This ensures that requests to `sqlhunt.com` are routed to your local machine.