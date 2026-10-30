from typing import List, Dict, Any
from datetime import datetime, timedelta


def project_network_growth(nodes_count: int, edges_count: int, rate: float = 1.15) -> List[Dict[str, Any]]:
    projections = []
    current_nodes = nodes_count
    current_edges = edges_count
    base_date = datetime.utcnow()

    for month in range(1, 7):
        current_nodes = int(current_nodes * rate)
        current_edges = int(current_edges * (rate ** 1.2))
        projections.append({
            "period": (base_date + timedelta(days=30 * month)).strftime("%Y-%m"),
            "projected_nodes": current_nodes,
            "projected_edges": current_edges,
            "syndicate_expansion_risk": "HIGH" if current_nodes > nodes_count * 2 else "MODERATE"
        })

    return projections
