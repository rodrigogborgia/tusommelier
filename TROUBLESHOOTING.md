# 🔧 Troubleshooting - ERR_CONNECTION_REFUSED

## ✅ Soluciones Implementadas

### 1. **CORS Ampliado en Backend** 
```python
# backend/main.py
origins = [
    "http://localhost:3000",          # desarrollo local
    "http://localhost:5173",          # vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://frontend:3000",           # desde Docker
    "https://tusommeliervirtual.com", # producción
]
```

### 2. **URL Inteligente del Backend**
El frontend ahora detecta automáticamente dónde está:

```typescript
const getBackendUrl = () => {
  const backendEnv = import.meta.env.VITE_BACKEND_URL;
  if (backendEnv) return backendEnv;
  
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "http://backend:8000"; // Docker
  }
  
  return "http://localhost:8000"; // Desarrollo
};
```

### 3. **Health Check Endpoint**
```python
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tusommelier-backend"}
```

### 4. **Manejo de Errores Mejorado**
El frontend ahora muestra errores claros si la conexión falla:

```typescript
if (!backendResponse.ok) {
  throw new Error(`Error del backend: ${backendResponse.status} ${backendResponse.statusText}`);
}
```

---

## 🚀 Uso en Docker

### Desarrollo Local
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend con Vite
cd my-tavus-app
npm run dev
```

### Docker Compose
```bash
# Asegúrate de tener .env.local con VITE_BACKEND_URL=http://backend:8000
docker-compose up
```

---

## 🧪 Pruebas

### Test del Endpoint Localmente
```bash
curl -X POST http://localhost:8000/conversation \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola"}'
```

### Test del Health Check
```bash
curl http://localhost:8000/health
```

### Test desde Docker
```bash
# Dentro del contenedor del frontend
curl http://backend:8000/health
```

---

## ❌ Errores Comunes

### `ERR_CONNECTION_REFUSED`
- ✅ Backend no está corriendo
- ✅ Puerto 8000 no está correctamente mapeado en docker-compose
- ✅ Frontend intenta `http://localhost:8000` desde Docker (solución: usar `http://backend:8000`)

### `CORS Error`
- ✅ Origen no está en la lista de `allowed_origins`
- ✅ Ver el error de console para identificar qué origen rechazó el servidor

### `SyntaxError` en respuesta del backend
- ✅ La API key de OpenAI no está configurada en `config/secrets.env`
- ✅ El endpoint `/conversation` no recibió un JSON válido

---

## 📝 Variables de Entorno

### Backend (`config/secrets.env`)
```env
OPENAI_API_KEY=sk-xxxxx
```

### Frontend (`.env.local`)
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_TAVUS_API_KEY=xxxxx
VITE_REPLICA_ID=xxxxx
VITE_PERSONA_ID=xxxxx
VITE_INACTIVITY_LIMIT=120
```

---

## 🔍 Debug

### Ver logs del backend
```bash
curl -v http://localhost:8000/conversation
```

### Ver qué hostname detecta el frontend
Abre la consola del navegador:
```javascript
console.log(window.location.hostname)
```

### Monitorear tráfico de red
En DevTools → Network → fetch/XHR y busca requests a `/conversation`

---

## 📚 Recursos

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [Docker Networking](https://docs.docker.com/network/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
