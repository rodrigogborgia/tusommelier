# 📋 GUÍA DE CONFIGURACIÓN NGINX + BACKEND EN `/api/`

## 🎯 Objetivo

Servir tu aplicación en `https://tusommeliervirtual.com` con:
- **Frontend** en la raíz `/` 
- **Backend API** en `/api/`
- **SSL/TLS** con Let's Encrypt
- **Headers de proxy** correctamente configurados

---

## 📦 Archivos Involucrados

### 1. Configuración Nginx
**Archivo:** `nginx.conf` (en la raíz del proyecto)

Este archivo contiene:
- ✅ Redirección HTTP → HTTPS
- ✅ Proxy hacia backend en `/api/`
- ✅ Configuración SSL con Let's Encrypt
- ✅ Headers de seguridad
- ✅ Caché de archivos estáticos
- ✅ Bloqueo de acceso a archivos sensibles

### 2. Código Frontend Actualizado
**Archivo:** `my-tavus-app/src/App.tsx`

Cambios realizados:
- ✅ En producción: usa `/api` (mismo dominio)
- ✅ En desarrollo: usa `http://localhost:8000` (local)
- ✅ Variable de entorno `VITE_BACKEND_URL` para override

---

## 🚀 SETUP PASO A PASO

### Paso 1: Preparar Certificados SSL de Let's Encrypt

```bash
# 1.1 Instalar Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# 1.2 Obtener certificado (requiere que tu dominio apunte a este servidor)
certbot certonly --standalone -d tusommeliervirtual.com

# 1.3 Verificar que los certificados se crearon
ls -la /etc/letsencrypt/live/tusommeliervirtual.com/
# Debe haber: fullchain.pem y privkey.pem
```

### Paso 2: Crear Directorio del Frontend

```bash
# 2.1 Crear directorio
mkdir -p /var/www/frontend

# 2.2 Compilar el frontend
cd /ruta/al/tusommelier/my-tavus-app
npm run build

# 2.3 Copiar archivos compilados a Nginx
cp -r dist/* /var/www/frontend/

# 2.4 Asegurar permisos
chown -R www-data:www-data /var/www/frontend
chmod -R 755 /var/www/frontend
```

### Paso 3: Copiar Configuración Nginx

```bash
# 3.1 Copiar el archivo nginx.conf
cp /ruta/al/tusommelier/nginx.conf /etc/nginx/sites-available/tusommelier

# 3.2 Crear symlink para habilitar el sitio
ln -s /etc/nginx/sites-available/tusommelier /etc/nginx/sites-enabled/

# 3.3 Verificar sintaxis de Nginx
nginx -t
# Debe mostrar: "syntax is ok" y "test is successful"

# 3.4 Recargar Nginx
systemctl reload nginx
```

### Paso 4: Verificar que Todo Funciona

```bash
# 4.1 Verificar que Nginx está corriendo
systemctl status nginx

# 4.2 Probar conexión HTTPS
curl -I https://tusommeliervirtual.com
# Debe devolver: HTTP/2 200

# 4.3 Probar que el API proxy funciona
curl -I https://tusommeliervirtual.com/api/health
# Debe devolve respuesta del backend (200, 404, etc)

# 4.4 Ver logs en tiempo real
tail -f /var/log/nginx/tusommelier_access.log
tail -f /var/log/nginx/tusommelier_error.log
```

---

## 🔄 FLUJO DE REQUESTS

### Desarrollo Local

```
Frontend (localhost:5173)
    ↓
fetch('http://localhost:8000/conversation')
    ↓
Backend (localhost:8000)
```

### Producción (Con Nginx)

```
Frontend (https://tusommeliervirtual.com)
    ↓
fetch('/api/conversation')  ← URL relativa (¡OJO!)
    ↓
Nginx (proxy_pass http://backend:8000/)
    ↓
Backend (http://backend:8000/conversation)
```

⚠️ **Importante:** En React, el fetch a `/api/conversation` es **relativo al dominio actual**, por lo que:
- Si estás en `https://tusommeliervirtual.com`, 
- La request va a `https://tusommeliervirtual.com/api/conversation`
- Nginx la redirecciona a `http://backend:8000/conversation`

