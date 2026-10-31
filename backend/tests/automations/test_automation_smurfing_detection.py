"""
Automation 2: Financial Tripwire & Smurfing Anomaly Detection.
Tests:
  1. Send 4 transactions of ₹49,999 to same account from 4 senders in 24h -> verify alert generated.
  2. Send 2 transactions -> verify NO alert (below threshold).
  3. Send 4 transactions of ₹60,000 each -> verify NO alert (not smurfing, just large txns).
  4. Send 4 transactions from the SAME sender -> verify NO alert (smurfing requires multiple senders).
  5. Send negative amount / future timestamp -> verify rejected at Pydantic schema level.
"""

import sys
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.transaction import BankTransaction
from app.models.alert import Alert

client = TestClient(app)


def test_smurfing_four_senders_under_50k_triggers_alert():
    """Test 1: Send 4 transactions of ₹49,999 to same account from 4 senders in 24h -> verify alert generated."""
    db = SessionLocal()
    target_beneficiary = f"ACC-SMURF-TARGET-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()

    txs = [
        BankTransaction(
            transaction_id=f"TX-T1-{uuid.uuid4().hex[:6].upper()}",
            sender_name=f"Mule Sender {i}",
            sender_account=f"ACC-MULE-SRC-{i}-{uuid.uuid4().hex[:4]}",
            receiver_name="Smurf Ring Leader",
            receiver_account=target_beneficiary,
            amount=49999.0,
            currency="INR",
            transaction_type="IMPS",
            timestamp=now - timedelta(hours=i * 3)
        )
        for i in range(1, 5)
    ]

    try:
        for tx in txs:
            db.add(tx)
        db.commit()

        # Invalidate any cached smurfing responses in Redis
        from app.services.streaming.redis_streams import get_redis_client
        r = get_redis_client()
        if r:
            try:
                for k in r.keys("cache:analytics:smurfing:*"):
                    r.delete(k)
            except Exception:
                pass

        # Call smurfing endpoint
        res = client.get("/api/v1/analytics/smurfing?window_hours=24&min_senders=3")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()

        matched = next((inc for inc in data.get("incidents", []) if inc["beneficiary_account"] == target_beneficiary), None)
        assert matched is not None, f"Target beneficiary {target_beneficiary} was not flagged as smurfing incident"
        assert matched["distinct_senders_count"] >= 3
        assert matched["total_amount"] == 49999.0 * 4

        # Verify alert in PostgreSQL
        alert = db.query(Alert).filter(Alert.title.contains(target_beneficiary)).first()
        assert alert is not None, f"Expected Alert for {target_beneficiary} in database"
        assert alert.alert_type == "FINANCIAL_TRIPWIRE"
    finally:
        for tx in txs:
            db.delete(tx)
        db.query(Alert).filter(Alert.title.contains(target_beneficiary)).delete()
        db.commit()
        db.close()


def test_smurfing_two_transactions_no_alert():
    """Test 2: Send 2 transactions -> verify NO alert (below threshold)."""
    db = SessionLocal()
    target_beneficiary = f"ACC-SUBTHRESHOLD-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()

    txs = [
        BankTransaction(
            transaction_id=f"TX-T2-{uuid.uuid4().hex[:6].upper()}",
            sender_name=f"Mule {i}",
            sender_account=f"ACC-SRC-T2-{i}",
            receiver_name="Normal Trader",
            receiver_account=target_beneficiary,
            amount=42000.0,
            currency="INR",
            transaction_type="UPI",
            timestamp=now - timedelta(hours=i * 2)
        )
        for i in range(1, 3)
    ]

    try:
        for tx in txs:
            db.add(tx)
        db.commit()

        res = client.get("/api/v1/analytics/smurfing?window_hours=24&min_senders=3")
        assert res.status_code == 200
        data = res.json()

        matched = next((inc for inc in data.get("incidents", []) if inc["beneficiary_account"] == target_beneficiary), None)
        assert matched is None, f"Beneficiary with only 2 txns should NOT be flagged as smurfing: {matched}"
    finally:
        for tx in txs:
            db.delete(tx)
        db.commit()
        db.close()


