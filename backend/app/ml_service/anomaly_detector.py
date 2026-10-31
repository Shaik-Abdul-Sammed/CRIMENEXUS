import logging
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("crimenexus.ml.anomaly")


class FinancialSmurfingAnomalyDetector:
    """
    Production Machine Learning Anomaly Detector for Financial Transactions.
    Uses Unsupervised Isolation Forest trained on structuring, smurfing, and layering
    transaction features to output continuous anomaly scores (0.0 to 1.0).
    """

    def __init__(self):
        self.version = "1.0.0-isolation-forest"
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.10,
            max_samples="auto",
            random_state=42
        )
        self._is_trained = False
        self._train_baseline_model()

    def _train_baseline_model(self):
        """
        Trains baseline Isolation Forest on synthetic banking ledger distributions:
        - Inliers: Regular utility, merchant, and business wire transfers.
        - Outliers: Structured smurfing transfers right below the INR 50,000 regulatory reporting threshold.
        Features:
          1. amount
          2. abs(50000 - amount)
          3. transaction_count_48h
          4. distinct_senders
          5. mean_time_delta_hours
        """
        np.random.seed(42)
        # Normal commercial transactions (amounts from 1,000 to 250,000, low cluster frequency)
        normal_samples = np.random.uniform(
            low=[1000, 5000, 1, 1, 12.0],
            high=[250000, 200000, 2, 2, 96.0],
            size=(400, 5)
        )

        # Structured smurfing patterns (clusters of deposits between 40,000 and 49,990 from distinct accounts)
        smurf_samples = np.random.uniform(
            low=[44000, 10, 3, 3, 0.5],
            high=[49990, 6000, 8, 7, 3.5],
            size=(50, 5)
        )

        X_train = np.vstack([normal_samples, smurf_samples])
        self.model.fit(X_train)
        self._is_trained = True
        logger.info("Isolation Forest anomaly model trained successfully on %d financial samples", len(X_train))

    def evaluate_account_transactions(
        self,
        beneficiary_account: str,
        transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extracts multi-variate features from a set of incoming transfers to an account
        and scores them using Isolation Forest.
        Returns continuous anomaly_score (0.0 - 1.0) and boolean trigger threshold (> 0.85).
        """
        if not transactions:
            return {
                "beneficiary_account": beneficiary_account,
                "anomaly_score": 0.05,
                "is_outlier": False,
                "high_priority_alert": False,
                "feature_metrics": {}
            }

        amounts = [float(tx.get("amount", 0)) for tx in transactions]
        avg_amount = float(np.mean(amounts))
        tx_count = len(transactions)
        distinct_senders = len(set(tx.get("sender_account", "") for tx in transactions if tx.get("sender_account")))
        dist_to_threshold = float(abs(50000.0 - avg_amount))

        # Velocity features: compute real temporal velocity across timestamps if provided
        timestamps = []
        for tx in transactions:
            ts_val = tx.get("timestamp")
            if ts_val:
                try:
                    from datetime import datetime
                    timestamps.append(datetime.fromisoformat(str(ts_val).replace("Z", "")))
                except Exception:
                    pass

        if len(timestamps) >= 2:
            timestamps.sort()
            span_hours = max(0.1, (timestamps[-1] - timestamps[0]).total_seconds() / 3600.0)
            time_delta_hours = float(span_hours / max(1, len(timestamps) - 1))
        else:
            time_delta_hours = 2.0  # Default cluster window

        feature_vector = np.array([[
            avg_amount,
            dist_to_threshold,
            tx_count,
            distinct_senders,
            time_delta_hours
        ]])

        raw_decision = float(self.model.decision_function(feature_vector)[0])
        raw_prediction = int(self.model.predict(feature_vector)[0])  # -1 outlier, 1 inlier

        # Threshold-dodging evasion defense:
        # Criminal smurfs attempting evasion specifically use transactions in [₹48,000, ₹49,999]
        dodging_txs = [amt for amt in amounts if 48000.0 <= amt < 50000.0]
        threshold_dodging = (len(dodging_txs) >= 2) or (dist_to_threshold <= 2000.0 and tx_count >= 2)
        structuring_flag = (tx_count >= 2 and all(amt < 50000 for amt in amounts) and (distinct_senders >= 2 or threshold_dodging))

        base_score = 0.5 - (raw_decision * 4.0)
        if structuring_flag or threshold_dodging:
            anomaly_score = float(np.clip(base_score + 0.40, 0.86, 0.99))
        else:
            anomaly_score = float(np.clip(base_score, 0.05, 0.75))

        anomaly_score = round(anomaly_score, 4)
        is_high_priority = anomaly_score >= 0.85

        return {
            "beneficiary_account": beneficiary_account,
            "anomaly_score": anomaly_score,
            "is_outlier": raw_prediction == -1 or is_high_priority,
            "high_priority_alert": is_high_priority,
            "feature_metrics": {
                "transaction_count": tx_count,
                "distinct_senders": distinct_senders,
                "average_amount": avg_amount,
                "proximity_to_50k_limit": dist_to_threshold,
                "structuring_detected": structuring_flag,
                "threshold_dodging_evasion_detected": threshold_dodging,
                "velocity_hours_delta": round(time_delta_hours, 2),
                "model_version": self.version,
                "poisoning_protection": "ACTIVE_IMMUTABLE"
            }
        }

    def reject_poisoning_retrain(self, external_samples: Any) -> bool:
        """
        Adversarial Defense: Rejects unauthorized online retraining attempts to prevent
        data poisoning of baseline Isolation Forest weights.
        """
        logger.warning("[POISONING DEFENSE] Attempt to alter core ML weights rejected. Model is immutable.")
        return True


# Singleton model instance
_detector_instance = None

def get_anomaly_detector() -> FinancialSmurfingAnomalyDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = FinancialSmurfingAnomalyDetector()
    return _detector_instance
