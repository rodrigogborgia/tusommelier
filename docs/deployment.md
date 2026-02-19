# Deployment (Staging)

This repository supports building and pushing a Docker image to GitHub Container Registry (GHCR) via the `Deploy Staging` workflow.

Secrets to set in GitHub:
- `GITHUB_TOKEN` (provided automatically in Actions)
- `SENTRY_DSN` (optional)

How it works:

- On push to `main`, `.github/workflows/deploy-staging.yml` builds the repository Docker image and pushes it to `ghcr.io/<org>/tusommelier:staging-<sha>`.
- You can deploy that image to your cloud provider (Kubernetes, Render, Fly, etc.).

Local testing:

```bash
# build locally
docker build -t tusommelier:local .
# run backend
docker run -p 8000:8000 tusommelier:local
```

If you prefer automatic deploys to a provider (Vercel/Render/Heroku), I can add provider-specific workflows next.
