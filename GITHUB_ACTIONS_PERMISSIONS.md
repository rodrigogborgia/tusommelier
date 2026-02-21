# GitHub Actions Permissions

## Workflows actuales

- `1- CI`
- `2 - Deploy Staging`
- `3 - Deploy Production`
- `E2E Tests`
- `Dependabot Auto-Merge`

## Permisos mínimos sugeridos

### CI / E2E

```yaml
permissions:
  contents: read
  pull-requests: read
  checks: write
  security-events: write
```

### Deploy Staging

```yaml
permissions:
  contents: read
```

### Deploy Production (SSH)

```yaml
permissions:
  contents: read
```

### Dependabot Auto-Merge

```yaml
permissions:
  actions: read
  pull-requests: write
  contents: write
```

## Secrets requeridos para Deploy Production

- `SERVER_HOST`
- `SERVER_USER`
- `DEPLOY_KEY`

No se requiere Docker Hub ni GHCR para el deploy actual.
