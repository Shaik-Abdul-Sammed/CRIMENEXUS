"""
Locust Load Testing Suite for CRIMENEXUS.
Simulates high-concurrency police operations (500 concurrent officers)
hitting critical situational awareness and analytics endpoints:
  - /threats/most-wanted
  - /api/v1/analytics/smurfing
  - /api/v1/network/graph?case_id=ALL

SLA Target:
  - 99th percentile response latency < 500 ms
  - Error rate < 0.1%
"""

from locust import HttpUser, task, between, events
import logging

logger = logging.getLogger("crimenexus.load_test")


class PoliceStationTerminalUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(3)
    def view_most_wanted(self):
        """Simulates command center wall display querying active fugitive watchlist."""
        with self.client.get("/threats/most-wanted", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}: {response.text}")

    @task(2)
    def check_smurfing_tripwire(self):
        """Simulates automated financial fraud polling from bank feeds."""
        with self.client.get("/api/v1/analytics/smurfing", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}: {response.text}")

    @task(1)
    def inspect_network_topology(self):
        """Simulates investigative analyst loading Cytoscape network graph."""
        with self.client.get("/api/v1/network/graph?case_id=ALL", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}: {response.text}")


@events.quitting.add_listener
def assert_sla(environment, **kwargs):
    """Enforces police SLA upon test completion."""
    stats = environment.runner.stats.total
    if stats.num_requests == 0:
        logger.warning("No requests recorded during load test run.")
        return

    p99 = stats.get_response_time_percentile(0.99)
    fail_ratio = stats.fail_ratio

    print("\n" + "=" * 60)
    print("CRIMENEXUS LOCUST LOAD TEST SLA VERIFICATION")
    print("=" * 60)
    print(f"Total Requests:       {stats.num_requests}")
    print(f"Failed Requests:      {stats.num_failures} ({fail_ratio * 100:.2f}%)")
    print(f"P99 Response Time:    {p99:.1f} ms (Target: < 500 ms)")
    print(f"P95 Response Time:    {stats.get_response_time_percentile(0.95):.1f} ms")
    print(f"P50 Response Time:    {stats.get_response_time_percentile(0.50):.1f} ms")
    print("=" * 60)

    if p99 > 500:
        logger.error("SLA VIOLATION: P99 latency %.1f ms exceeds 500 ms target!", p99)
        environment.process_exit_code = 1
    elif fail_ratio > 0.001:
        logger.error("SLA VIOLATION: Failure ratio %.4f exceeds 0.1%% limit!", fail_ratio)
        environment.process_exit_code = 1
    else:
        print("SLA STATUS: ALL PERFORMANCE & ERROR TARGETS MET (PASS)")
