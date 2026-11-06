"""
Isolation Forest & Financial Smurfing Anomaly Training Script.
Trains an enterprise Scikit-Learn IsolationForest model on the 10,000 synthetic transaction dataset.
Extracts 5 multi-variate features per transaction cluster:
  1. Mean transfer amount
  2. Sub-50k threshold proximity ratio (fraction between 40,000 and 49,990)
  3. Unique senders count
  4. Burst frequency (transactions per 48-hour window)
  5. Inter-arrival time variance in hours
Saves the trained model via joblib to backend/app/ml_service/models/isolation_forest.pkl.
"""

import os
import sys
import json
import logging
from collections import defaultdict
from datetime import datetime
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_anomaly")

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "transactions_training_data.json")
MODEL_OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "isolation_forest.pkl")


def extract_features_from_transactions(records: list) -> np.ndarray:
    """Groups transactions by beneficiary account and builds 5-D feature vectors."""
    grouped = defaultdict(list)
    for r in records:
        grouped[r["beneficiary_account"]].append(r)

    feature_matrix = []
    for account, txns in grouped.items():
        amounts = [t["amount"] for t in txns]
        mean_amt = float(np.mean(amounts))

        # Proximity to INR 50k smurfing ceiling
        near_50k_count = sum(1 for a in amounts if 40000.0 <= a <= 49990.0)
        proximity_ratio = near_50k_count / max(1, len(amounts))

        unique_senders = len(set(t["sender_account"] for t in txns))
        total_txns = len(txns)

        # Parse timestamps to calculate time window
        times = sorted([datetime.fromisoformat(t["timestamp"]) for t in txns])
        if len(times) > 1:
            span_hours = max(0.5, (times[-1] - times[0]).total_seconds() / 3600.0)
            burst_freq = total_txns / (span_hours / 48.0)
            diffs = [(times[i+1] - times[i]).total_seconds() / 3600.0 for i in range(len(times)-1)]
            time_var = float(np.std(diffs))
        else:
            burst_freq = 1.0
            time_var = 12.0

        feature_matrix.append([mean_amt, proximity_ratio, unique_senders, burst_freq, time_var])

    return np.array(feature_matrix, dtype=np.float32)


def train_and_save_model(data_path: str, model_path: str):
    logger.info("Loading transaction dataset from %s...", data_path)
    with open(data_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    logger.info("Extracting cluster feature vectors across %d transaction records...", len(records))
    X = extract_features_from_transactions(records)
    logger.info("Constructed feature matrix with shape: %s", X.shape)

    try:
        from sklearn.ensemble import IsolationForest
        import joblib
    except ImportError as e:
        logger.error("Scikit-Learn or Joblib not installed: %s", e)
        return

    logger.info("Training IsolationForest (n_estimators=150, contamination=0.20, random_state=42)...")
    clf = IsolationForest(
        n_estimators=150,
        contamination=0.20,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X)

    # Calculate baseline score distribution
    raw_scores = clf.decision_function(X)
    logger.info("Trained model baseline score: min=%.4f, mean=%.4f, max=%.4f",
                raw_scores.min(), raw_scores.mean(), raw_scores.max())

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(clf, model_path)
    logger.info("Model saved successfully to: %s", model_path)


if __name__ == "__main__":
    train_and_save_model(DATA_PATH, MODEL_OUTPUT)
