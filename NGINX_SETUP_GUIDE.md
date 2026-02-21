# Guía Nginx (sin Docker)

## Objetivo

Servir:

- Frontend React estático en `/`
- Backend FastAPI en `/api/`
- HTTPS con Let's Encrypt

## Rutas esperadas

- Frontend: `/var/www/frontend`
- Config Nginx del proyecto: `nginx.conf`
- Backend local: `127.0.0.1:8000`

## Instalación en servidor

```bash
sudo cp nginx.conf /etc/nginx/sites-available/tusommelier
sudo ln -sfn /etc/nginx/sites-available/tusommelier /etc/nginx/sites-enabled/tusommelier
sudo nginx -t
sudo systemctl reload nginx
```

## Verificaciones

```bash
curl -I https://tusommeliervirtual.com
curl -I https://tusommeliervirtual.com/api/health
```

En el navegador, el frontend debe llamar a:

- `https://tusommeliervirtual.com/api/conversation`

## Logs

```bash
tail -f /var/log/nginx/tusommelier_access.log
tail -f /var/log/nginx/tusommelier_error.log
```
