# 🔧 SNIPPETS DE CÓDIGO REACT - CONFIGURACIÓN DE BACKEND EN `/api/`

## 📍 Archivo Actualizado: `src/App.tsx`

### ✅ Función getBackendUrl() - CORREGIDA

```tsx
// ✅ CÓDIGO CORRECTO - Archivo: src/App.tsx (líneas 30-45)

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

---

## 🔄 Cambios Realizados

### Antes ❌
```tsx
// En producción (Docker), usar el nombre del servicio
if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
  return "http://backend:8000";  // ❌ INCORRECTO - Headers proxy no funcionan bien
}
```

### Ahora ✅
```tsx
// En producción (Nginx + tusommeliervirtual.com): usar `/api/` en el mismo dominio
if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
  return "/api";  // ✅ CORRECTO - Nginx hace el proxy
}
```

---

## 🎯 Otras Ubicaciones de Backend URL

### Si hay más archivos que usan BACKEND_URL

Busca estos patrones en todo el proyecto:

```bash
grep -r "http://backend:8000" src/
grep -r "BACKEND_URL" src/
grep -r "localhost:8000" src/
```

Todos deben usar `/api` en producción.

---

## 🧪 Testing del Cambio

### Test 1: En Desarrollo Local

```bash
# 1. Iniciar backend local
cd backend
python main.py  # Corre en http://localhost:8000

# 2. Iniciar frontend con Vite
cd my-tavus-app
npm run dev  # Corre en http://localhost:5173

# 3. En navegador, inspeccionar Network
# Las requests deben ir a: http://localhost:8000/conversation
```

### Test 2: En Producción (Con Nginx)

```bash
# 1. Compilar frontend
npm run build

