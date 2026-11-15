import pytest
import networkx as nx
from app.services.graph.sna_analyzer import SNAGangAnalyzer, get_sna_analyzer
from app.api.sna_gangs import analyze_gang_network, sna_health

def test_sna_gang_analyzer_happy_path():
    """Happy Path: Verifies articulation cut-point detection and removal impact calculation on a bridge graph."""
    analyzer = get_sna_analyzer()
    # A barbell/bridge graph where node B connects cluster A (A1-A2-B) to cluster C (B-C1-C2)
    nodes = [
        {"id": "A1", "name": "Gangster 1"},
        {"id": "A2", "name": "Gangster 2"},
        {"id": "B", "name": "Kingpin Cut-Point"},
        {"id": "C1", "name": "Shooter 1"},
        {"id": "C2", "name": "Shooter 2"}
    ]
    edges = [
        {"source": "A1", "target": "A2"},
        {"source": "A1", "target": "B"},
        {"source": "A2", "target": "B"},
        {"source": "B", "target": "C1"},
        {"source": "B", "target": "C2"},
        {"source": "C1", "target": "C2"}
    ]
    
    G = analyzer.build_graph(nodes, edges)
    results = analyzer.analyze_network(G)
    
    assert results["total_nodes"] == 5
    assert results["total_edges"] == 6
    assert "B" in results["cut_points"], "Node B must be identified as the cut-point separating the clusters"
    
    # Check that B has the highest removal impact score
    impact_ranks = results["removal_impact"]
    assert impact_ranks[0]["node_id"] == "B"
    assert impact_ranks[0]["is_cut_point"] is True
    assert impact_ranks[0]["removal_impact_score"] > 50.0

def test_sna_gang_empty_graph_edge_case():
    """Edge Case: Checks handling of empty graph and single isolated node."""
    analyzer = SNAGangAnalyzer()
    empty_g = nx.Graph()
    res = analyzer.analyze_network(empty_g)
    assert res["total_nodes"] == 0
    assert res["cut_points"] == []
    
    single_node_g = analyzer.build_graph([{"id": "SOLO", "name": "Lone Wolf"}], [])
    res_single = analyzer.analyze_network(single_node_g)
    assert res_single["total_nodes"] == 1
    assert res_single["cut_points"] == []

def test_sna_api_registry_and_not_found():
    """Failure/Validation: Checks unknown gang id raises 404, valid gang returns full intelligence."""
    health = sna_health()
    assert health["status"] == "healthy"
    
    # Valid gang
    data = analyze_gang_network("GANG-NCR-01")
    assert data["gang_id"] == "GANG-NCR-01"
    assert len(data["cut_points"]) > 0
    assert len(data["removal_impact"]) > 0
    
    # Non-existent gang raises 404
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        analyze_gang_network("NON-EXISTENT-SYNDICATE-999")
    assert exc_info.value.status_code == 404
