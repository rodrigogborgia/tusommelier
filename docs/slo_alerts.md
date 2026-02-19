# SLOs and Alerting

This document contains recommended Service Level Objectives (SLOs) and example
Prometheus alerting rules to get you started. Adjust thresholds to match your
traffic and business needs.

## Recommended SLOs

- Availability (Golden): 99.9% uptime for `/health` (per 30-day window).
- Error rate: < 1% of requests returning 5xx per 5 minute window.
- Latency: 95th percentile of request latency < 300ms for critical endpoints
  (`/conversation`, `/health`).

## Example Prometheus recording rules (for request latency and error rate)

```yaml
groups:
  - name: tusommelier.rules
    rules:
      - record: job:http_inprogress_requests:sum
        expr: sum(http_inprogress_requests)

      - record: http_request_duration_seconds_p95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

      - record: http_requests_total_rate
        expr: sum(rate(http_requests_total[5m]))

      - record: http_responses_5xx_rate
        expr: sum(rate(http_responses_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

## Example Prometheus alert rules

```yaml
groups:
  - name: tusommelier.alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_responses_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High 5xx error rate for tusommelier
          description: "Error rate > 1% for 5 minutes."

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High request latency (p95 > 300ms)

      - alert: ServiceDown
        expr: up{job="tusommelier-backend"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: Backend service down
```

## PagerDuty / Ops

- Configure alert routing: `critical` → paging on-call; `warning` → Slack channel.
- Add runbook links in the alert annotations explaining remediation steps.

## Next steps

- Expose metrics in your app (Prometheus client already added with `/metrics`).
- Create Grafana dashboards: uptime, requests/sec, p95 latency, error rate.
- Tune thresholds after observing real traffic for 1–2 weeks.
