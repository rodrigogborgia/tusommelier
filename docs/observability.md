# Observability

This project exposes basic observability hooks:

- Sentry for error reporting (backend) — set `SENTRY_DSN` in GitHub Secrets.
- Prometheus metrics: backend exposes `/metrics` (Prometheus `text/plain; version=0.0.4`).

Quick setup:

- Add `SENTRY_DSN` to repository Secrets (Settings → Secrets) to enable Sentry.
- Configure your Prometheus to scrape `http(s)://<backend-host>/metrics`.

Suggested alerts / SLOs:

- Availability SLO: 99.9% uptime on `/health`.
- Error rate SLO: <1% 5xx errors in production per 5m window.
- Latency SLO: 95th percentile response time < 300ms for main endpoints.

Integrations:

- Sentry: set `SENTRY_DSN`, then errors will be sent automatically.
- Prometheus/Grafana: add scrape target and create dashboards for request counts, error rates and latency.
