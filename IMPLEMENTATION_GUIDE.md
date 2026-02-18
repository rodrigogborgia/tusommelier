# Guía de Implementación - Silencio Controlado y Continuidad de Sesiones

## 📋 Resumen de Cambios

Se ha implementado un sistema de gestión de sesiones del avatar con tres características principales:

### 1. **Silencio Controlado** ⏱️
- **Timeout automático**: Si pasan **2 minutos sin interacción**, la sesión del avatar se cierra automáticamente
- **Configuración**: 
  - Backend: `participant_left_timeout: 120000` (en milisegundos) en la API de Tavus
  - Frontend: Variable de entorno `VITE_INACTIVITY_LIMIT` o default 120 segundos
- **Monitoreo de actividad**: 
  - Detecta clicks, movimiento de mouse, teclado, touchscreen
  - Monitorea nivel de audio del micrófono en tiempo real

### 2. **Retomar con Continuidad** 🔄
- **Contexto guardado**: Cuando la sesión cierra (por timeout o manualmente), se guarda un contexto conversacional
- **Almacenamiento**: El contexto se guarda en `localStorage` con la clave `tavus_conversational_context`
- **Reanudación**: Al tocar "Retomar Conversación Anterior", el avatar rearranca con el contexto previo
- **Flujo**:
  1. Sesión cierra por inactividad
  2. Usuario ve mensaje: "La sesión se cerró por inactividad"
  3. En pantalla principal ve DOS botones:
     - "Iniciar Conversación Nueva" → Limpia contexto, comienza de cero
     - "Retomar Conversación Anterior" → Reanuda con contexto guardado

### 3. **Empezar de Cero** 🆕
- **Nuevo participante**: Botón para iniciar una conversación completamente nueva
- **Limpia contexto**: Borra el contexto anterior del localStorage
- **Estado limpio**: Comienza como si fuera la primera interacción

---

## 🔧 Cambios Técnicos

### Frontend

#### `src/components/cvi/api.ts`
```typescript
// Actualizado createConversation() para:
- Aceptar parámetro opcional: conversationalContext
- Incluir participant_left_timeout: 120000
- Pasar contexto a Tavus API

// Nuevas funciones:
- saveConversationalContext(context: string)
- getConversationalContext(): string | null
- clearConversationalContext()
```

#### `src/App.tsx`
```typescript
// Nuevos estados:
- conversationalContext: null | string
- hasContextAvailable: boolean

// Nueva lógica:
- Verificar contexto guardado al montar componente
- Dos botones: "Nueva" vs "Retomar"
- Pasar contexto al crear conversación
```

#### `src/components/cvi/components/conversation/index.tsx`
```typescript
// Interface actualizada:
- onLeave: (context?: string) => void
- onSaveContext?: (context: string) => void

// Lógica de inactividad:
- Guardar contexto cuando se alcanza INACTIVITY_LIMIT
- Pasar contexto al callback onLeave
```

### Backend

#### `backend/main.py`
```python
@app.post("/conversation")
# Ahora acepta:
- conversational_context: Optional (para futuro historial)
# Log de reanudación cuando hay contexto
```

---

## 🧪 Cómo Probar

### Prueba del Timeout Automático:

1. Iniciar conversación: Click en "Iniciar Conversación Nueva"
2. **No interactuar durante 2 minutos** (no mover mouse, no hablar, no tocar pantalla)
3. Verás el mensaje: "La sesión se cerró por inactividad"
4. En ese momento aparecerán dos botones

### Prueba de Continuidad:

1. Iniciar conversación
2. Esperar ~2 minutos sin interactuar (o usar la console para forzar: `window.dispatchEvent(new Event('tavus-test-force-inactivity'))`)
3. Ver mensaje de inactividad
4. Click en "Retomar Conversación Anterior"
5. Verificar que la nueva sesión inicia con el contexto guardado

### Prueba de Nueva Conversación:

1. Cualquier sesión anterior guardará contexto
2. Cierra sesión o espera timeout
3. Click en "Iniciar Conversación Nueva" (no en "Retomar")
4. localStorage se limpia
5. Comienza conversación sin contexto previo

---

## 🔐 Storage Local

El contexto se guarda en `localStorage` bajo la clave:
```
tavus_conversational_context
```

**Formato del contexto** (JSON):
```json
{
  "timestamp": "2026-02-18T15:30:45.123Z",
  "reason": "inactivity_timeout",
  "lastActivityTime": "2026-02-18T15:28:45.123Z"
}
```

---

## 📝 Próximos Pasos (Opcional)

1. **Historial de mensajes**: Guardar mensajes anteriores en el contexto
2. **API de Tavus mejorada**: Usar el contexto de Tavus directamente (no solo localStorage)
3. **Base de datos**: Guardar contexto en servidor para sesiones multi-dispositivo
4. **UI mejorada**: Mostrar resumen de conversación anterior al retomar

---

## ⚙️ Variables de Entorno

Asegurate de que `.env` en frontend tenga:

```env
VITE_TAVUS_API_KEY=your_key_here
VITE_REPLICA_ID=rf4e9d9790f0
VITE_PERSONA_ID=pcb7a34da5fe
VITE_INACTIVITY_LIMIT=120  # en segundos (opcional, default 120)
```

---

## 🐛 Debugging

Si necesitas activar logs o probar:

```javascript
// En console del navegador:

// Ver contexto guardado:
localStorage.getItem('tavus_conversational_context')

// Limpiar contexto:
localStorage.removeItem('tavus_conversational_context')

// Forzar timeout (en tests):
window.dispatchEvent(new Event('tavus-test-force-inactivity'))
```

---

## ✅ Checklist de Implementación

- [x] `participant_left_timeout` configurado en Tavus API
- [x] Monitoreo de inactividad en frontend (2 minutos)
- [x] Guardado de contexto en localStorage
- [x] Botón "Retomar Conversación"
- [x] Botón "Nueva Conversación"
- [x] Limpiar contexto cuando es "nueva"
- [x] Backend aceptar contexto
- [x] Mensajes claros de UX

