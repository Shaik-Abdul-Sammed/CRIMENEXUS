import pytest
from app.services.graph.route_analyzer import RouteAnalyzer, get_route_analyzer
from app.api.route_analysis import route_analysis_health, analyze_crime_routes, RouteAnalysisRequest, AnchorNode, CrimePoint

def test_route_analyzer_happy_path():
    """Happy Path: Verifies crimes along travel corridor between Home and Work fall inside awareness space."""
    analyzer = get_route_analyzer()
    anchors = [
        {"id": "HOME", "label": "Residence", "lat": 28.60, "lon": 77.10},
        {"id": "WORK", "label": "Hideout", "lat": 28.70, "lon": 77.10}
    ]
    # Crimes directly along the meridian line between home and work
    crimes = [
        {"id": "C1", "offense": "Theft", "lat": 28.62, "lon": 77.10},
        {"id": "C2", "offense": "Theft", "lat": 28.65, "lon": 77.10},
        {"id": "C3", "offense": "Theft", "lat": 28.68, "lon": 77.10},
        {"id": "C4_FAR", "offense": "Theft", "lat": 28.10, "lon": 77.80} # Far away
    ]
    
    res = analyzer.analyze_awareness_space("OFFENDER-TEST-1", anchors, crimes, buffer_radius_km=3.0)
    assert res["total_crimes"] == 4
    assert res["crimes_inside_buffer"] == 3
    assert res["crime_overlap_percentage"] == 75.0
    assert res["theory_validation"] == "STRONG_CORRIDOR_CONGRUENCE"

def test_route_analyzer_empty_anchors_edge_case():
    """Edge Case: Zero anchor nodes should return safe zeroed structure without errors."""
    analyzer = RouteAnalyzer()
    res = analyzer.analyze_awareness_space("OFFENDER-EMPTY", [], [{"id": "C1", "lat": 28.0, "lon": 77.0}])
    assert res["total_crimes"] == 0 or res["crimes_inside_buffer"] == 0
    assert res["crime_overlap_percentage"] == 0.0

def test_route_analysis_api_endpoint():
    """API Endpoint Validation: Health check and POST route analyze."""
    health = route_analysis_health()
    assert health["status"] == "healthy"
    
    req = RouteAnalysisRequest(
        offender_id="SUSP-99",
        anchor_nodes=[
            AnchorNode(id="A1", label="Home", lat=28.60, lon=77.00),
            AnchorNode(id="A2", label="Market", lat=28.62, lon=77.02)
        ],
        crime_events=[
            CrimePoint(id="CR1", offense="Snatching", lat=28.61, lon=77.01)
        ],
        buffer_radius_km=2.0
    )
    result = analyze_crime_routes(req)
    assert result["offender_id"] == "SUSP-99"
    assert result["crimes_inside_buffer"] == 1
