# 🍷 CONFIGURACIÓN NGINX + API EN `/api/` - RESUMEN COMPLETO

## 📋 Cambios Realizados

### 1️⃣ Archivo Nginx Creado
**Ubicación:** `/nginx.conf`

```bash
ls -la /nginx.conf
```

**Lo que contiene:**
- ✅ Redirección HTTP → HTTPS
- ✅ Certificados SSL con Let's Encrypt
- ✅ Frontend en `/` desde `/var/www/frontend`
- ✅ Backend API proxy en `/api/` hacia `http://backend:8000`
- ✅ Headers de proxy correctos (X-Real-IP, X-Forwarded-*)
- ✅ Caché de archivos estáticos
- ✅ Headers de seguridad

### 2️⃣ Frontend Actualizado
**Archivo:** `my-tavus-app/src/App.tsx`

**Cambio realizado:**
```tsx
// ANTES ❌
return "http://backend:8000";

// AHORA ✅
return "/api";
```

**Por qué:**
- En desarrollo: `http://localhost:8000`
- En producción: `/api` (mismo dominio, Nginx hace el proxy)

### 3️⃣ Documentación Creada
- ✅ `NGINX_SETUP_GUIDE.md` - Guía completa de setup
- ✅ `FRONTEND_API_CONFIGURATION.md` - Configuración React
- ✅ `docker-compose-updated.yml` - Docker mejorado

---

## 🚀 Diagrama Final de Arquitectura

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                      INTERNET (HTTPS)                        ┃
┃     https://tusommeliervirtual.com                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                            ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              NGINX (Reverse Proxy + SSL)                      ┃
┃  Puerto 80 (HTTP→HTTPS redirect)                              ┃
┃  Puerto 443 (HTTPS)                                           ┃
├━━━━━━━━━━━━━━━━━━━━━━━━━━┬━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤
┃                           ┃                                   ┃
┃  / (Frontend)             ┃  /api/ (Backend Proxy)            ┃
┃  ↓                        ┃  ↓                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
          ↓                                    ↓
    ┌─────────────┐                   ┌──────────────────┐
    │  FRONTEND    │                   │  BACKEND PROXY   │
    │  React/Vite  │                   │  → http://       │
    │  Puerto 5173 │                   │    backend:8000  │
    │ (internal)   │                   │                  │
    └─────────────┘                   └──────────────────┘
          ↓                                    ↓
    /var/www/frontend                 ┌──────────────────┐
    (archivos estáticos)               │  BACKEND PYTHON  │
                                       │  Puerto 8000     │
                                       │ (solo interno)   │
                                       └──────────────────┘
```

---

## 📂 Archivos de Configuración

### Nginx Configuration
**Archivo:** `nginx.conf`

```nginx
# Sección 1: HTTP → HTTPS Redirect
server {
    listen 80;
    ...
    return 301 https://$server_name$request_uri;
}

# Sección 2: HTTPS con SSL
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/tusommeliervirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tusommeliervirtual.com/privkey.pem;
    
    # Frontend
    location / {
        root /var/www/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        ...
    }
}
```

### React Frontend
**Archivo:** `my-tavus-app/src/App.tsx`

```tsx
const getBackendUrl = () => {
  const backendEnv = import.meta.env.VITE_BACKEND_URL;
  if (backendEnv) return backendEnv;
  
  // Producción: /api
  if (window.location.hostname !== "localhost" && 
      window.location.hostname !== "127.0.0.1") {
    return "/api";  // ← Relativo al dominio actual
  }
  
  // Desarrollo: http://localhost:8000
  return "http://localhost:8000";
};
```

---

## 🔄 Flujo de Requests

### En Desarrollo Local

```
Cliente: http://localhost:5173
  ↓
fetch('http://localhost:8000/conversation')
  ↓
Backend: http://localhost:8000
```

### En Producción (Con Nginx)

```
Cliente: https://tusommeliervirtual.com
  ↓
fetch('/api/conversation')  ← URL RELATIVA
  ↓ (Se convierte en):
https://tusommeliervirtual.com/api/conversation
  ↓
Nginx detecta: location /api/
  ↓
proxy_pass http://backend:8000/
  ↓ (Se redirecciona a):
http://backend:8000/conversation
  ↓
Backend responde
  ↓ (Con headers):
X-Real-IP: IP_DEL_CLIENTE
X-Forwarded-For: IP_DEL_CLIENTE
X-Forwarded-Proto: https
X-Forwarded-Host: tusommeliervirtual.com
  ↓
Backend recibe request con contexto original
```

---

## ✅ Checklist de Implementación

### Paso 1: Certificados SSL
```bash
# [ ] Obtener certificados de Let's Encrypt
certbot certonly --standalone -d tusommeliervirtual.com

# [ ] Verificar certificados
ls -la /etc/letsencrypt/live/tusommeliervirtual.com/
```

### Paso 2: Preparar Directorios
```bash
# [ ] Crear directorio frontend
mkdir -p /var/www/frontend

# [ ] Compilar frontend
cd my-tavus-app && npm run build

