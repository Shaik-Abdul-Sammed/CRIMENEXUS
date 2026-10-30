from typing import List, Dict, Any
from fastapi import APIRouter

from ai_engine.network_analysis.centrality import compute_main_suspects
from ai_engine.network_analysis.community_detection import detect_criminal_cells
from ai_engine.threat_prediction.threat_model import calculate_risk_score
from ai_engine.anomaly_detection.anomaly_model import detect_suspicious_money_trails
from ai_engine.link_prediction.link_model import predict_unobserved_links, predict_next_likely_move

router = APIRouter(prefix="/threats", tags=["AI & Threat Intelligence Engine"])


@router.get("/main-suspects")
def get_main_suspects(top_n: int = 5) -> List[Dict[str, Any]]:
    """Calculates network centrality to identify primary kingpins and brokers."""
    return compute_main_suspects(top_n=top_n)


@router.get("/risk-score/{person_name}")
def get_entity_risk_score(person_name: str) -> Dict[str, Any]:
    """Generates comprehensive risk score (0-100%) and actionable recommendations."""
    return calculate_risk_score(person_name)


@router.get("/criminal-cells")
def get_criminal_cells() -> List[Dict[str, Any]]:
    """Partitions the crime network into operational syndicates and money mule rings."""
    return detect_criminal_cells()


@router.get("/money-trails")
def get_money_trails(min_amount: float = 100000.0) -> List[Dict[str, Any]]:
    """Detects multi-hop money laundering paths and circular wire transfers."""
    return detect_suspicious_money_trails(min_amount=min_amount)


@router.get("/predict-links")
def get_predicted_links() -> List[Dict[str, Any]]:
    """Predicts covert/unobserved links using graph topology heuristics."""
    return predict_unobserved_links()


@router.get("/predict-move/{plate_number}")
def get_next_likely_move(plate_number: str) -> Dict[str, Any]:
    """Predicts next probable checkpoint and interception window for suspect vehicle."""
    return predict_next_likely_move(plate_number)
