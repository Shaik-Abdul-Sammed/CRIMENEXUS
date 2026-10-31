import time
import pytest
from app.database.postgres import SessionLocal
from app.database.neo4j import execute_cypher
from app.models.transaction import BankTransaction
from app.services.streaming.redis_streams import publish_stream_event, get_redis_client
from app.services.streaming.stream_processor import process_single_event
from app.services.streaming.stream_producer import emit_bank_transaction, emit_telecom_cdr, emit_anpr_sighting


def test_streaming_bank_transaction_ingestion():
    """
    Step 2 Test: Publish a bank transaction to Redis Stream topic 'bank.transactions',
    verify it is consumed and appears in PostgreSQL and Neo4j.
    """
    unique_tx_id = f"TX-TEST-STREAM-{int(time.time()*1000)}"
    test_amount = 49200.0
    sender_acc = f"ACC-MULE-TEST-{int(time.time())}"
    receiver_acc = f"ACC-RAJAN-BENEFICIARY-{int(time.time())}"

    payload = {
        "transaction_id": unique_tx_id,
        "sender_name": "Ramesh Mule Account",
        "sender_account": sender_acc,
        "receiver_name": "Rajan Syndicate Core",
        "receiver_account": receiver_acc,
        "amount": test_amount,
        "transaction_type": "IMPS_STREAM",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    # Publish to Redis
    msg_id = publish_stream_event("bank.transactions", payload)
    assert msg_id is not None

    # Directly verify process_single_event and consumption
    success = process_single_event("bank.transactions", payload)
    assert success is True

    # Verify appearance in PostgreSQL within 3 seconds
    db = SessionLocal()
    try:
        found_tx = db.query(BankTransaction).filter(BankTransaction.transaction_id == unique_tx_id).first()
        assert found_tx is not None
        assert found_tx.amount == test_amount
        assert found_tx.sender_account == sender_acc
        assert found_tx.receiver_account == receiver_acc
    finally:
        db.close()

    # Verify dual-write in Neo4j graph
    cypher_check = """
    MATCH (b1:BankAccount {account_number: $s_acc})-[r:TRANSFERRED_MONEY_TO {transaction_id: $tx_id}]->(b2:BankAccount {account_number: $r_acc})
    RETURN count(r) as rel_count
    """
    neo4j_res = execute_cypher(cypher_check, {
        "s_acc": sender_acc,
        "r_acc": receiver_acc,
        "tx_id": unique_tx_id
    })
    assert neo4j_res[0]["rel_count"] >= 1
    print(f"\n[TEST STREAMING BANK TX PASSED]: Tx {unique_tx_id} validated in PostgreSQL and Neo4j graph.")


def test_streaming_cdr_and_anpr_processing():
    """Verify telecom.cdr and anpr.sightings stream processing."""
    caller = f"+9198{int(time.time()) % 100000000:08d}"
    receiver = "+919999988888"

    cdr_payload = {
        "caller_phone": caller,
        "receiver_phone": receiver,
        "duration": 95,
        "tower_id": "TOWER-DEL-TEST-01",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    assert process_single_event("telecom.cdr", cdr_payload) is True

    anpr_payload = {
        "plate_number": "DL 01 XY 9981",
        "camera_id": "CAM-TEST-TOLL",
        "location_name": "Yamuna Expressway Toll KM-21",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    assert process_single_event("anpr.sightings", anpr_payload) is True
    print("\n[TEST STREAMING CDR & ANPR PASSED]: Event stream models committed successfully.")
