# 🔧 CÓDIGO LISTO PARA COPIAR/PEGAR

## 1️⃣ ARCHIVO: `src/App.tsx` (Función getBackendUrl)

### ✅ CÓDIGO ACTUALIZADO COMPLETO

```tsx
// src/App.tsx - Líneas 30-45

// Determinar URL del backend basado en el entorno
// En producción (Nginx): `/api/` desde el mismo dominio
// En desarrollo local: `http://localhost:8000`
const getBackendUrl = () => {
  const backendEnv = import.meta.env.VITE_BACKEND_URL;
  if (backendEnv) return backendEnv;
  
  // En producción (Nginx + tusommeliervirtual.com): usar `/api/` en el mismo dominio
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/api";
  }
  
  // En desarrollo local
  return "http://localhost:8000";
};

const BACKEND_URL = getBackendUrl();
```

### Cómo aplicar:

```bash
# 1. Abre el archivo
nano my-tavus-app/src/App.tsx

# 2. Ve a la línea 30
# 3. Reemplaza la función getBackendUrl() con el código de arriba

# 4. Guarda (Ctrl+X, Y, Enter si usas nano)

# 5. Rebuild
cd my-tavus-app
npm run build
```

---

## 2️⃣ ARCHIVO: `nginx.conf` - CONFIGURACIÓN COMPLETA

### ✅ TODO EL ARCHIVO NGINX

```nginx
# Configuración Nginx para Tu Sommelier Virtual
# Dominio: https://tusommeliervirtual.com
# - Frontend en /
# - Backend en /api/
# - SSL con Let's Encrypt

