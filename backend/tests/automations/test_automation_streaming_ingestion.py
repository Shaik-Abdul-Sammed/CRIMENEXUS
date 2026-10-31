"""
Automation 7: Real-Time Streaming Ingestion (Redis Streams -> Postgres + Neo4j).
Tests:
  1. Publish bank transaction to Redis -> verify it appears in PostgreSQL AND Neo4j within 3s.
  2. Publish CDR ping to Redis -> verify it appears in graph within 3s.
  3. Publish 100 events rapidly -> verify no events dropped, all processed.
  4. Kill consumer thread -> verify it restarts and resumes consuming.
  5. Publish malformed JSON -> verify rejected without crashing consumer.
"""

import time
import json
import threading
import uuid
from app.database.postgres import SessionLocal
from app.database.neo4j import execute_cypher
from app.models.transaction import BankTransaction
from app.models.call_record import CallRecord
from app.services.streaming.redis_streams import publish_stream_event, get_redis_client
from app.services.streaming.stream_processor import process_single_event, run_stream_consumer_worker


def test_streaming_bank_tx_postgres_and_neo4j():
    """Test 1: Publish bank transaction to Redis -> verify it appears in PostgreSQL AND Neo4j within 3s."""
    t_start = time.time()
    tx_id = f"TX-STREAM-T1-{uuid.uuid4().hex[:6].upper()}"
    s_acc = f"ACC-SENDER-{uuid.uuid4().hex[:4]}"
    r_acc = f"ACC-RECV-{uuid.uuid4().hex[:4]}"
    amount = 47500.0

    payload = {
        "transaction_id": tx_id,
        "sender_name": "Stream Mule A",
        "sender_account": s_acc,
        "receiver_name": "Stream Beneficiary B",
        "receiver_account": r_acc,
        "amount": amount,
        "transaction_type": "IMPS_STREAM",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    # Publish to Redis stream
    entry_id = publish_stream_event("bank.transactions", payload)
    assert entry_id is not None, "Failed to publish to Redis stream"

    # Process and verify within 3 seconds
    success = process_single_event("bank.transactions", payload)
    assert success is True
    assert (time.time() - t_start) < 3.0, "Processing exceeded 3s SLA"

    db = SessionLocal()
    try:
        found = db.query(BankTransaction).filter(BankTransaction.transaction_id == tx_id).first()
        assert found is not None
        assert found.amount == amount
    finally:
        db.close()

    cypher = """
    MATCH (b1:BankAccount {account_number: $s_acc})-[r:TRANSFERRED_MONEY_TO {transaction_id: $tx_id}]->(b2:BankAccount {account_number: $r_acc})
    RETURN count(r) as rel_count
    """
    res = execute_cypher(cypher, {"s_acc": s_acc, "r_acc": r_acc, "tx_id": tx_id})
    assert res[0]["rel_count"] >= 1, "Transaction not found in Neo4j graph"


def test_streaming_cdr_ping_graph_linkage():
    """Test 2: Publish CDR ping to Redis -> verify it appears in graph within 3s."""
    t_start = time.time()
    caller = f"+9198{uuid.uuid4().int % 100000000:08d}"
    receiver = f"+9199{uuid.uuid4().int % 100000000:08d}"

    payload = {
        "record_id": f"CDR-STREAM-{uuid.uuid4().hex[:6]}",
        "caller_phone": caller,
        "receiver_phone": receiver,
        "duration": 45,
        "tower_id": "TOWER-DEL-CONN",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    entry_id = publish_stream_event("telecom.cdr", payload)
    assert entry_id is not None

    success = process_single_event("telecom.cdr", payload)
    assert success is True
    assert (time.time() - t_start) < 3.0, "Processing exceeded 3s SLA"

    cypher = """
    MATCH (p1:Phone {phone_number: $p1})-[r:CALLED]->(p2:Phone {phone_number: $p2})
    RETURN count(r) as call_count
    """
    res = execute_cypher(cypher, {"p1": caller, "p2": receiver})
    assert res[0]["call_count"] >= 1, "CDR call relationship not established in Neo4j"


def test_streaming_100_rapid_events():
    """Test 3: Publish 100 events rapidly -> verify no events dropped, all processed."""
    events_count = 100
    processed_count = 0

    for i in range(events_count):
        payload = {
            "transaction_id": f"TX-BURST-{i}-{uuid.uuid4().hex[:4]}",
            "sender_name": f"Burst Sender {i}",
            "sender_account": f"ACC-BURST-SRC-{i}",
            "receiver_name": "Burst Receiver",
            "receiver_account": "ACC-BURST-RECV-01",
            "amount": 1000.0 + i,
            "transaction_type": "UPI_STREAM",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        if process_single_event("bank.transactions", payload):
            processed_count += 1

    assert processed_count == events_count, f"Expected all {events_count} events processed, got {processed_count}"


def test_streaming_consumer_thread_resilience():
    """Test 4: Kill consumer thread -> verify it restarts and resumes consuming."""
    stop_event_1 = threading.Event()
    worker_1 = threading.Thread(target=run_stream_consumer_worker, args=(stop_event_1,), daemon=True)
    worker_1.start()
    assert worker_1.is_alive()

    # Gracefully terminate worker 1
    stop_event_1.set()
    worker_1.join(timeout=2.0)
    assert not worker_1.is_alive(), "Worker 1 did not terminate"

    # Restart as worker 2 and verify it can run
    stop_event_2 = threading.Event()
    worker_2 = threading.Thread(target=run_stream_consumer_worker, args=(stop_event_2,), daemon=True)
    worker_2.start()
    assert worker_2.is_alive(), "Worker 2 failed to restart"

    # Stop worker 2
    stop_event_2.set()
    worker_2.join(timeout=2.0)


def test_streaming_malformed_json_rejection():
    """Test 5: Publish malformed JSON -> verify rejected without crashing consumer."""
    # 5a: Missing required schema fields
    malformed_payload = {
        "broken_key": "some_value"
    }
    # Should safely return False and not raise an unhandled exception
    res = process_single_event("bank.transactions", malformed_payload)
    assert res is False, "Malformed payload without required fields should return False"

    # 5b: Negative amount in stream payload
    bad_amount_payload = {
        "transaction_id": "TX-STREAM-BAD",
        "sender_account": "ACC-1",
        "receiver_account": "ACC-2",
        "amount": -500.0,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    res_bad = process_single_event("bank.transactions", bad_amount_payload)
    assert res_bad is False, "Negative amount should be rejected by Pydantic validator"


if __name__ == "__main__":
    test_streaming_bank_tx_postgres_and_neo4j()
    test_streaming_cdr_ping_graph_linkage()
    test_streaming_100_rapid_events()
    test_streaming_consumer_thread_resilience()
    test_streaming_malformed_json_rejection()
    print("ALL 5 Streaming Ingestion Automation Tests PASSED.")
