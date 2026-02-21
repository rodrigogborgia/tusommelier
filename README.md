# Tu Sommelier

Proyecto con frontend React (`my-tavus-app`) y backend FastAPI (`backend`) con deploy sin Docker.

## Arquitectura actual

- Frontend estático servido por Nginx desde `/var/www/frontend`
- Backend FastAPI (`uvicorn`) como servicio `systemd` en `127.0.0.1:8000`
- Nginx reverse proxy: `/api/*` → `http://127.0.0.1:8000/*`

## CI/CD (GitHub Actions)

1. `1- CI` valida lint/tests/security
2. `2 - Deploy Staging` valida instalación backend + build frontend
3. `3 - Deploy Production` despliega por SSH:
	- `git reset --hard origin/main`
	- instala backend en `.venv`
	- compila frontend y copia `dist` a `/var/www/frontend`
	- recarga Nginx y reinicia `tusommelier-backend` (systemd)

## Archivos clave

- `nginx.conf`
- `deploy/systemd/tusommelier-backend.service`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy.yml`
- `my-tavus-app/src/App.tsx`
- `backend/main.py`
