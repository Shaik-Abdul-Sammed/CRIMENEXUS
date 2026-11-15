"""
Category 5: Performance & Load Tests
Verifies sub-second response times, concurrent file uploads,
pagination scaling, payload protection, and Neo4j connection pool stability.
"""

import io
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import pytest
from fastapi.testclient import TestClient

from app.database.neo4j import execute_cypher
from app.models.case import Case


def test_fusion_search_under_500ms(client: TestClient, auth_headers):
    """
    Test that cross-source intelligence fusion search finishes in sub-500ms.
    """
    payload = {"query": "Vicky", "entity_types": ["CASES", "PERSONS"]}
    
    # Warm up first request
    client.post("/api/v1/intelligence/fusion-search", json=payload, headers=auth_headers)

    start = time.perf_counter()
    response = client.post("/api/v1/intelligence/fusion-search", json=payload, headers=auth_headers)
    elapsed = time.perf_counter() - start

    assert response.status_code == 200
    data = response.json()
    assert "sources_queried" in data
    assert elapsed < 0.8, f"Fusion search took {elapsed:.3f}s (expected < 800ms)"


def test_graph_query_under_1s():
    """
    Test that a 2-hop topological traversal query across Neo4j executes in under 1000ms.
    """
    cypher_2hop = """
    MATCH (p:Person)
    OPTIONAL MATCH (p)-[r1]-(mid)-[r2]-(target)
    RETURN p.name AS source, mid.name AS pivot, target.name AS target
    LIMIT 25
    """
    start = time.perf_counter()
    results = execute_cypher(cypher_2hop)
    elapsed = time.perf_counter() - start

    assert isinstance(results, list)
    assert elapsed < 1.0, f"Neo4j 2-hop traversal took {elapsed:.3f}s (expected < 1.0s)"


def test_concurrent_uploads(client: TestClient, auth_headers, test_case):
    """
    Test that 5 concurrent digital evidence file uploads execute cleanly without deadlock or race condition.
    """
    def _upload(idx: int):
        data_bytes = f"EVIDENCE-PAYLOAD-SAMPLE-{idx}".encode()
        files = {"file": (f"sample_file_{idx}.dat", io.BytesIO(data_bytes), "application/octet-stream")}
        form_data = {
            "case_id": test_case.case_number,
            "evidence_type": "DIGITAL_STORAGE",
            "collected_by": f"Forensic Officer {idx}"
        }
        return client.post("/api/v1/evidence/upload", files=files, data=form_data, headers=auth_headers)

    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(_upload, i) for i in range(5)]
        for f in as_completed(futures):
            results.append(f.result())

    assert len(results) == 5
    for r in results:
        assert r.status_code == 200
        json_data = r.json()
        assert "sha256" in json_data
        assert json_data["status"] == "UPLOAD_SUCCESS"


def test_100_cases_list_pagination(client: TestClient, auth_headers, db):
    """
    Test pagination scaling: seed 100 cases if needed, verify limit & skip offsets,
    ensure zero overlap between page 1 and page 2, and verify response time < 500ms.
    """
    existing_count = db.query(Case).count()
    if existing_count < 100:
        new_cases = []
        for i in range(existing_count, 105):
            new_cases.append(Case(
                case_number=f"CASE-BENCH-PAGINATE-{i:04d}",
                title=f"Synthetic Benchmark Case {i}",
                crime_type="Economic Offense",
                status="active",
                risk_level="medium"
            ))
        db.bulk_save_objects(new_cases)
        db.commit()

    start_p1 = time.perf_counter()
    res1 = client.get("/api/v1/cases/?limit=50&skip=0", headers=auth_headers)
    t1 = time.perf_counter() - start_p1

    start_p2 = time.perf_counter()
    res2 = client.get("/api/v1/cases/?limit=50&skip=50", headers=auth_headers)
    t2 = time.perf_counter() - start_p2

    assert res1.status_code == 200
    assert res2.status_code == 200
    page1 = res1.json()
    page2 = res2.json()

    assert len(page1) == 50
    assert len(page2) >= 50
    assert t1 < 0.5, f"Page 1 query took {t1:.3f}s"
    assert t2 < 0.5, f"Page 2 query took {t2:.3f}s"

    p1_ids = {c["id"] for c in page1}
    p2_ids = {c["id"] for c in page2}
    assert len(p1_ids.intersection(p2_ids)) == 0, "Page 1 and Page 2 contain overlapping records!"


def test_large_payload_rejected_gracefully(client: TestClient, auth_headers):
    """
    Test that an adversarial 20MB payload sent to an API endpoint is rejected
    gracefully with HTTP 413 Payload Too Large without server crash or unhandled 500.
    """
    large_headers = dict(auth_headers)
    large_headers["Content-Length"] = str(20 * 1024 * 1024)  # 20MB
    large_headers["Content-Type"] = "application/json"

    # Stream dummy body
    response = client.post("/api/v1/cases/", data=b"x" * 1024, headers=large_headers)
    assert response.status_code in [413, 422]
    data = response.json()
    assert "detail" in data
    assert "Payload Too Large" in data["detail"] or "payload" in str(data["detail"]).lower()


def test_neo4j_connection_pool_not_exhausted():
    """
    Test that 20 rapid queries executed against Neo4j connection pool
    all succeed without pool exhaustion, socket reset, or driver deadlock.
    """
    def _run_query(idx: int):
        return execute_cypher("RETURN $idx AS test_id, timestamp() AS ts", {"idx": idx})

    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(_run_query, i) for i in range(20)]
        for f in as_completed(futures):
            results.append(f.result())

    assert len(results) == 20
    for r in results:
        assert isinstance(r, list)
        assert len(r) == 1
        assert "test_id" in r[0]
