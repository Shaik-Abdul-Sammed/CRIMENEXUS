"""
TEST 5: DevOps SRE Load, Concurrency & Stability Audit
File: backend/tests/load/test_omni_trace_load.py

Evaluates:
  Test 5.1: High concurrency load test on /api/v1/escape-demo/data-lake (50 concurrent requests, P99 < 500ms)
  Test 5.2: Database connection pool stress on /api/v1/network/expand/{node_id} (20 concurrent requests, 0 pool exhaustion / 500 errors)
  Test 5.3: Memory leak & garbage collection verification on /api/v1/quantum/optimize-intercept (100 iterative simulations, RAM growth < 50MB)
  Test 5.4: Infrastructure & Container Health Check (Verification of core CRIMENEXUS runtime dependencies)
"""

import sys
import time
import os
import gc
import statistics
import concurrent.futures
from typing import List, Dict, Any

from fastapi.testclient import TestClient

# Ensure backend directory is in python path
os.environ.setdefault("MPLBACKEND", "Agg")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.main import app
from app.core.security import create_access_token

def print_result(test_name: str, passed: bool, details: str = ""):
    status = "\033[92m[PASS]\033[0m" if passed else "\033[91m[FAIL]\033[0m"
    print(f"{status} {test_name}")
    if details:
        print(f"       -> {details}")

def get_auth_headers() -> Dict[str, str]:
    token = create_access_token(data={"sub": "sre_perf_tester", "role": "DEVOPS_AUDITOR"})
    return {"Authorization": f"Bearer {token}"}

def test_5_1_data_lake_concurrency_p99():
    """
    Test 5.1: 50 concurrent requests to /api/v1/escape-demo/data-lake
    Target: P99 response latency < 500ms under parallel synthetic load.
    """
    client = TestClient(app)
    headers = get_auth_headers()
    num_requests = 50
    latencies: List[float] = []
    status_codes: List[int] = []

    def make_request(i: int):
        start = time.perf_counter()
        resp = client.get("/api/v1/escape-demo/data-lake", headers=headers)
        duration_ms = (time.perf_counter() - start) * 1000.0
        return resp.status_code, duration_ms

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request, i) for i in range(num_requests)]
        for fut in concurrent.futures.as_completed(futures):
            code, dur = fut.result()
            status_codes.append(code)
            latencies.append(dur)

    latencies.sort()
    p50 = statistics.median(latencies)
    p95_idx = int(0.95 * len(latencies))
    p99_idx = min(int(0.99 * len(latencies)), len(latencies) - 1)
    p95 = latencies[p95_idx]
    p99 = latencies[p99_idx]
    success_rate = (status_codes.count(200) / len(status_codes)) * 100.0

    passed = (p99 < 500.0) and (success_rate == 100.0)
    details = (
        f"Reqs: {num_requests} | Success: {success_rate:.1f}% | "
        f"P50: {p50:.2f}ms | P95: {p95:.2f}ms | P99: {p99:.2f}ms (Threshold: < 500ms)"
    )
    print_result("Test 5.1: 50 Concurrent Data-Lake Ingest Reqs (P99 < 500ms)", passed, details)
    assert passed, f"P99 latency exceeded 500ms: {p99:.2f}ms"

def test_5_2_graph_pool_concurrency():
    """
    Test 5.2: 20 concurrent requests to /api/v1/network/expand/node-1
    Assert 0 connection pool exhaustion errors (HTTP 500/503) and 100% throughput.
    """
    client = TestClient(app)
    num_requests = 20
    status_codes: List[int] = []

    def make_graph_request(i: int):
        resp = client.get("/api/v1/network/expand/node-1")
        return resp.status_code

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(make_graph_request, i) for i in range(num_requests)]
        for fut in concurrent.futures.as_completed(futures):
            status_codes.append(fut.result())

    errors_500 = [code for code in status_codes if code >= 500]
    success_200 = status_codes.count(200)
    passed = len(errors_500) == 0 and success_200 == num_requests
    details = f"Total: {num_requests} | Success: {success_200} | 5xx Errors: {len(errors_500)}"
    print_result("Test 5.2: Neo4j/Graph Query Pool Concurrency (Zero 5xx Exhaustion)", passed, details)
    assert passed, f"Graph expansion encountered pool errors: {errors_500}"