---

## 📝 Configuración por Secciones

### 1. Redirigir HTTP → HTTPS

```nginx
server {
    listen 80;
    server_name tusommeliervirtual.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

✅ Todos los requests HTTP se redirigen a HTTPS

---

### 2. Certificados SSL

```nginx
ssl_certificate /etc/letsencrypt/live/tusommeliervirtual.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/tusommeliervirtual.com/privkey.pem;
```

✅ Configuración SSL/TLS con Let's Encrypt
⚠️ Renovación automática con `certbot renew`

---

### 3. Headers de Proxy

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $server_name;
proxy_set_header X-Forwarded-Port $server_port;
```

**Por qué cada uno:**

| Header | Valor | Por qué |
|--------|-------|--------|
| `Host` | `tusommeliervirtual.com` | Backend sabe el dominio real |
| `X-Real-IP` | IP del cliente | Backend ve IP real, no la de Nginx |
| `X-Forwarded-For` | IPs por las que pasó | Trazabilidad de proxies |
| `X-Forwarded-Proto` | `https` | Backend sabe que fue HTTPS |
| `X-Forwarded-Host` | `tusommeliervirtual.com` | Host original para redirects |
| `X-Forwarded-Port` | `443` | Puerto original (HTTPS) |

---

### 4. Caché de Archivos Estáticos

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

✅ Archivos estáticos se cachean por 1 año en el navegador
✅ Reduce carga del servidor
✅ Mejora performance

---

### 5. Sin Caché para HTML

```nginx
location = /index.html {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

✅ Cada vez que abras la app, cargas el `index.html` más reciente
✅ Permite actualizar la app sin que usuarios vean versiones antiguas

---

### 6. React Router - Fallback a index.html

```nginx
location / {
    root /var/www/frontend;
    try_files $uri $uri/ /index.html;
}
```

✅ Si una ruta no existe (ej: `/miembro/123`), sirve `index.html`
✅ React Router maneja el routing en el cliente
✅ Evita errores 404

---

## 🔐 Headers de Seguridad

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
```

| Header | Protege de |
|--------|-----------|
| `Strict-Transport-Security` | Downgrade a HTTP |
| `X-Content-Type-Options` | MIME sniffing |
| `X-Frame-Options` | Clickjacking |
| `X-XSS-Protection` | XSS attacks |

---

## 🐳 Docker Compose Configuration

Si usas Docker, actualiza tu `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./my-tavus-app
      dockerfile: Dockerfile
    container_name: frontend
    expose:
      - "5173"  # Solo dentro del docker network
    environment:
      - NODE_ENV=production
    networks:
      - sommelier

  backend:
    build:
      context: ./backend
      dockerfile: dockerfile
    container_name: backend
    expose:
      - "8000"  # Solo dentro del docker network
    environment:
      - PYTHONUNBUFFERED=1
    networks:
      - sommelier

  nginx:
    image: nginx:latest
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /var/www/frontend:/var/www/frontend:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    networks:
      - sommelier

networks:
  sommelier:
    driver: bridge
```

✅ Frontend expone solo en puerto 5173 (dentro del docker network)
✅ Backend expone solo en puerto 8000 (dentro del docker network)
✅ Nginx es el único que expone puertos 80 y 443 (al mundo exterior)

---

## 🧪 Testing & Debugging

### Test 1: Verificar Nginx

```bash
# Sintaxis correcta
nginx -t

# Recargar configuración
systemctl reload nginx

# Ver procesos Nginx
ps aux | grep nginx
```

### Test 2: Conectividad HTTP/HTTPS

```bash
# HTTP → HTTPS redirect
curl -I http://tusommeliervirtual.com
# Debe devolver: 301 Moved Permanently

# HTTPS funcionando
curl -I https://tusommeliervirtual.com
# Debe devolver: HTTP/2 200
```

### Test 3: Proxy Backend

```bash
# Test del proxy hacia /api
curl https://tusommeliervirtual.com/api/conversation

# Ver headers
curl -v https://tusommeliervirtual.com/api/conversation
```

