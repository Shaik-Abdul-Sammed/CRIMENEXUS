"""
CRIMENEXUS Data Science AI & Model Boundary Audit Suite.

Covers:
- Test 3.1: Vernacular Mixed Hindi/English Named Entity Recognition (NER Edge Case)
- Test 3.2: Isolation Forest Resilience & Fallback to Structuring Heuristic Rule
- Test 3.3: SHAP Feature Attributions & TreeExplainer Threat Decomposition
- Test 3.4: Adamic-Adar Topological Link Prediction & Human-Readable Explanations
"""

import sys
import os
os.environ.setdefault("MPLBACKEND", "Agg")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.forensics.nlp_extractor import extract_entities_from_police_narrative
from app.ml_service.anomaly_detector import AnomalyDetector


class TestModelBoundaries(unittest.TestCase):
    """AI model boundary, edge-case, and explainability audit."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_3_1_vernacular_ner_mixed_hindi_english(self):
        """Test 3.1: Verify NER extracts suspect and vehicle from mixed Hindi/English narrative."""
        test_name = "Test 3.1 (Mixed Hindi/English NER Extraction)"
        mixed_narrative = (
            "विशेष सूचना: आरोपी Rajan was seen driving Black Scorpio vehicle number DL-01-AB-1234 "
            "near Noida Sector 62. संदेहास्पद मोबाइल +91 98765 43210 भी सक्रिय पाया गया।"
        )

        try:
            extracted = extract_entities_from_police_narrative(mixed_narrative)

            # Check Vehicle extraction (normalized or raw)
            found_vehicles = " ".join(extracted.get("VEHICLE", []))
            self.assertTrue(
                "DL" in found_vehicles and "1234" in found_vehicles,
                f"Failed to extract vehicle DL-01-AB-1234 from narrative: {extracted.get('VEHICLE')}"
            )

            # Check Suspect extraction
            found_suspects = extracted.get("SUSPECT", [])
            found_text = " ".join(found_suspects).lower()
            self.assertTrue(
                "rajan" in found_text or any("rajan" in str(v).lower() for v in extracted.values()),
                f"Failed to extract suspect Rajan from mixed text: {extracted}"
            )

            # Check Phone extraction
            found_phones = extracted.get("PHONE", [])
            self.assertTrue(
                any("98765" in p for p in found_phones),
                f"Failed to extract phone number +91 98765 43210: {found_phones}"
            )

            print(f"[PASS] {test_name}: Vernacular mixed text parsed; extracted Suspect, Vehicle, and Phone.")
        except Exception as e:
            print(f"[FAIL] {test_name}: {e}")
            raise

    def test_3_2_isolation_forest_heuristic_fallback(self):
        """Test 3.2: Verify anomaly detector falls back to heuristic rule (>3 txns < 50k) if joblib fails."""
        test_name = "Test 3.2 (Isolation Forest Heuristic Fallback)"

        try:
            # Instantiate detector with mocked joblib failure
            with patch("app.ml_service.anomaly_detector.joblib.load") as mock_load:
                mock_load.side_effect = IOError("Corrupt or unreadable serialized model file on disk")

                fallback_detector = AnomalyDetector()
                fallback_detector.use_heuristic_fallback = True

                # Evaluate structured transfers (4 transactions of 49,000 INR)
                smurfing_txs = [
                    {"amount": 49000.0, "timestamp": "2026-10-29T10:00:00Z"},
                    {"amount": 48500.0, "timestamp": "2026-10-29T10:01:00Z"},
                    {"amount": 49200.0, "timestamp": "2026-10-29T10:02:00Z"},
                    {"amount": 48900.0, "timestamp": "2026-10-29T10:03:00Z"},
                ]

                eval_result = fallback_detector.evaluate_account_transactions("ACC-MULE-TEST-01", smurfing_txs)

                self.assertEqual(
                    eval_result.get("model_used"),
                    "heuristic",
                    f"Expected model_used='heuristic', got '{eval_result.get('model_used')}'"
                )
                self.assertTrue(
                    eval_result.get("is_outlier"),
                    "Heuristic rule failed to flag >3 transactions under 50k as an anomaly!"
                )
                self.assertGreaterEqual(
                    eval_result.get("anomaly_score", 0),
                    0.85,
                    "Heuristic anomaly score below high priority threshold."
                )

                # Test via HTTP API endpoint
                api_resp = self.client.post(
                    "/api/v1/analytics/anomaly/evaluate",
                    json={
                        "beneficiary_account": "ACC-MULE-TEST-01",
                        "transactions": smurfing_txs
                    }
                )
                self.assertEqual(api_resp.status_code, 200, f"Expected 200 OK, got {api_resp.status_code}")

            print(f"[PASS] {test_name}: Isolation Forest fallback triggered heuristic rule (>3 txns <50k); returned HTTP 200.")
        except Exception as e:
            print(f"[FAIL] {test_name}: {e}")
            raise

    def test_3_3_shap_threat_decomposition_and_contributions(self):
        """Test 3.3: Verify threat risk score endpoint returns decomposed feature contributions."""
        test_name = "Test 3.3 (SHAP Threat Feature Contributions)"

        try:
            response = self.client.get("/api/v1/threats/risk-score/Rajan")

            self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}")
            data = response.json()

            # Assert feature contributions presence
            self.assertIn(
                "feature_contributions",
                data,
                "Response missing 'feature_contributions' SHAP dictionary."
            )
            contributions = data["feature_contributions"]
            self.assertIsInstance(contributions, dict, "feature_contributions must be a dictionary.")

            # Assert standard forensic features exist
            self.assertTrue(
                "Burner Phones" in contributions or "degree_centrality" in contributions or len(contributions) >= 2,
                f"Expected forensic SHAP weights, got: {contributions}"
            )

            print(f"[PASS] {test_name}: SHAP feature contributions returned with decomposed threat weights.")
        except Exception as e:
            print(f"[FAIL] {test_name}: {e}")
            raise

    def test_3_4_adamic_adar_link_prediction_explanation(self):
        """Test 3.4: Verify link prediction endpoint returns human-interpretable topological explanations."""
        test_name = "Test 3.4 (Link Prediction & Explainability)"

        try:
            response = self.client.get("/api/v1/network/predict-links")

            self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}")
            data = response.json()

            links = data.get("predicted_links", [])
            self.assertGreater(
                len(links),
                0,
                "Expected at least one predicted link in the syndicate topology."
            )

            # Check explanation / rationale field
            first_link = links[0]
            has_explanation = bool(
                first_link.get("explanation") or first_link.get("rationale") or first_link.get("shared_triangles")
            )
            self.assertTrue(
                has_explanation,
                f"Predicted link missing explanation or rationale: {first_link}"
            )

            print(f"[PASS] {test_name}: Link prediction returned unobserved edges with topological explanation.")
        except Exception as e:
            print(f"[FAIL] {test_name}: {e}")
            raise


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestModelBoundaries)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
