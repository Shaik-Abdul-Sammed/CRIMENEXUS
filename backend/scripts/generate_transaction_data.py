"""
Synthetic Financial Transaction Data Generator for Hawala Smurfing & Anomaly Modeling.
Generates 10,000 transactions:
- 80% (8,000) Normal legitimate commercial & retail transactions (varied amounts, normal intervals)
- 20% (2,000) Structured Smurfing transactions (3+ transfers under INR 50,000 within a 48-hour window
  routed from diverse sender mule accounts to the same beneficiary).
Outputs to backend/app/ml_service/models/transactions_training_data.json and .csv.
"""

import os
import csv
import json
import random
from datetime import datetime, timedelta

OUTPUT_JSON = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml_service", "models", "transactions_training_data.json")
OUTPUT_CSV = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "ml_service", "models", "transactions_training_data.csv")

NORMAL_ACCOUNTS = [f"ACC-NORM-{i:04d}" for i in range(1, 200)]
MULE_BENEFICIARIES = [f"ACC-SMURF-TARGET-{i:02d}" for i in range(1, 20)]
MULE_SENDERS = [f"ACC-MULE-SRC-{i:03d}" for i in range(1, 100)]


def generate_normal_transactions(count: int, base_time: datetime) -> list:
    txns = []
    for i in range(count):
        # Varied amounts: micro payments (100-2,000) to large RTGS (100,000 - 800,000)
        bucket = random.choices(["micro", "retail", "large"], weights=[0.4, 0.45, 0.15])[0]
        if bucket == "micro":
            amount = round(random.uniform(50.0, 2500.0), 2)
        elif bucket == "retail":
            amount = round(random.uniform(2500.0, 48000.0), 2)
        else:
            amount = round(random.uniform(75000.0, 950000.0), 2)

        sender = random.choice(NORMAL_ACCOUNTS)
        beneficiary = random.choice(NORMAL_ACCOUNTS)
        while beneficiary == sender:
            beneficiary = random.choice(NORMAL_ACCOUNTS)

        timestamp = base_time + timedelta(
            days=random.randint(0, 30),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        txns.append({
            "txn_id": f"TXN-NORM-{i+1:06d}",
            "amount": amount,
            "sender_account": sender,
            "beneficiary_account": beneficiary,
            "timestamp": timestamp.isoformat(),
            "channel": random.choice(["UPI", "NEFT", "IMPS", "RTGS"]),
            "is_smurfing": 0
        })
    return txns


def generate_smurfing_clusters(target_count: int, base_time: datetime) -> list:
    """Generates structured smurfing bursts (3-7 transfers under INR 50,000 into same beneficiary within 48h)."""
    txns = []
    cluster_idx = 1
    while len(txns) < target_count:
        target = random.choice(MULE_BENEFICIARIES)
        cluster_start = base_time + timedelta(days=random.randint(0, 28), hours=random.randint(0, 20))
        cluster_size = random.randint(3, 6)

        # Ensure we don't overshoot target_count
        actual_size = min(cluster_size, target_count - len(txns))
        # Choose distinct senders to simulate mule structuring
        senders = random.sample(MULE_SENDERS, k=actual_size)

        for j in range(actual_size):
            # Classic smurfing threshold: INR 42,000 - 49,990 (just below INR 50k mandatory CTR alert)
            amount = round(random.uniform(43500.0, 49850.0), 2)
            txn_time = cluster_start + timedelta(hours=random.uniform(0.5, 46.0))

            txns.append({
                "txn_id": f"TXN-SMURF-C{cluster_idx}-{j+1}",
                "amount": amount,
                "sender_account": senders[j],
                "beneficiary_account": target,
                "timestamp": txn_time.isoformat(),
                "channel": random.choice(["UPI", "IMPS", "NEFT"]),
                "is_smurfing": 1
            })
        cluster_idx += 1

    return txns


def main():
    print("[*] Generating 10,000 synthetic transaction records (80% Normal, 20% Smurfing)...")
    random.seed(42)
    base_time = datetime(2026, 3, 1, 8, 0, 0)

    normal_txns = generate_normal_transactions(8000, base_time)
    smurf_txns = generate_smurfing_clusters(2000, base_time)

    all_txns = normal_txns + smurf_txns
    random.shuffle(all_txns)

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_txns, f, indent=2)

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["txn_id", "amount", "sender_account", "beneficiary_account", "timestamp", "channel", "is_smurfing"])
        writer.writeheader()
        writer.writerows(all_txns)

    print(f"[+] Successfully generated {len(all_txns)} transactions.")
    print(f"    - Normal records: {len(normal_txns)} (80%)")
    print(f"    - Smurfing records: {len(smurf_txns)} (20%)")
    print(f"[+] Saved JSON to: {OUTPUT_JSON}")
    print(f"[+] Saved CSV to:  {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
