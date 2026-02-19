# GitHub Actions - Permisos (Least Privilege Guide)

## 📋 Referencia Rápida de Permisos

### Estructura en Workflows

```yaml
# Máximo nivel (aplica a todos los jobs)
permissions:
  contents: read
  
jobs:
  job1:
    # Sobrescribe el máximo nivel para este job
    permissions:
      contents: write
```

---

## 📦 Permisos Disponibles

| Permiso | Niveles | Descripción |
|---------|---------|------------|
| `actions` | read, write | Manage GitHub Actions |
| `checks` | read, write | Write run reports, status |
| `contents` | read, write, admin | Git push/pull, releases |
| `deployments` | read, write | GitHub Deployments |
| `id-token` | read, write | OpenID Connect tokens |
| `issues` | read, write | Create/edit issues |
| `discussions` | read, write | Manage discussions |
| `pages` | read, write | GitHub Pages |
| `packages` | read, write | Publish to GitHub Registry |
| `pull-requests` | read, write | PR operations |
| `repository-projects` | read, write | Project boards |
| `security-events` | read, write | CodeQL/SAST events |
| `statuses` | read, write | Commit status |

---

## 🔐 Patrones por Caso de Uso

### 1. CI (Testing & Validation)

```yaml
permissions:
  contents: read       # Checkout code
  checks: write        # Report test results
  pull-requests: read  # Access PR context
```

**Usado en**: `ci.yml` (lint, build, test)

---

### 2. Deploy (Docker + SSH)

```yaml
permissions:
  contents: read       # Checkout code
  # Secrets se pasan sin necesidad de permisos adicionales
```

**Usado en**: `deploy.yml` (Docker build/push, SSH deploy)

---

### 3. Release (Create Release)

```yaml
permissions:
  contents: write      # Create releases
  packages: write      # Publish packages
```

---

### 4. Pages (GitHub Pages)

```yaml
permissions:
  contents: read
  pages: write
  id-token: write      # OIDC token for deployment
```

---

### 5. Container Registry Push

```yaml
permissions:
  contents: read
  packages: write      # Publish to ghcr.io
```

---

### 6. Cloud Deployments (AWS/GCP/Azure)

```yaml
permissions:
  contents: read
  id-token: write      # OpenID Connect token
```

---

## 🚀 Ejemplos Completos

### Ejemplo 1: Workflow CI Básico

```yaml
name: CI

on: [push, pull_request]

permissions:
  contents: read
  checks: write
  pull-requests: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

### Ejemplo 2: Workflow Deploy

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USER }}
          password: ${{ secrets.DOCKER_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
```

### Ejemplo 3: Release Automation

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
```

---

## 🔍 Cómo Verificar Permisos en GitHub

### Método 1: En Settings del Repo

1. Settings → Actions → General
2. Workflow permissions → "Read repository contents permission"

### Método 2: En Workflow Run

1. Click en workflow run
2. Expandir "Permissions" en summary

### Método 3: CLI

```bash
# Ver permisos de un token
gh api /user --jq '.permissions'
```

---

## ⚠️ Errores Comunes

### Error 1: "Insufficient permissions"

```
Error: Resource not accessible by integration
```

**Solución**: Agregar permiso necesario

```yaml
permissions:
  pull-requests: write  # Si falta este
```

---

### Error 2: "Scope not found"

```
Error: Undefined scope: 'deploy'
```

**Solución**: Solo usar permisos válidos (check table arriba)

---

## 📚 Recursos

- [GitHub Docs: Permissions for GitHub Actions](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs)
- [OIDC in GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Workflow Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## ✅ Checklist para tus Workflows

- [ ] Cada workflow tiene `permissions:` definido
- [ ] Usa mínimos permisos necesarios (least privilege)
- [ ] `contents: read` es el default para la mayoría
- [ ] `contents: write` solo si modificas el repo
- [ ] No uses `permissions: write-all`
- [ ] Revisa permisos después de actualizar acciones
