from typing import Dict, Any
from app.database.neo4j import execute_cypher


def get_network_topology(limit: int = 100) -> Dict[str, Any]:
    query = """
    MATCH (n)-[r]->(m)
    RETURN n, r, m
    LIMIT $limit
    """
    records = execute_cypher(query, {"limit": limit})
    nodes_map = {}
    edges = []

    for row in records:
        src = row.get("n")
        rel = row.get("r")
        tgt = row.get("m")

        if src:
            src_id = str(src.element_id) if hasattr(src, "element_id") else str(src.id)
            nodes_map[src_id] = {
                "id": src_id,
                "label": list(src.labels)[0] if hasattr(src, "labels") and src.labels else "Entity",
                "properties": dict(src)
            }
        if tgt:
            tgt_id = str(tgt.element_id) if hasattr(tgt, "element_id") else str(tgt.id)
            nodes_map[tgt_id] = {
                "id": tgt_id,
                "label": list(tgt.labels)[0] if hasattr(tgt, "labels") and tgt.labels else "Entity",
                "properties": dict(tgt)
            }
        if rel and src and tgt:
            edges.append({
                "source": str(src.element_id) if hasattr(src, "element_id") else str(src.id),
                "target": str(tgt.element_id) if hasattr(tgt, "element_id") else str(tgt.id),
                "type": rel.type if hasattr(rel, "type") else "CONNECTED_TO",
                "properties": dict(rel)
            })

    return {
        "nodes": list(nodes_map.values()),
        "edges": edges
    }
