from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    name: str
    type: str  # PERSON, VEHICLE, BANK_ACCOUNT, PHONE, LOCATION, CASE
    riskScore: Optional[float] = None
    properties: Dict[str, Any] = {}


class CytoscapeNode(BaseModel):
    data: CytoscapeNodeData


class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    label: str
    type: str  # TRANSFERRED_MONEY_TO, CALLED, SIGHTED_AT, OWNS_ACCOUNT, etc.
    confidence: Optional[float] = 1.0
    properties: Dict[str, Any] = {}


class CytoscapeEdge(BaseModel):
    data: CytoscapeEdgeData


class CytoscapeGraphResponse(BaseModel):
    nodes: List[CytoscapeNode]
    edges: List[CytoscapeEdge]
    total_nodes: int
    total_edges: int
