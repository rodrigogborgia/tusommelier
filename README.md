# Tu Sommelier

Proyecto con frontend React (`my-tavus-app`) y backend FastAPI (`backend`), desplegado con Docker Compose.

## Arquitectura actual

- `frontend`: `ghcr.io/rodrigoborgia/tusommelier-frontend:latest`
- `backend`: `ghcr.io/rodrigoborgia/tusommelier-backend:latest`
- `nginx-proxy` + `acme-companion`: routing y SSL

## CI/CD (GitHub Actions)

1. `1- CI` valida lint/tests/security
2. `2 - Deploy Staging` construye y publica imágenes en GHCR
3. `3 - Deploy Production` hace `git pull`, `docker compose pull` y `docker compose up -d` en el servidor

## Deploy manual (servidor)

```bash
cd /home/<usuario>/tusommelier
git pull origin main
docker compose pull
docker compose up -d
```

## URL de backend en frontend

- Producción HTTPS: usar `/api`
- Desarrollo local: `http://localhost:8000`
- Si `VITE_BACKEND_URL` está en `http://...` y la página está en HTTPS, el frontend fuerza `/api` para evitar mixed content.

## Archivos clave

- `docker-compose.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy.yml`
- `my-tavus-app/src/App.tsx`
- `backend/main.py`