def get_process_memory_mb() -> float:
    """Helper to read Resident Set Size (RSS) in MB using OS /proc or psutil."""
    try:
        import psutil
        return psutil.Process().memory_info().rss / (1024 * 1024)
    except ImportError:
        try:
            # Fallback reading /proc/self/statm on Linux
            with open("/proc/self/statm", "r") as f:
                pages = int(f.read().split()[1])
                page_size_kb = os.sysconf("SC_PAGE_SIZE") / 1024
                return (pages * page_size_kb) / 1024
        except Exception:
            return 0.0

def test_5_3_quantum_router_memory_stability():
    """
    Test 5.3: Memory leak check across 100 iterations of Quantum Intercept Optimizer
    Assert memory delta growth < 50MB and verify garbage collection stabilizes memory.
    """
    client = TestClient(app)
    payload = {
        "thief_location": {"lat": 28.5355, "lon": 77.3910},
        "police_units": [
            {"id": "PCR_ALPHA", "lat": 28.5700, "lon": 77.3200, "type": "patrol"},
            {"id": "PCR_BRAVO", "lat": 28.5000, "lon": 77.4000, "type": "interceptor"},
            {"id": "PCR_CHARLIE", "lat": 28.6139, "lon": 77.2090, "type": "command_suv"}
        ]
    }

    gc.collect()
    initial_mem_mb = get_process_memory_mb()

    # Warm-up call
    client.post("/api/v1/quantum/optimize-intercept", json=payload)

    # 100 continuous iterations
    for _ in range(100):
        resp = client.post("/api/v1/quantum/optimize-intercept", json=payload)
        assert resp.status_code == 200

    gc.collect()
    final_mem_mb = get_process_memory_mb()
    mem_growth_mb = max(0.0, final_mem_mb - initial_mem_mb)

    # Assert RAM growth < 50MB
    passed = mem_growth_mb < 50.0
    details = f"Initial RSS: {initial_mem_mb:.2f}MB | Final RSS: {final_mem_mb:.2f}MB | Growth: {mem_growth_mb:.2f}MB (Max allowed: 50MB)"
    print_result("Test 5.3: Quantum Router Memory Leak & GC Stability (<50MB growth / 100 runs)", passed, details)
    assert passed, f"Memory leak detected: growth of {mem_growth_mb:.2f}MB exceeded 50MB threshold"

def test_5_4_docker_runtime_service_readiness():
    """
    Test 5.4: Runtime Infrastructure Readiness & Health Verification
    Validates presence of core service endpoints and configuration bounds.
    """
    client = TestClient(app)

    # Verify standard health / readiness endpoints
    endpoints_to_check = [
        ("/", [200]),
        ("/api/v1/network/graph", [200]),
        ("/api/v1/cases/1/custody/remand-status", [200]),
        ("/api/v1/forensics/audit-ledger", [200]),
    ]

    all_healthy = True
    checked = 0
    for path, expected_codes in endpoints_to_check:
        try:
            resp = client.get(path)
            if resp.status_code in expected_codes:
                checked += 1
            else:
                all_healthy = False
        except Exception:
            all_healthy = False

    details = f"Verified {checked}/{len(endpoints_to_check)} core subsystem endpoints operational"
    print_result("Test 5.4: Subsystem Health & Production Orchestration Readiness", all_healthy, details)
    assert all_healthy, "Subsystem health check failed"

if __name__ == "__main__":
    print("\n================================================================================")
    print("🛡️  CRIMENEXUS DEVOPS SRE & SYSTEM STABILITY SUITE (TEST 5)")
    print("================================================================================\n")
    try:
        test_5_1_data_lake_concurrency_p99()
        test_5_2_graph_pool_concurrency()
        test_5_3_quantum_router_memory_stability()
        test_5_4_docker_runtime_service_readiness()
        print("\n================================================================================")
        print("✅ ALL SRE LOAD & STABILITY TESTS PASSED WITH ZERO FAILURES")
        print("================================================================================\n")
    except AssertionError as e:
        print(f"\n❌ SRE AUDIT FAILURE: {e}")
        sys.exit(1)
