# 🔒 Security Fixes - Dependabot & CodeQL

Este documento detalla todos los cambios de seguridad aplicados para resolver alertas de Dependabot y CodeQL.

---

## 1. Vulnerabilidades de Dependencias

### ✅ Actualización: `requests` (pip)

**Problema**: Vulnerabilidad en urllib3 (transitive dependency de requests 2.31.0)
- **Versión anterior**: `requests==2.31.0`
- **Versión nueva**: `requests==2.32.3`
- **Archivo**: `backend/requirements.txt`

```diff
- requests==2.31.0
+ requests==2.32.3
```

**Verificación**:
```bash
cd /Users/rodrigoborgia/tusommelier
pip install -r backend/requirements.txt
pip show requests  # Verifica versión instalada
```

---

## 2. Clear-Text Logging de Secretos (CodeQL)

### 🚨 CRÍTICO: Backend - OpenAI API Key

**Archivo**: `backend/main.py`

**Antes**:
```python
# Inicializar cliente de OpenAI
api_key = os.getenv("OPENAI_API_KEY")
print("API KEY:", api_key)  # ❌ LOGGING DE SECRETO

client = OpenAI(api_key=api_key)
```

**Después**:
```python
# Inicializar cliente de OpenAI
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")  # ✅ FAIL-FAST

client = OpenAI(api_key=api_key)
```

---

### 🚨 CRÍTICO: Tavus Client - API Key

**Archivo**: `src/tavus_client.py`

**Antes**:
```python
class TavusClient:
    def __init__(self):
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("TAVUS_API_URL", "https://api.tavus.io/v2")
        self.api_key = os.getenv("TAVUS_API_KEY", "")
        print(f"[DEBUG] Tavus API Key: {self.api_key}")  # ❌ LOGGING DE SECRETO
```

**Después**:
```python
class TavusClient:
    def __init__(self):
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("TAVUS_API_URL", "https://api.tavus.io/v2")
        self.api_key = os.getenv("TAVUS_API_KEY", "")
        # Verify that API key is loaded (don't log the actual key)
        if not self.api_key:
            raise ValueError("TAVUS_API_KEY not found in environment variables")  # ✅ FAIL-FAST
```

---

### 🚨 CRÍTICO: LiveKit Client - API Key & Secret

**Archivo**: `src/livekit_client.py`

**Antes**:
```python
class LiveKitClient:
    def __init__(self):
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("LIVEKIT_API_URL", "http://localhost:7880")
        self.api_key = os.getenv("LIVEKIT_API_KEY", "")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET", "")
        print(f"[DEBUG] LiveKit API Key: {self.api_key}")  # ❌ LOGGING DE SECRETO
        print(f"[DEBUG] LiveKit API Secret: {self.api_secret}")  # ❌ LOGGING DE SECRETO
```

**Después**:
```python
class LiveKitClient:
    def __init__(self):
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("LIVEKIT_API_URL", "http://localhost:7880")
        self.api_key = os.getenv("LIVEKIT_API_KEY", "")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET", "")
        # Verify credentials are loaded (don't log the actual keys)
        if not self.api_key or not self.api_secret:
            raise ValueError("LiveKit credentials not found in environment variables")  # ✅ FAIL-FAST
```

---

### ⚠️ Información Sensible: Contexto Conversacional

**Archivo**: `backend/main.py`

**Antes**:
```python
if conversational_context:
    print(f"Reanudando conversación con contexto: {conversational_context[:100]}...")  # ❌ PII
```

**Después**:
```python
if conversational_context:
    # Don't log conversational context (may contain sensitive user data)
    print("[INFO] Resuming conversation with saved context")  # ✅ SAFE
```

---

### ⚠️ Respuestas API Sensibles: Tavus Response Body

**Archivo**: `src/tavus_client.py`

**Antes**:
```python
response = requests.get(f"{self.api_url}/videos", headers=headers, timeout=10)
print(f"[DEBUG] Tavus status: {response.status_code}")
print(f"[DEBUG] Tavus body: {response.text}")  # ❌ Response body may contain secrets
```

**Después**:
```python
response = requests.get(f"{self.api_url}/videos", headers=headers, timeout=10)
# Log status code only, not response body (may contain sensitive data)
if response.status_code != 200:
    print(f"[WARNING] Tavus connection failed with status: {response.status_code}")  # ✅ SAFE
return response.status_code == 200
```

---

## 3. GitHub Actions Security (CodeQL)

### ✅ CI Workflow - Permisos Explícitos

**Archivo**: `.github/workflows/ci.yml`

**Cambios**:
```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:  # ✅ AGREGADO: Permisos explícitos
  contents: read
  pull-requests: read
  checks: write

jobs:
  # ... resto del workflow
```

