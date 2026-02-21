# Troubleshooting

## Problema: mixed content en producción

Síntoma en navegador:

- Página en `https://...`
- Request bloqueado a `http://backend:8000/...`

Solución esperada:

- El frontend debe llamar a `/api/...` en producción
- Nginx proxy interno: `http://backend:8000/...`

## Verificaciones rápidas

### 1) Backend y frontend desplegados en host

```bash
systemctl status tusommelier-backend
nginx -t
systemctl status nginx
```

### 2) API externa por HTTPS

```bash
curl -i https://tusommeliervirtual.com/api/health
curl -i https://tusommeliervirtual.com/api/conversation
```

### 3) Frontend no debe llamar `http://backend:8000`

En DevTools (Network), verificar que la llamada sea:

- `https://tusommeliervirtual.com/api/conversation`

## Desarrollo local

Backend:

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd my-tavus-app
npm run dev
```

En local se usa `http://localhost:8000`.

## Variables de entorno

- Producción: evitar `VITE_BACKEND_URL=http://...`
- Si se define `VITE_BACKEND_URL` insegura en página HTTPS, el frontend fuerza `/api` para evitar mixed content.

## Logs útiles

```bash
journalctl -u tusommelier-backend -f
tail -f /var/log/nginx/tusommelier_access.log
tail -f /var/log/nginx/tusommelier_error.log
```