# 2. Copiar a Nginx
cp -r dist/* /var/www/frontend/

# 3. Recargar Nginx
systemctl reload nginx

# 4. Visitar https://tusommeliervirtual.com
# Inspeccionar Network:
# Las requests deben ir a: https://tusommeliervirtual.com/api/conversation
# (Nginx las redirecciona internamente a http://backend:8000/conversation)
```

---

## 📋 Headers HTTP Enviados por Nginx

Cuando el backend recibe un request desde Nginx, verá estos headers:

```http
POST /conversation HTTP/1.1

Host: tusommeliervirtual.com
X-Real-IP: 203.0.113.45              ← IP real del cliente
X-Forwarded-For: 203.0.113.45         ← Cadena de IPs
X-Forwarded-Proto: https              ← Protocolo original (HTTPS)
X-Forwarded-Host: tusommeliervirtual.com
X-Forwarded-Port: 443                 ← Puerto original (HTTPS)

Content-Type: application/json
Content-Length: 123

{"text": "Hola LLM..."}
```

---

### 💡 Cómo Usar Estos Headers en Python Backend

```python
# backend/main.py

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/conversation', methods=['POST'])
def conversation():
    # Obtener IP real del cliente (desde Nginx)
    client_ip = request.headers.get('X-Real-IP', request.remote_addr)
    
    # Obtener protocolo original
    scheme = request.headers.get('X-Forwarded-Proto', 'http')
    
    # Obtener host original
    host = request.headers.get('X-Forwarded-Host', request.host)
    
    print(f"Cliente IP: {client_ip}")
    print(f"URL Original: {scheme}://{host}{request.path}")
    
    # Procesar request
    data = request.get_json()
    
    return jsonify({
        "reply": "Respuesta del LLM",
        "status": "success"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```

---

## 🌐 Rutas Finales

### Desarrollo Local
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
API URL:   http://localhost:8000/conversation
```

### Producción con Nginx
```
Frontend:  https://tusommeliervirtual.com
API URL:   https://tusommeliervirtual.com/api/conversation
Backend:   http://backend:8000 (solo accesible internamente)
```

---

## ⚙️ Variables de Entorno

### Para Override de Backend URL (Opcional)

En `my-tavus-app/.env.production`:

```env
# Si necesitas un backend diferente:
VITE_BACKEND_URL=https://api.otro-dominio.com

# O para testing:
VITE_BACKEND_URL=http://backend-test:8000
```

Luego build con:

```bash
npm run build
```

Y el frontend usará esa URL en lugar de `/api`.

---

## 🔍 Monitoreo

### Ver requests que llegan al backend

```bash
# En la terminal del backend
docker logs -f backend

# O si corre en máquina local
tail -f /path/to/backend/logs.txt
```

### Ver requests en Nginx

```bash
# Access log
tail -f /var/log/nginx/tusommelier_access.log

# Filtrar solo /api
grep "/api" /var/log/nginx/tusommelier_access.log

# Error log
tail -f /var/log/nginx/tusommelier_error.log
```

---

## ✅ Checklist para Developers

- [ ] Actualicé `src/App.tsx` con `getBackendUrl()` nuevo
- [ ] Compilé frontend: `npm run build`
- [ ] Copié archivos a `/var/www/frontend`
- [ ] Recarguć Nginx: `systemctl reload nginx`
- [ ] Testé en navegador: `https://tusommeliervirtual.com`
- [ ] Inspeccioné Network tab
- [ ] Verificué que `/api/conversation` funciona
- [ ] Checqueé logs: `tail -f /var/log/nginx/tusommelier_access.log`
- [ ] Backend recibe requests con headers correctos

---

## 🚨 Common Issues

### Issue 1: Frontend intenta conectar a `http://backend:8000`

**Problema:** El frontend está usando `http://backend:8000` todavía.

**Solución:**
```bash
# 1. Verificar que App.tsx tiene el código correcto
grep -A 5 "getBackendUrl" src/App.tsx | grep "/api"

# 2. Si no está, editar manualmente
# 3. Compilar y copiar

npm run build
cp -r dist/* /var/www/frontend/
systemctl reload nginx
```

---

### Issue 2: Backend devuelve 502 Bad Gateway

**Problema:** Nginx no puede conectar al backend.

**Solución:**
```bash
# 1. Verificar backend está corriendo
docker ps | grep backend

# 2. Verificar que backend escucha en puerto 8000
docker exec backend netstat -tulpn | grep 8000

# 3. Ver logs del backend
docker logs -f backend

# 4. Test directo (desde dentro del docker)
docker exec nginx curl http://backend:8000/health
```

---

### Issue 3: CORS errors en navegador

**Síntoma:**
```
Access to XMLHttpRequest at 'https://tusommeliervirtual.com/api/conversation' 
from origin 'https://tusommeliervirtual.com' has been blocked by CORS policy
```

**Solución:**
Backend necesita permitir requests desde el mismo origen:

```python
# backend/main.py

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Permitir CORS desde el mismo dominio
CORS(app, resources={r"/*": {"origins": "https://tusommeliervirtual.com"}})

# O más permisivo:
CORS(app)

@app.route('/conversation', methods=['POST'])
def conversation():
    ...
```

O en Nginx (agregar al bloque `/api/`):

```nginx
location /api/ {
    proxy_pass http://backend:8000/;
    
    # Headers CORS (si el backend no los agrega)
    add_header 'Access-Control-Allow-Origin' '$http_origin' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # Headers de proxy...
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    # ...
}
```

---

## 📊 Diagrama de Flujo

```
Cliente (navegador en tusommeliervirtual.com)
       ↓
fetch('/api/conversation', {
  method: 'POST',
  body: JSON.stringify({...})
})
       ↓
Nginx (escucha en puerto 443)
       ↓
       ├─ Detecta: URL comienza con /api/
       │
       └─ Aplica: proxy_pass http://backend:8000/
           ├─ Agrega headers: X-Real-IP, X-Forwarded-Proto, etc
           ├─ Reenvía a: http://backend:8000/conversation
           │
           ↓
       Backend Python (http://backend:8000)
           ├─ Recibe request con headers originales
           ├─ Procesa: LLM, Tavus API, etc
           │
           ↓ Respuesta
           
       Nginx
           ├─ Recibe respuesta del backend
           ├─ La envía al cliente
           │
           ↓
       Cliente (navegador)
           ├─ Recibe respuesta
           ├─ React actualiza el estado
           ├─ UI muestra resultado
```

---

## 📞 Contacto & Soporte

Para problemas específicos:

1. Revisar `/var/log/nginx/tusommelier_access.log`
2. Revisar `/var/log/nginx/tusommelier_error.log`
3. Ver logs del backend: `docker logs -f backend`
4. Inspeccionar Network tab en Chrome DevTools
5. Verificar curl directo: `curl https://tusommeliervirtual.com/api/health`

---

*Configuración actualizada para Espacio Sommelier* 🍷
