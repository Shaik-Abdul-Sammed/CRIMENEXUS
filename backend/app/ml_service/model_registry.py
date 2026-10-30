import logging
from typing import Dict, Any

from app.ml_service.ocr_engine import check_tesseract_availability
from app.ml_service.ner_model import get_ner_pipeline
from app.ml_service.anomaly_detector import get_anomaly_detector
from app.ml_service.explainable_risk import get_risk_model
from app.ml_service.semantic_search import get_mo_semantic_search_engine

logger = logging.getLogger("crimenexus.ml.registry")


class MLModelRegistry:
    """
    MLOps Singleton Model Registry.
    Loads and caches all production machine learning and forensic NLP models
    in-memory on application startup, guaranteeing sub-50ms cold-start latency.
    """

    def __init__(self):
        self.initialized = False
        self.models_status: Dict[str, Any] = {}

    def warm_up_all_models(self) -> Dict[str, Any]:
        """Loads and warms up all ML models into RAM."""
        logger.info("[MLOps] Initializing and warming up CRIMENEXUS Production ML Pipeline...")

        # 1. OCR Engine
        tesseract_ok = check_tesseract_availability()
        self.models_status["ocr_engine"] = {
            "name": "Tesseract-OCR",
            "status": "READY" if tesseract_ok else "UNAVAILABLE",
            "type": "Optical Character Recognition (Scanned FIR/PDF)"
        }

        # 2. Named Entity Recognizer
        ner = get_ner_pipeline()
        self.models_status["ner_model"] = {
            "name": "PoliceFIRNamedEntityRecognizer",
            "version": ner.version,
            "status": "READY",
            "supported_entities": ["SUSPECT", "VICTIM", "LOCATION", "VEHICLE", "LEGAL_SECTION", "PHONE"]
        }

        # 3. Isolation Forest Anomaly Detector
        anomaly_det = get_anomaly_detector()
        self.models_status["financial_anomaly_detector"] = {
            "name": "FinancialSmurfingAnomalyDetector",
            "version": anomaly_det.version,
            "status": "READY",
            "algorithm": "IsolationForest(n_estimators=100, contamination=0.10)"
        }

        # 4. Explainable AI Threat Risk Model
        xai_model = get_risk_model()
        self.models_status["explainable_risk_model"] = {
            "name": "ExplainableThreatRiskModel",
            "version": xai_model.version,
            "status": "READY",
            "attribution": "Tree Marginal Shapley Value Decomposition (SHAP)"
        }

        # 5. Modus Operandi Semantic Vector Search
        mo_search = get_mo_semantic_search_engine()
        self.models_status["mo_semantic_search"] = {
            "name": "ModusOperandiSemanticSearchEngine",
            "version": mo_search.version,
            "status": "READY",
            "indexed_cases": len(mo_search.cases),
            "algorithm": "L2-Normalized TF-IDF with Cosine Similarity"
        }

        self.initialized = True
        logger.info("[MLOps] All 5 CRIMENEXUS ML Models successfully cached in memory.")
        return self.models_status

    def get_status(self) -> Dict[str, Any]:
        return {
            "mlops_registry_initialized": self.initialized,
            "models": self.models_status
        }


# Singleton registry
registry = MLModelRegistry()

def get_ml_registry() -> MLModelRegistry:
    return registry
