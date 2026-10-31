# CRIMENEXUS CCTNS & ICJS National Police Grid Integration Guide

## 1. Executive Summary
This document provides technical instructions for State Police IT Wings, National Crime Records Bureau (NCRB) integration leads, and Centre for Development of Advanced Computing (C-DAC) engineers to connect CRIMENEXUS with live Crime and Criminal Tracking Network & Systems (CCTNS) and Inter-operable Criminal Justice System (ICJS) endpoints.

---

## 2. Architecture Overview
CRIMENEXUS uses a decoupled adapter architecture (`backend/app/services/external/cctns_adapter.py`) ensuring:
- **Resilient Connectivity:** Automatic exponential backoff retries (3 attempts).
- **Zero-Trust Audit Logging:** Cryptographic HMAC-SHA256 signatures for every state API transaction to satisfy Section 65B Indian Evidence Act / Section 63 Bharatiya Sakshya Adhiniyam standards.
- **Dual-Database Ingestion:** Automatically synchronizes CCTNS entities into PostgreSQL relational tables and Neo4j syndicate graph topology.

---

## 3. Configuration & Environment Variables

To transition from the offline demonstration mock adapter to live State/National CCTNS gateways, set the following environment variables in `.env`:

```ini
# National CCTNS Gateway URL (Provided by NCRB / State Police HQ)
CCTNS_BASE_URL=https://cctns.police.gov.in/api/v2

# Secure API Token issued by NCRB / State IT Cell
CCTNS_API_KEY=YOUR_SECURE_STATE_POLICE_TOKEN_HERE

# ICJS e-Courts Gateway URL
ICJS_BASE_URL=https://icjs.gov.in/api/v1

# HMAC Secret Key for Cryptographic Evidence Audit Ledger
CCTNS_HMAC_SECRET=your_super_secret_audit_key_here
```

---

## 4. Replacing Mock Logic with Live REST Endpoints

In `backend/app/services/external/cctns_adapter.py`, update `fetch_fir()` and `sync_case_history()` to make live HTTPS requests using `httpx` or `requests`:

```python
import httpx

@retry_with_backoff(max_retries=3, initial_delay=0.1)
def fetch_fir(self, fir_number: str) -> Dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {self.api_key}",
        "X-Police-Agency-ID": "DL-POLICE-CYBER-01",
        "Content-Type": "application/json"
    }
    with httpx.Client(timeout=10.0, verify="/etc/ssl/certs/cctns_ca.crt") as client:
        response = client.get(f"{self.base_url}/fir/{fir_number}", headers=headers)
        response.raise_for_status()
        fir_data = response.json()
        
    self._log_audit_call(f"/cctns/fir/{fir_number}", fir_number, response.status_code)
    return {
        "source": "CCTNS_LIVE_GATEWAY",
        "status": "SUCCESS",
        "fir_data": fir_data
    }
```

---

## 5. Security & Legal Compliance
- **TLS 1.3:** Mutual TLS (mTLS) client certificate verification should be configured via the `verify` parameter.
- **Section 102 CrPC / Sec 106 BNSS Compliance:** Every external database query is immutable and timestamped in the audit log.