**Justificación**:
- `contents: read` - Necesario para `checkout`
- `pull-requests: read` - Necesario para acceder a PR context
- `checks: write` - Para reportar resultados de tests (vitest, pytest)

---

### ✅ Deploy Workflow - Permisos Explícitos

**Archivo**: `.github/workflows/deploy.yml`

**Cambios**:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

permissions:  # ✅ AGREGADO: Permisos mínimos
  contents: read

jobs:
  # ... resto del workflow
```

**Justificación**:
- `contents: read` - Solo necesario para `checkout`
- No se requieren permisos `write` (los secretos se pasan vía `secrets.*`)
- Los secretos `DOCKERHUB_TOKEN`, `DEPLOY_KEY` no necesitan permisos adicionales

---

## 4. Mejores Prácticas Aplicadas

### ✅ Fail-Fast con Validación de Secretos

**Patrón Seguro**:
```python
# ❌ ANTES: Silent failure
self.api_key = os.getenv("API_KEY", "")

# ✅ DESPUÉS: Explicit error
api_key = os.getenv("API_KEY")
if not api_key:
    raise ValueError("API_KEY not found in environment variables")
```

**Beneficio**: Errores claros en CI/CD antes de desplegar.

---

### ✅ Logging Seguro

**Patrones**:

1. **Status Code (SAFE)**:
   ```python
   print(f"[WARNING] Request failed: {response.status_code}")  # ✅ OK
   ```

2. **Con Sanitización (SAFE)**:
   ```python
   # Para tokens, mostrar sin revelar valor completo
   masked_key = api_key[:4] + "***" + api_key[-4:]  # ✅ SEGURO
   print(f"Using key: {masked_key}")
   ```

3. **Solo en Development (SAFE)**:
   ```python
   import logging
   logger = logging.getLogger(__name__)
   
   if os.getenv("DEBUG") == "true":
       logger.debug(f"Using endpoint: {self.api_url}")  # ✅ Solo si DEBUG=true
   ```

---

### ✅ Workflow Permisos Mínimos

**Principio de Least Privilege**:
- Siempre usar `permissions:` en raíz del workflow
- Especificar solo lo necesario por job
- Revisar [GitHub Actions Permissions](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)

**Permisos Comunes**:
| Permiso | Uso |
|--------|-----|
| `contents: read` | Necesario para `checkout` |
| `contents: write` | Solo si push a repo (release, changelog) |
| `pull-requests: read` | Acceder a información de PR |
| `checks: write` | Reportar test results |
| `packages: write` | Push a GitHub Container Registry |
| `id-token: write` | OIDC (deployments a AWS, GCP, Azure) |

---

## 5. Verificación Post-Fix

### ✅ Verificar que los secretos no se loguean

```bash
cd /Users/rodrigoborgia/tusommelier

# Buscar strings de logging que podrían exponer secretos
grep -r "print.*api_key\|print.*secret\|print.*token" --include="*.py" src/ backend/

# Resultado esperado: nada (sin matches)
```

### ✅ Verificar que las env vars se validan

```bash
# Intentar correr sin OPENAI_API_KEY
unset OPENAI_API_KEY
python -c "from backend.main import app; print('Successfully loaded')"

# Resultado esperado: ValueError: OPENAI_API_KEY not found in environment variables
```

### ✅ Revisar alertas en GitHub

1. Ve a: `https://github.com/rodrigogborgia/tusommelier/security/dependabot`
2. Verifica que las vulnerable versions estén resueltas

---

## 6. Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `backend/requirements.txt` | Bump `requests` 2.31.0 → 2.32.3 |
| `src/tavus_client.py` | Remover logging de API key, sanitizar logs |
| `backend/main.py` | Remover logging de OpenAI key, contexto |
| `src/livekit_client.py` | Remover logging de LiveKit credentials |
| `.github/workflows/ci.yml` | Agregar `permissions:` explícitos |
| `.github/workflows/deploy.yml` | Agregar `permissions:` explícitos |

---

## 7. Próximos Pasos Recomendados

- [ ] Revisar Dependabot alerts regularmente: habilitar auto-merge para patches
- [ ] Considerar usar un secrets manager (HashiCorp Vault, AWS Secrets Manager)
- [ ] Implementar logging centralizado (CloudWatch, DataDog, Sentry)
- [ ] Auditar commits anteriores: `git log --all --grep="secret\|key" --grep="password"` 
- [ ] Agregar pre-commit hooks para evitar commits con secretos:
  ```bash
  # Instalar
  pip install detect-secrets pre-commit
  detect-secrets scan > .secrets.baseline
  # pre-commit install
  ```

---

**Commit**: `c5b41e0`  
**Fecha**: 2026-02-18  
**Estado**: ✅ RESUELTO - Esperando confirmación de Dependabot y CodeQL en próxima ejecución
