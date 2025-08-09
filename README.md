# SQL Hunt

> [!TIP]
> The demo shows the main features and workflow of the project.
<p align="center">
  <img src="demo.gif" alt="SQLHunt Demo" width="800"/>
</p>

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- pnpm (package manager)

The frontend will be available at `http://localhost:3000`

   ```
   npm run dev
   ```

## Backend Setup

1. Install Docker and Docker Compose:

   ```bash
   brew install --cask docker
   brew install docker-compose

2. Install the uv package manager:

   ```bash
   brew install uv 
   ```

3. Install Ruff:

   ```bash
   uv tool install ruff
   ```

4. Set up environment variables in the [`backend/.env`](./backend/.env) file.

5. Run the services with the following command:
    ```bash
    make up
    ```

> [!NOTE]
> For more information, see [`backend/README`](./backend/README.md)

> [!NOTE]
> If runserver_plus is used with an SSL certificate, Django Extensions will automatically generate the certificate and key. [https://sqlhunt.com:8000/](https://sqlhunt.com:8000/)

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