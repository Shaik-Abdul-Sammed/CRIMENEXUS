from typing import List, Dict, Any
from pydantic import BaseModel


class MainSuspect(BaseModel):
    id: str
    name: str
    degree_centrality: float
    betweenness_centrality: float
    total_connections: int
    risk_score: float
    classification: str  # CRITICAL, HIGH, MEDIUM, LOW


class NetworkMetricsResponse(BaseModel):
    top_suspects: List[MainSuspect]
    density: float
    total_nodes: int
    total_edges: int
    communities_detected: int


class ThreatAssessmentResponse(BaseModel):
    suspect_name: str
    overall_threat_score: float  # 0 to 100
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    factors: Dict[str, Any]
    recommended_actions: List[str]