### Test 4: Frontend React

```bash
# Abrir en navegador
https://tusommeliervirtual.com

# Inspeccionar Network tab
# Ver que los fetches vayan a /api/conversation
```

### Test 5: Logs en Vivo

```bash
# Ver requests en tiempo real
tail -f /var/log/nginx/tusommelier_access.log

# Ver errores
tail -f /var/log/nginx/tusommelier_error.log

# Buscar problemas específicos
grep "X-Forwarded" /var/log/nginx/tusommelier_access.log
```

---

## 🔄 Renovación Automática de Certificados

Let's Encrypt expira cada 90 días. Configurar renovación automática:

```bash
# 1. Crear script de renovación
cat > /usr/local/bin/renew-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
EOF

# 2. Dar permisos de ejecución
chmod +x /usr/local/bin/renew-certs.sh

# 3. Agregar a cron (ejecutar diariamente)
crontab -e

# Agregar esta línea:
0 3 * * * /usr/local/bin/renew-certs.sh
```

---

## 🆘 Troubleshooting

### Problema: "502 Bad Gateway"

**Causa:** Backend no está corriendo o no es accesible

```bash
# Verificar backend está corriendo
docker ps | grep backend

# Verificar puerto 8000 está abierto dentro del docker
docker exec backend netstat -tulpn | grep 8000

# Ver logs del backend
docker logs -f backend
```

---

### Problema: "404 Not Found" en `/api/`

**Causa:** Backend no tiene la ruta o el proxy no está configurado correctamente

```bash
# 1. Verificar configuración Nginx
nginx -t

# 2. Verificar que el backend tenga las endpoints
curl http://localhost:8000/conversation

# 3. Ver headers que envía Nginx
curl -v https://tusommeliervirtual.com/api/conversation
```

---

### Problema: "SSL_ERROR_BAD_CERT_DOMAIN"

**Causa:** Certificado no es para tu dominio

```bash
# Verificar certificado
openssl x509 -in /etc/letsencrypt/live/tusommeliervirtual.com/fullchain.pem -text -noout

# Debe mostrar:
# Subject: CN = tusommeliervirtual.com
```

---

### Problema: Frontend hace requests a `http://backend:8000`

**Causa:** El código frontend no se actualizó o hay cache

```bash
# 1. Verificar que App.tsx tiene `/api`
grep -n "proxy_pass\|/api" my-tavus-app/src/App.tsx

# 2. Rebuild frontend
cd my-tavus-app && npm run build

# 3. Copiar archivos nuevos
cp -r dist/* /var/www/frontend/

# 4. Limpiar caché del navegador (Ctrl+Shift+Delete)
```

---

## 📊 Arquitectura Final

```
Internet (https://tusommeliervirtual.com)
    ↓
Nginx (Puerto 80/443)
    ├─→ Static files (/) → /var/www/frontend/
    └─→ API requests (/api/) → http://backend:8000/
        ↓
    Backend Python (http://backend:8000)
        ├─→ LLM processing
        ├─→ Tavus API calls
        └─→ Database queries
```

---

## ✅ Checklist Final

- [ ] Certificados SSL obtenidos con Let's Encrypt
- [ ] Directorio `/var/www/frontend` creado
- [ ] Frontend compilado y copiado a `/var/www/frontend`
- [ ] `nginx.conf` copiado a `/etc/nginx/sites-available/`
- [ ] Symlink creado en `/etc/nginx/sites-enabled/`
- [ ] Nginx recargado y corriendo (`systemctl status nginx`)
- [ ] Frontend URL correcta: `https://tusommeliervirtual.com`
- [ ] Backend proxy funcionando: `/api/conversation` redirige a backend
- [ ] HTTPS funcionando sin warnings
- [ ] Certificado se renueva automáticamente

---

## 📞 Recursos Útiles

- **Nginx Docs:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **Certbot Guide:** https://certbot.eff.org/
- **HTTP Security Headers:** https://securityheaders.com/

---

*Configuración creada para Espacio Sommelier* 🍷
