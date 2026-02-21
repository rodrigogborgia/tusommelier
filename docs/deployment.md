# Deployment (Sin Docker)

Este proyecto despliega en servidor por SSH con `systemd` + `nginx`, sin contenedores.

## Workflows

- `1- CI`: lint/tests/security
- `2 - Deploy Staging`: valida instalación de backend y build de frontend
- `3 - Deploy Production`: despliega en servidor

## Secrets requeridos en GitHub

- `SERVER_HOST`
- `SERVER_USER`
- `DEPLOY_KEY`

## Qué hace el deploy de producción

1. `git reset --hard origin/main`
2. Crea/actualiza `.venv` e instala `backend/requirements.txt`
3. Ejecuta `npm ci` y `npm run build` en `my-tavus-app`
4. Copia `my-tavus-app/dist` a `/var/www/frontend`
5. Instala/actualiza unidad `systemd` `tusommelier-backend`
6. Valida y recarga `nginx`
7. Reinicia `tusommelier-backend`

## Verificación post-deploy

```bash
curl -i https://tusommeliervirtual.com
curl -i https://tusommeliervirtual.com/api/health
systemctl status tusommelier-backend
```