# [ ] Copiar archivos
cp -r dist/* /var/www/frontend/

# [ ] Fijar permisos
chown -R www-data:www-data /var/www/frontend
chmod -R 755 /var/www/frontend
```

### Paso 3: Configurar Nginx
```bash
# [ ] Copiar configuración
cp nginx.conf /etc/nginx/sites-available/tusommelier

# [ ] Crear symlink
ln -s /etc/nginx/sites-available/tusommelier \
      /etc/nginx/sites-enabled/

# [ ] Verificar sintaxis
nginx -t

# [ ] Recargar
systemctl reload nginx
```

### Paso 4: Testing
```bash
# [ ] Frontend accesible
curl https://tusommeliervirtual.com

# [ ] API proxy funciona
curl https://tusommeliervirtual.com/api/health

# [ ] HTTPS válido
curl -v https://tusommeliervirtual.com

# [ ] Logs limpios
tail /var/log/nginx/tusommelier_error.log
```

---

## 📊 Headers Enviados por Nginx

Cuando el backend recibe un request:

```http
POST /conversation HTTP/1.1

Host: tusommeliervirtual.com
X-Real-IP: 203.0.113.45           ← IP real del cliente
X-Forwarded-For: 203.0.113.45      ← Cadena de IPs
X-Forwarded-Proto: https           ← Protocolo original
X-Forwarded-Host: tusommeliervirtual.com
X-Forwarded-Port: 443              ← Puerto original
Upgrade: websocket                 ← Para WebSockets
Connection: upgrade

Content-Type: application/json
```

---

## 🐳 Docker Compose

**Archivo:** `docker-compose-updated.yml`

**Características:**
- ✅ Backend en network interno (no expuesto)
- ✅ Frontend en network interno (no expuesto)
- ✅ Nginx es único que expone puertos (80, 443)
- ✅ Health checks incluidos
- ✅ Volúmenes para persistencia
- ✅ Limites de recursos
- ✅ Logging centralizado

**Uso:**
```bash
# Iniciar
docker-compose -f docker-compose-updated.yml up -d

# Logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 🔐 Seguridad

### Headers de Seguridad agregados

```nginx
Strict-Transport-Security: max-age=31536000  # Force HTTPS por 1 año
X-Content-Type-Options: nosniff               # Prevenir MIME sniffing
X-Frame-Options: SAMEORIGIN                  # Prevenir clickjacking
X-XSS-Protection: 1; mode=block              # XSS protection
```

### Archivos bloqueados

```nginx
location ~ /\. {
    deny all;  # Bloquear .git, .env, etc
}
```

---

## 📈 Performance

### Caché activado
```nginx
# 1 año para archivos estáticos (js, css, imágenes)
expires 1y;
Cache-Control: public, immutable;

# Sin caché para index.html
Cache-Control: no-store, no-cache, must-revalidate;
```

### Compression (agregar a Nginx si no está)
```nginx
gzip on;
gzip_types text/plain text/javascript application/json;
gzip_min_length 1000;
```

---

## 🧪 Testing

### Test 1: HTTP → HTTPS
```bash
curl -I http://tusommeliervirtual.com
# Response: 301 Moved Permanently
# Location: https://tusommeliervirtual.com
```

### Test 2: Frontend
```bash
curl https://tusommeliervirtual.com
# Response: HTML del index.html
```

### Test 3: Backend Proxy
```bash
curl https://tusommeliervirtual.com/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}'
# Response: JSON del backend
```

### Test 4: Headers
```bash
curl -v https://tusommeliervirtual.com/api/conversation
# Ver: X-Real-IP, X-Forwarded-*, etc
```

---

## 📝 Archivos Entregados

### Configuración
- ✅ `nginx.conf` - Config Nginx completa
- ✅ `docker-compose-updated.yml` - Docker mejorado
- ✅ `my-tavus-app/src/App.tsx` - Frontend actualizado

### Documentación
- ✅ `NGINX_SETUP_GUIDE.md` - Guía paso a paso (completa)
- ✅ `FRONTEND_API_CONFIGURATION.md` - Configuración React
- ✅ `NGINX_API_CONFIG_SUMMARY.md` - Este archivo (resumen)

---

## 🆘 Troubleshooting Rápido

### "502 Bad Gateway"
```bash
# Backend no responde
docker ps | grep backend
docker logs -f backend
docker exec backend curl http://localhost:8000/health
```

### "404 Not Found" en /api/
```bash
# Ruta no existe en backend
curl http://localhost:8000/conversation
# o ver logs
tail -f /var/log/nginx/tusommelier_error.log
```

### CORS errors
```bash
# Backend necesita CORS
# Agregar en Python:
from flask_cors import CORS
CORS(app)
```

### Frontend hace requests a http://backend:8000
```bash
# Build no se actualizó
npm run build
cp -r dist/* /var/www/frontend/
systemctl reload nginx
```

---

## 📞 Recursos

- Nginx Docs: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- Certbot: https://certbot.eff.org/
- Docker Compose: https://docs.docker.com/compose/

---

## ✨ Resultado Final

Tu aplicación ahora tiene:

```
✅ Dominio único: tusommeliervirtual.com
✅ HTTPS seguro con certificados Let's Encrypt
✅ Frontend en /
✅ Backend en /api/
✅ Headers de proxy correctos
✅ Caché de archivos estáticos
✅ Security headers
✅ Logging centralizado
✅ Docker containerizado
✅ Desarrollo y producción configurados
```

---

*Configuración creada por Espacio Sommelier* 🍷
