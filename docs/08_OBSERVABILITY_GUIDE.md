# 08: Production Observability & Monitoring Guide

## Overview
CRIMENEXUS incorporates a production-grade observability stack built on **Prometheus metrics**, **Sentry exception tracking**, and **structured JSON logging via `structlog`**. This architecture enables command center technical staff and DevOps engineers to monitor system health, detect operational bottlenecks, and track model inference performance in real time.

---

## 1. Prometheus Metrics (`/metrics`)

CRIMENEXUS exposes standard Prometheus metrics at the root endpoint:
```
GET /metrics
```

### Core Metric Definitions

| Metric Name | Type | Description | Labels |
|---|---|---|---|
| `crimenexus_http_requests_total` | Counter | Total incoming HTTP API calls | `method`, `endpoint`, `status_code` |
| `crimenexus_http_request_duration_seconds` | Histogram | Request latency distribution | `method`, `endpoint` |
| `crimenexus_ml_inference_seconds` | Histogram | ML inference latency (NER, SHAP, Isolation Forest) | `model_name` |
| `crimenexus_active_custody_records_total` | Gauge | Active suspects under legal custody tracking | None |
| `crimenexus_redis_stream_lag_events` | Gauge | Lag in event processing per stream topic | `stream_name` |
| `crimenexus_alerts_generated_total` | Counter | Automated investigative alerts triggered | `alert_type`, `severity` |
| `crimenexus_smurfing_detections_total` | Counter | Financial smurfing patterns flagged | None |
| `crimenexus_fir_ingestions_total` | Counter | FIR documents ingested and parsed | `status` |

### Prometheus Scrape Configuration
Add the following target to your Prometheus server `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'crimenexus-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['crimenexus-backend:8000']
    metrics_path: '/metrics'
```

---

## 2. Sentry Exception Tracking

### Configuration
Set the `SENTRY_DSN` environment variable:
```bash
SENTRY_DSN=https://your-sentry-key@o123456.ingest.sentry.io/1234567
ENVIRONMENT=production
APP_VERSION=1.0.0
```

### Features Enabled
- **Automatic FastAPI Integration:** Captures unhandled 5xx exceptions with full request metadata (excluding PII).
- **SQLAlchemy Query Performance Tracing:** Identifies slow queries on PostgreSQL.
- **Trace Sampling:** Configured to sample 10% of standard transactions to prevent network overhead on police intranets.

---

## 3. Structured JSON Logging (`structlog`)

All backend logs are formatted as single-line JSON objects adhering to standard enterprise SIEM ingestion standards (Splunk, Elastic, Graylog):

```json
{
  "event": "fir_ingestion_completed",
  "level": "info",
  "logger": "crimenexus.ml.ner",
  "timestamp": "2026-10-31T16:20:00.123456Z",
  "case_id": "FIR-2026-DEL-9812",
  "entities_extracted": 6,
  "execution_time_ms": 32.4
}
```

### Context Propagation
Trace IDs and request IDs are automatically bound to log contexts, allowing complete audit reconstruction across asynchronous worker threads and Redis streams.
