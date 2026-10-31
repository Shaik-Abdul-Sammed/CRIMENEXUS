import pytest
from datetime import datetime, timedelta
from app.services.streaming.stream_processor import process_single_event
from app.ml_service.anomaly_detector import get_anomaly_detector


def test_streaming_adversarial_negative_amount_rejected():
    """Verify that negative transaction amounts are rejected by zero-trust schema validation."""
    malicious_event = {
        "transaction_id": "TX-ATTACK-NEG-01",
        "sender_name": "Adversary",
        "sender_account": "ACC-HACK-01",
        "receiver_name": "Target",
        "receiver_account": "ACC-TGT-01",
        "amount": -50000.0,  # Adversarial negative amount
        "timestamp": datetime.utcnow().isoformat()
    }
    result = process_single_event("bank.transactions", malicious_event)
    assert result is False, "Negative transaction must be rejected by schema validation."
    print("\n[RED TEAM ML PASSED]: Adversarial negative amount strictly rejected.")


def test_streaming_adversarial_future_timestamp_rejected():
    """Verify that future timestamps (> 5 mins) are rejected to prevent replay/desync attacks."""
    future_time = datetime.utcnow() + timedelta(hours=2)
    malicious_event = {
        "transaction_id": "TX-ATTACK-FUTURE-01",
        "sender_name": "Adversary",
        "sender_account": "ACC-HACK-02",
        "receiver_name": "Target",
        "receiver_account": "ACC-TGT-02",
        "amount": 25000.0,
        "timestamp": future_time.isoformat()
    }
    result = process_single_event("bank.transactions", malicious_event)
    assert result is False, "Future timestamp transaction must be rejected by schema validation."
    print("\n[RED TEAM ML PASSED]: Adversarial future timestamp strictly rejected.")


def test_threshold_dodging_smurfing_evasion_caught():
    """
    Step 2 Evasion Test:
    Simulate a criminal deliberately depositing amounts just under the ₹50,000 reporting threshold:
    ₹49,990, ₹49,995, ₹49,999 spread over 48 hours.
    Assert that the Isolation Forest catches this evasion behavior and flags it.
    """
    detector = get_anomaly_detector()
    evasion_txs = [
        {"sender_account": "MULE-A", "amount": 49990.0, "timestamp": "2026-10-28T10:00:00"},
        {"sender_account": "MULE-B", "amount": 49995.0, "timestamp": "2026-10-29T14:30:00"},
        {"sender_account": "MULE-C", "amount": 49999.0, "timestamp": "2026-10-30T16:45:00"},
    ]

    evaluation = detector.evaluate_account_transactions("BEN-EVADER-888", evasion_txs)

    assert evaluation["anomaly_score"] >= 0.85
    assert evaluation["high_priority_alert"] is True
    assert evaluation["is_outlier"] is True
    assert evaluation["feature_metrics"]["threshold_dodging_evasion_detected"] is True
    print(f"\n[RED TEAM ML PASSED]: Caught threshold-dodging smurfing attack. Anomaly Score: {evaluation['anomaly_score']}")


def test_model_poisoning_defense():
    """Verify that core ML model weights cannot be poisoned by untrusted external data."""
    detector = get_anomaly_detector()
    malicious_poisoning_dataset = [{"amount": 99999999, "sender_account": "FAKE"}] * 1000
    assert detector.reject_poisoning_retrain(malicious_poisoning_dataset) is True
    assert detector.model is not None
