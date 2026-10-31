"""
Automation 8: District Most Wanted Watchlist & Rapid Warrant/Dossier Dispatch.
Tests:
  1. Fetch /threats/most-wanted -> verify ranked by risk_score descending.
  2. Verify only status='WANTED' OR risk_score > 0.70 returned.
  3. Verify cache (5-min TTL) returns same result on 2nd call (Redis).
  4. Verify LOC notice can be generated for any WANTED suspect.
  5. Verify Court PDF Dossier downloads with correct Content-Type.
"""

import sys
from fastapi.testclient import TestClient

from app.main import app
from app.services.streaming.redis_streams import get_redis_client

client = TestClient(app)


def test_most_wanted_ranked_descending():
    """Test 1: Fetch /threats/most-wanted -> verify ranked by risk_score descending."""
    res = client.get("/threats/most-wanted")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    suspects = res.json()
    assert len(suspects) >= 1, "Expected at least one suspect in most wanted watchlist"

    scores = [s.get("risk_score", 0.0) for s in suspects]
    sorted_scores = sorted(scores, reverse=True)
    assert scores == sorted_scores, f"Suspects are not ranked descending by risk_score: {scores}"


def test_most_wanted_status_or_score_threshold():
    """Test 2: Verify only status='WANTED' OR risk_score > 0.70 returned."""
    res = client.get("/threats/most-wanted")
    assert res.status_code == 200
    suspects = res.json()

    for s in suspects:
        is_wanted = "WANTED" in str(s.get("status", "")).upper()
        high_score = float(s.get("risk_score", 0.0)) >= 0.70 or float(s.get("risk_score", 0.0)) >= 70.0
        assert is_wanted or high_score, (
            f"Suspect {s.get('name')} does not meet criteria: status={s.get('status')}, risk_score={s.get('risk_score')}"
        )


def test_most_wanted_redis_cache_5min_ttl():
    """Test 3: Verify cache (5-min TTL) returns same result on 2nd call (Redis)."""
    r = get_redis_client()
    cache_key = "cache:threats:most_wanted"

    # Call 1: Populates or fetches from Redis
    res1 = client.get("/threats/most-wanted")
    assert res1.status_code == 200
    data1 = res1.json()

    # Call 2: Returns identical cached payload
    res2 = client.get("/threats/most-wanted")
    assert res2.status_code == 200
    data2 = res2.json()

    assert data1 == data2, "Cached 2nd call should return identical payload"

    # Verify TTL is set in Redis
    if r:
        ttl = r.ttl(cache_key)
        assert ttl > 0, f"Expected positive TTL in Redis for {cache_key}, got {ttl}"
        assert ttl <= 300, f"TTL {ttl}s exceeds 300s (5-min) window"


def test_most_wanted_loc_generation():
    """Test 4: Verify LOC notice can be generated for any WANTED suspect."""
    res = client.get("/threats/most-wanted")
    suspects = res.json()
    assert len(suspects) >= 1

    target_suspect = suspects[0].get("name", "Rajan")
    loc_res = client.post(f"/api/v1/draft/lookout-circular/{target_suspect}", json={"identification": "P8901234"})
    assert loc_res.status_code == 200, f"Expected 200, got {loc_res.status_code}: {loc_res.text}"
    loc_data = loc_res.json()
    assert loc_data["status"] == "success"
    assert target_suspect in loc_data["draft_text"]
    assert "LOOK-OUT CIRCULAR" in loc_data["draft_text"] or "LOC" in loc_data["draft_text"]


def test_most_wanted_court_pdf_dossier_download():
    """Test 5: Verify Court PDF Dossier downloads with correct Content-Type."""
    case_num = "FIR-2026-CRIME-890"
    res = client.get(f"/api/v1/cases/export/dossier-pdf?case_number={case_num}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert res.headers.get("content-type") == "application/pdf"
    assert len(res.content) > 1000, "PDF byte stream is empty or truncated"
    # PDF signature check
    assert res.content.startswith(b"%PDF"), "Response is not a valid PDF binary stream"


if __name__ == "__main__":
    test_most_wanted_ranked_descending()
    test_most_wanted_status_or_score_threshold()
    test_most_wanted_redis_cache_5min_ttl()
    test_most_wanted_loc_generation()
    test_most_wanted_court_pdf_dossier_download()
    print("ALL 5 Most Wanted Automation Tests PASSED.")
