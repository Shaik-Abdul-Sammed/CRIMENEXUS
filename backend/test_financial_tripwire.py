import sys
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.transaction import BankTransaction
from app.models.alert import Alert


def test_smurfing_financial_tripwire():
    client = TestClient(app)
    db = SessionLocal()

    print("\n" + "=" * 80)
    print("STEP 6: AUTOMATION 2 - FINANCIAL TRIPWIRE (SMURFING DETECTION) VERIFICATION")
    print("=" * 80)

    target_beneficiary = "ACC-HDFC-908122"
    receiver_name = "Apex Trading Co. (Rajan Syndicate)"

    # 1. Clean up any existing tripwire alert for target account to ensure fresh test
    db.query(Alert).filter(
        Alert.alert_type == "FINANCIAL_TRIPWIRE",
        Alert.title.contains(target_beneficiary)
    ).delete()
    db.commit()

    # 2. Seed 4 Fake Transactions under ₹50,000 from 4 Different Senders within 48h
    now = datetime.utcnow()
    test_seed_txs = [
        BankTransaction(
            transaction_id=f"TX-SMURF-{uuid.uuid4().hex[:6].upper()}",
            sender_name="Mule 01 - Simran Kaur",
            sender_account="ACC-MULE-101",
            receiver_name=receiver_name,
            receiver_account=target_beneficiary,
            amount=45000.0,
            currency="INR",
            transaction_type="UPI_IMPS",
            suspicious=True,
            timestamp=now - timedelta(hours=14),
            notes="Structuring batch 1 under 50k"
        ),
        BankTransaction(
            transaction_id=f"TX-SMURF-{uuid.uuid4().hex[:6].upper()}",
            sender_name="Mule 02 - Deepak Joshi",
            sender_account="ACC-MULE-102",
            receiver_name=receiver_name,
            receiver_account=target_beneficiary,
            amount=48500.0,
            currency="INR",
            transaction_type="NEFT",
            suspicious=True,
            timestamp=now - timedelta(hours=10),
            notes="Structuring batch 2 under 50k"
        ),
        BankTransaction(
            transaction_id=f"TX-SMURF-{uuid.uuid4().hex[:6].upper()}",
            sender_name="Mule 03 - Pooja Verma",
            sender_account="ACC-MULE-103",
            receiver_name=receiver_name,
            receiver_account=target_beneficiary,
            amount=49000.0,
            currency="INR",
            transaction_type="IMPS",
            suspicious=True,
            timestamp=now - timedelta(hours=6),
            notes="Structuring batch 3 under 50k"
        ),
        BankTransaction(
            transaction_id=f"TX-SMURF-{uuid.uuid4().hex[:6].upper()}",
            sender_name="Mule 04 - Karan Mehra",
            sender_account="ACC-MULE-104",
            receiver_name=receiver_name,
            receiver_account=target_beneficiary,
            amount=47200.0,
            currency="INR",
            transaction_type="UPI",
            suspicious=True,
            timestamp=now - timedelta(hours=1),
            notes="Structuring batch 4 under 50k"
        ),
    ]

    print(f"\n[1] Seeding 4 Structured Transactions (< ₹50,000) into PostgreSQL for Beneficiary: {target_beneficiary}...")
    for tx in test_seed_txs:
        db.add(tx)
        print(f"  + Ingested: {tx.transaction_id} | From: {tx.sender_name} ({tx.sender_account}) -> ₹{tx.amount:,.2f}")
    db.commit()

    # 3. Call GET /api/v1/analytics/smurfing
    print("\n[2] Executing Smurfing Detection Endpoint: GET /api/v1/analytics/smurfing...")
    response = client.get("/api/v1/analytics/smurfing")
    print(f"HTTP Response Status Code: {response.status_code}")
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    payload = response.json()

    print(f"Total Smurfing Incidents Detected: {payload.get('incidents_detected')}")
    assert payload.get("incidents_detected", 0) >= 1, "Expected at least 1 smurfing incident detected!"

    matched_incident = next(
        (inc for inc in payload.get("incidents", []) if inc.get("beneficiary_account") == target_beneficiary),
        None
    )
    assert matched_incident is not None, f"Target beneficiary {target_beneficiary} not found in incidents: {payload}"
    print(f"  Matched Incident: Beneficiary {matched_incident['beneficiary_account']} received {matched_incident['transaction_count']} deposits totalling ₹{matched_incident['total_amount']:,.2f} from {matched_incident['distinct_senders_count']} distinct senders.")

    # 4. Verify PostgreSQL Alerts Table
    print("\n[3] Querying PostgreSQL 'alerts' Table for Automatically Inserted High-Priority Alert...")
    expected_title = f"Action Required: Freeze Account {target_beneficiary} due to Smurfing"
    alert = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "FINANCIAL_TRIPWIRE",
            Alert.title == expected_title,
            Alert.status == "new"
        )
        .first()
    )

    assert alert is not None, f"Alert with title '{expected_title}' was not found in database!"
    print(f"  ALERT CONFIRMED in DB [ID: {alert.id}]:")
    print(f"    Title:       {alert.title}")
    print(f"    Severity:    {alert.severity.upper()}")
    print(f"    ThreatScore: {alert.threat_score}")
    print(f"    Status:      {alert.status}")
    print(f"    Description: {alert.description}")

    # 5. Clean up seeded test transactions
    for tx in test_seed_txs:
        db.delete(tx)
    db.commit()
    db.close()

    print("\n" + "=" * 80)
    print("SUCCESS: Automation 2 (Financial Tripwire Smurfing Detection) Verified End-to-End!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    try:
        test_smurfing_financial_tripwire()
        sys.exit(0)
    except AssertionError as ae:
        print(f"\nASSERTION ERROR: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"\nUNEXPECTED ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