# Redirigir HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tusommeliervirtual.com;

    # Permitir validación de Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirigir todo lo demás a HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuración HTTPS principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tusommeliervirtual.com;

    # Certificados SSL de Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/tusommeliervirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tusommeliervirtual.com/privkey.pem;

    # Configuración SSL mejorada
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/tusommelier_access.log;
    error_log /var/log/nginx/tusommelier_error.log;

    # Tamaño máximo de upload
    client_max_body_size 100M;

    # ════════════════════════════════════════════════════════════════
    # FRONTEND - Servir archivos estáticos desde la raíz
    # ════════════════════════════════════════════════════════════════
    
    location / {
        # Raíz del frontend compilado
        root /var/www/frontend;
        
        # Para aplicaciones React/SPA: servir index.html para rutas no encontradas
        try_files $uri $uri/ /index.html;
        
        # Headers de caché para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header ETag "";
            if_modified_since off;
        }

        # Sin caché para index.html
        location = /index.html {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # ════════════════════════════════════════════════════════════════
    # BACKEND API - Proxy hacia http://backend:8000
    # ════════════════════════════════════════════════════════════════
    
    location /api/ {
        # URL destino del backend
        proxy_pass http://backend:8000/;

        # Headers de proxy necesarios
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Port $server_port;

        # Headers para WebSockets (si los necesitas)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Manejo de errores del backend
        error_page 502 503 504 /50x.html;
    }

    # ════════════════════════════════════════════════════════════════
    # HEALTH CHECK (opcional pero útil)
    # ════════════════════════════════════════════════════════════════
    
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # ════════════════════════════════════════════════════════════════
    # BLOQUEAR ACCESO A ARCHIVOS SENSIBLES
    # ════════════════════════════════════════════════════════════════
    
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Cómo aplicar:

```bash
# 1. Copiar el archivo nginx.conf a la carpeta raíz del proyecto
cp nginx.conf /etc/nginx/sites-available/tusommelier

# 2. Crear symlink
sudo ln -s /etc/nginx/sites-available/tusommelier /etc/nginx/sites-enabled/

# 3. Verificar sintaxis
sudo nginx -t

# 4. Si todo OK, recargar
sudo systemctl reload nginx
```

---

## 3️⃣ PYTHON BACKEND - Agregar Headers Proxy (Opcional)

Si quieres que tu backend lea los headers de proxy de Nginx:

```python
# backend/main.py

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permitir requests desde el frontend

def get_client_info():
    """Obtener información del cliente desde los headers proxy de Nginx"""
    client_ip = request.headers.get('X-Real-IP', request.remote_addr)
    forwarded_for = request.headers.get('X-Forwarded-For', '')
    forwarded_proto = request.headers.get('X-Forwarded-Proto', 'http')
    forwarded_host = request.headers.get('X-Forwarded-Host', request.host)
    
    return {
        'ip': client_ip,
        'forwarded_for': forwarded_for,
        'protocol': forwarded_proto,
        'host': forwarded_host,
    }

@app.route('/conversation', methods=['POST'])
def conversation():
    """Endpoint del LLM"""
    
    # Obtener info del cliente desde proxy headers
    client_info = get_client_info()
    
    print(f"Client IP: {client_info['ip']}")
    print(f"Protocol: {client_info['protocol']}")
    print(f"Host: {client_info['host']}")
    
    # Obtener datos del request
    data = request.get_json()
    text = data.get('text', '')
    
    # Procesar con LLM
    reply = f"Response to: {text}"
    
    return jsonify({
        "reply": reply,
        "status": "success",
        "client": client_info  # Debug: devolver info del cliente
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "OK"}), 200

if __name__ == '__main__':
    # En Docker/Nginx: escuchar en 0.0.0.0:8000
    app.run(host='0.0.0.0', port=8000, debug=False)
```

---

## 4️⃣ DOCKER-COMPOSE ACTUALIZADO

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: dockerfile
    container_name: tusommelier-backend
    restart: always
    env_file:
      - ./config/secrets.env
    environment:
      - PYTHONUNBUFFERED=1
    expose:
      - "8000"
    networks:
      - sommelier-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./my-tavus-app
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: tusommelier-frontend
    restart: always
    expose:
      - "5173"
    environment:
      - NODE_ENV=production
      - VITE_TAVUS_API_KEY=${VITE_TAVUS_API_KEY}
      - VITE_REPLICA_ID=${VITE_REPLICA_ID}
      - VITE_PERSONA_ID=${VITE_PERSONA_ID}
    networks:
      - sommelier-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5173"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: tusommelier-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /var/www/frontend:/var/www/frontend:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - sommelier-network
    depends_on:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  sommelier-network:
    driver: bridge

volumes:
  backend-logs:
  frontend-logs:
  nginx-logs:
```

---

## 5️⃣ COMANDOS ÚTILES PARA TESTING

```bash
# ════════════════════════════════════════════════════════════════
# Test 1: Redirección HTTP → HTTPS
# ════════════════════════════════════════════════════════════════
curl -I http://tusommeliervirtual.com
# Esperado: 301 Moved Permanently


# ════════════════════════════════════════════════════════════════
# Test 2: Frontend accesible
# ════════════════════════════════════════════════════════════════
curl -I https://tusommeliervirtual.com
# Esperado: HTTP/2 200


# ════════════════════════════════════════════════════════════════
# Test 3: API endpoint
# ════════════════════════════════════════════════════════════════
curl -X POST https://tusommeliervirtual.com/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"text":"Hola sommelier"}'
# Esperado: JSON response del backend


# ════════════════════════════════════════════════════════════════
# Test 4: Ver headers que envía Nginx
# ════════════════════════════════════════════════════════════════
curl -vv https://tusommeliervirtual.com/api/conversation
# Buscar: X-Real-IP, X-Forwarded-*, etc


# ════════════════════════════════════════════════════════════════
# Test 5: Health check
# ════════════════════════════════════════════════════════════════
curl https://tusommeliervirtual.com/health


# ════════════════════════════════════════════════════════════════
# Test 6: Ver logs en tiempo real
# ════════════════════════════════════════════════════════════════
tail -f /var/log/nginx/tusommelier_access.log
tail -f /var/log/nginx/tusommelier_error.log


# ════════════════════════════════════════════════════════════════
# Test 7: Ver certificado SSL
# ════════════════════════════════════════════════════════════════
openssl x509 -in /etc/letsencrypt/live/tusommeliervirtual.com/fullchain.pem -text -noout
```

---

## 6️⃣ VARIABLES DE ENTORNO (OPCIONAL OVERRIDE)

Si quieres override de la URL del backend:

### En `my-tavus-app/.env.production`

```env
# Frontend
VITE_TAVUS_API_KEY=your-tavus-key
VITE_REPLICA_ID=your-replica-id
VITE_PERSONA_ID=your-persona-id

# Backend URL (opcional - si no está, usa /api)
VITE_BACKEND_URL=https://api.otro-dominio.com
```

Luego rebuild:

```bash
cd my-tavus-app
npm run build
```

---

## ✅ Checklist de Instalación Rápida

```bash
# [ ] 1. Obtener certificado SSL
sudo certbot certonly --standalone -d tusommeliervirtual.com

# [ ] 2. Crear directorio frontend
sudo mkdir -p /var/www/frontend

# [ ] 3. Copiar archivos compilados
cd my-tavus-app
npm run build
sudo cp -r dist/* /var/www/frontend/

# [ ] 4. Copiar Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/tusommelier
sudo ln -s /etc/nginx/sites-available/tusommelier /etc/nginx/sites-enabled/

# [ ] 5. Verificar Nginx
sudo nginx -t

# [ ] 6. Recargar Nginx
sudo systemctl reload nginx

# [ ] 7. Test
curl -I https://tusommeliervirtual.com
curl https://tusommeliervirtual.com/api/health

# ¡LISTO! 🚀
```

---

*Código listo para producción* 🍷
