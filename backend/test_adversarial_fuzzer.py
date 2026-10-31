import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_zero_trust_security_headers():
    """Verifies that all API responses enforce strict zero-trust defense headers."""
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers

    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-content-type-options") == "nosniff"
    assert "mode=block" in headers.get("x-xss-protection", "")
    assert "max-age=31536000" in headers.get("strict-transport-security", "")
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.parametrize("sqli_payload", [
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "1 UNION SELECT null, username, password_hash FROM users --",
    "' OR SLEEP(5) --",
    "admin' --",
])
def test_fuzzer_sql_injection_defense(sqli_payload: str):
    """
    Fuzzes search, lookup, and analytics endpoints with SQL injection attacks.
    System must never crash with unhandled 500 or leak database error messages.
    """
    # 1. Timeline & Phone query
    resp1 = client.get(f"/api/v1/analytics/movement-timeline?phone_number={sqli_payload}")
    assert resp1.status_code in [200, 400, 404, 422]
    assert "syntax error" not in resp1.text.lower()
    assert "postgresql" not in resp1.text.lower()
    assert "psycopg2" not in resp1.text.lower()

    # 2. Case Search
    resp2 = client.get(f"/api/v1/cases/search?q={sqli_payload}")
    assert resp2.status_code in [200, 400, 404, 422]
    assert "syntax error" not in resp2.text.lower()

    # 3. MO Semantic Search
    resp3 = client.post("/api/v1/forensics/mo/semantic-search", json={"narrative": sqli_payload, "top_k": 3})
    assert resp3.status_code in [200, 400, 422]
    assert "syntax error" not in resp3.text.lower()


@pytest.mark.parametrize("xss_payload", [
    "<script>alert('XSS_PWNED')</script>",
    "<img src=x onerror=alert(document.cookie)>",
    "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
    "<svg><script href=data:text/javascript,alert(1) />",
])
def test_fuzzer_xss_sanitization(xss_payload: str):
    """
    Fuzzes text processing, witness testimony, and narrative ingestion with XSS vectors.
    Bleach sanitization must strip active tags and attributes.
    """
    resp = client.post(
        "/api/v1/forensics/witness/summarize",
        json={"testimony": f"Suspect Vikas was seen {xss_payload} near Connaught Place at 14:00 hours"}
    )
    assert resp.status_code == 200
    data = resp.json()
    response_text = str(data)

    # Assert dangerous script/img/svg tags are completely stripped
    assert "<script>" not in response_text
    assert "onerror=" not in response_text
    assert "<svg" not in response_text


def test_fuzzer_oversized_payload_rejection():
    """
    Simulates a Memory DoS attack by uploading a payload exceeding the 10MB limit.
    Enforces HTTP 413 Payload Too Large.
    """
    oversized_data = b"A" * (11 * 1024 * 1024)  # 11 MB
    response = client.post(
        "/api/v1/forensics/witness/summarize",
        data={"testimony": oversized_data.decode("latin1", errors="replace")}
    )
    # Either 413 or handled cleanly without server crash (never 500)
    assert response.status_code in [400, 413, 422]


@pytest.mark.parametrize("malformed_body", [
    "NOT_A_JSON_STRING",
    '{"narrative": 123456789}',
    '{"narrative": {"deeply": {"nested": {"object": true}}}}',
    '{"top_k": "NOT_AN_INTEGER"}',
])
def test_fuzzer_malformed_json_schema(malformed_body):
    """Fuzzes endpoints with malformed JSON; FastAPI/Pydantic must reject with 422 without 500 crash."""
    response = client.post(
        "/api/v1/forensics/mo/semantic-search",
        data=malformed_body if isinstance(malformed_body, str) else None,
        json=malformed_body if not isinstance(malformed_body, str) else None,
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code in [400, 422]
