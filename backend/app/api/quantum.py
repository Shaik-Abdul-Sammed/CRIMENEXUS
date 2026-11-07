"""
CRIMENEXUS Quantum API Endpoints
Exposes QAOA Intercept Route Optimization & Grover Syndicate Clique Detection.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.quantum.quantum_router import QuantumInterceptOptimizer, QISKIT_AVAILABLE
from app.quantum.quantum_graph import QuantumCliqueFinder

logger = logging.getLogger("crimenexus.api.quantum")

router = APIRouter(prefix="/quantum", tags=["Quantum Computing & QML (Qiskit)"])


class PoliceStationPayload(BaseModel):
    name: str
    lat: float
    lon: float


class ThiefLocationPayload(BaseModel):
    lat: float
    lon: float


class QuantumInterceptRequest(BaseModel):
    stations: Optional[List[PoliceStationPayload]] = None
    thief_location: Optional[ThiefLocationPayload] = None
    p_layers: int = Field(default=2, ge=1, le=5, description="QAOA circuit layer depth")


class QuantumCliqueRequest(BaseModel):
    nodes: Optional[List[str]] = None


@router.get("/status", summary="Check Qiskit Aer Quantum Simulator Status")
def get_quantum_status():
    """Returns quantum simulator availability, qubit limits, and gate capabilities."""
    return {
        "status": "ONLINE" if QISKIT_AVAILABLE else "EMULATED_FALLBACK",
        "simulator": "Qiskit Aer (AerSimulator)" if QISKIT_AVAILABLE else "Classical Geodesic Polyfill",
        "qiskit_installed": QISKIT_AVAILABLE,
        "supported_algorithms": [
            "QAOA (Quantum Approximate Optimization Algorithm)",
            "Grover Amplitude Amplification (Max-Clique)",
            "VQE (Variational Quantum Eigensolver - Roadmap)"
        ],
        "default_qubits": 16,
        "max_qubits_aer": 32,
        "quantum_ready": True
    }


@router.post("/optimize-intercept", summary="QAOA Vehicle Routing Intercept Optimization")
def optimize_intercept_route(payload: Optional[QuantumInterceptRequest] = None):
    """
    Executes a QAOA circuit on Qiskit Aer Simulator to evaluate all multi-vehicle
    intercept trajectories in quantum superposition and return the optimal intercept vector.
    """
    # High-value operational defaults if not passed
    default_stations = [
        {"name": "Jewar Police Station (Yamuna PS)", "lat": 28.1285, "lon": 77.5562},
        {"name": "Noida Sector 20 Police Station", "lat": 28.5815, "lon": 77.3308},
        {"name": "Cyber Hub Gurugram Police Post", "lat": 28.4950, "lon": 77.0895}
    ]
    default_thief = {"lat": 28.1402, "lon": 77.5510}  # Yamuna Expressway Toll KM 48

    stations_list = [s.dict() for s in payload.stations] if (payload and payload.stations) else default_stations
    thief_dict = payload.thief_location.dict() if (payload and payload.thief_location) else default_thief
    p_layers = payload.p_layers if payload else 2

    optimizer = QuantumInterceptOptimizer(p_layers=p_layers)
    try:
        return optimizer.optimize_intercept(stations=stations_list, thief_location=thief_dict)
    except Exception as exc:
        logger.error(f"Quantum optimization error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/detect-clique", summary="Grover Criminal Cell Max-Clique Analysis")
def detect_criminal_clique(payload: Optional[QuantumCliqueRequest] = None):
    """
    Runs Grover's amplitude amplification to locate the 3-node core syndicate cell
    with quadratic speedup O(sqrt(N)).
    """
    finder = QuantumCliqueFinder()
    nodes = payload.nodes if (payload and payload.nodes) else None
    return finder.find_max_clique_3(nodes=nodes)