def test_smurfing_large_transactions_no_alert():
    """Test 3: Send 4 transactions of ₹60,000 each -> verify NO alert (not smurfing, just large txns)."""
    db = SessionLocal()
    target_beneficiary = f"ACC-LARGE-TX-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()

    txs = [
        BankTransaction(
            transaction_id=f"TX-T3-{uuid.uuid4().hex[:6].upper()}",
            sender_name=f"Sender Large {i}",
            sender_account=f"ACC-SRC-T3-{i}",
            receiver_name="High Value Merchant",
            receiver_account=target_beneficiary,
            amount=60000.0,
            currency="INR",
            transaction_type="RTGS",
            timestamp=now - timedelta(hours=i * 2)
        )
        for i in range(1, 5)
    ]

    try:
        for tx in txs:
            db.add(tx)
        db.commit()

        res = client.get("/api/v1/analytics/smurfing?window_hours=24&threshold_amount=50000.0&min_senders=3")
        assert res.status_code == 200
        data = res.json()

        matched = next((inc for inc in data.get("incidents", []) if inc["beneficiary_account"] == target_beneficiary), None)
        assert matched is None, f"Txns over 50k should not be flagged as sub-50k smurfing: {matched}"
    finally:
        for tx in txs:
            db.delete(tx)
        db.commit()
        db.close()


def test_smurfing_single_sender_multiple_txns_no_alert():
    """Test 4: Send 4 transactions from the SAME sender -> verify NO alert (smurfing requires multiple senders)."""
    db = SessionLocal()
    target_beneficiary = f"ACC-SINGLE-SRC-{uuid.uuid4().hex[:6].upper()}"
    single_sender = f"ACC-SAME-SENDER-{uuid.uuid4().hex[:6]}"
    now = datetime.utcnow()

    txs = [
        BankTransaction(
            transaction_id=f"TX-T4-{uuid.uuid4().hex[:6].upper()}",
            sender_name="Single Customer",
            sender_account=single_sender,
            receiver_name="Vendor ABC",
            receiver_account=target_beneficiary,
            amount=45000.0,
            currency="INR",
            transaction_type="IMPS",
            timestamp=now - timedelta(hours=i * 2)
        )
        for i in range(1, 5)
    ]

    try:
        for tx in txs:
            db.add(tx)
        db.commit()

        res = client.get("/api/v1/analytics/smurfing?window_hours=24&min_senders=3")
        assert res.status_code == 200
        data = res.json()

        matched = next((inc for inc in data.get("incidents", []) if inc["beneficiary_account"] == target_beneficiary), None)
        assert matched is None, f"Txns from single sender should not be flagged as multi-mule smurfing: {matched}"
    finally:
        for tx in txs:
            db.delete(tx)
        db.commit()
        db.close()


def test_smurfing_schema_validation_rejection():
    """Test 5: Send negative amount / future timestamp -> verify rejected at Pydantic schema level."""
    # 5a: Negative amount rejection at ingestion endpoint
    bad_payload_amount = {
        "sender_name": "Bad Actor",
        "sender_account": "ACC-BAD-01",
        "receiver_name": "Target",
        "receiver_account": "ACC-TARGET-01",
        "amount": -5000.0,
        "transaction_type": "NEFT"
    }
    res_neg = client.post("/api/v1/ingest/bank", json=bad_payload_amount)
    assert res_neg.status_code == 422, f"Expected 422 Unprocessable Entity for negative amount, got {res_neg.status_code}"

    # 5b: Zero amount rejection
    bad_payload_zero = {
        "sender_name": "Bad Actor",
        "sender_account": "ACC-BAD-01",
        "receiver_name": "Target",
        "receiver_account": "ACC-TARGET-01",
        "amount": 0.0
    }
    res_zero = client.post("/api/v1/ingest/bank", json=bad_payload_zero)
    assert res_zero.status_code == 422, f"Expected 422 Unprocessable Entity for zero amount, got {res_zero.status_code}"

    # 5c: Future timestamp rejection in streaming validator
    from app.services.streaming.stream_processor import StreamBankTxSchema
    future_time = datetime.utcnow() + timedelta(days=5)
    try:
        StreamBankTxSchema(
            transaction_id="TX-FUTURE-TEST",
            sender_name="Mule",
            sender_account="ACC-01",
            receiver_name="Target",
            receiver_account="ACC-02",
            amount=45000.0,
            timestamp=future_time
        )
        assert False, "StreamBankTxSchema should have rejected adversarial future timestamp"
    except Exception as exc:
        assert "future" in str(exc).lower() or "validation" in str(exc).lower()


if __name__ == "__main__":
    test_smurfing_four_senders_under_50k_triggers_alert()
    test_smurfing_two_transactions_no_alert()
    test_smurfing_large_transactions_no_alert()
    test_smurfing_single_sender_multiple_txns_no_alert()
    test_smurfing_schema_validation_rejection()
    print("ALL 5 Smurfing Detection Automation Tests PASSED.")
