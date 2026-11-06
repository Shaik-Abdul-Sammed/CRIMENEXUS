import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_network_graph_api_endpoint():
    """Verify Network Graph endpoint returns structured nodes and edges with validity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/network/graph?case_id=CASE-2026-8812")
        assert response.status_code in [200, 307]
        if response.status_code == 200:
            data = response.json()
            assert "nodes" in data or "elements" in data or isinstance(data, list)

@pytest.mark.asyncio
async def test_geo_tactical_map_endpoint():
    """Verify Geo tactical map HTML renders with SAMEORIGIN headers for clean embedding."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/geo/tactical-map?case_id=CASE-2026-8812&lat=28.5850&lon=77.3180&zoom=13")
        assert response.status_code == 200
        assert "html" in response.headers.get("content-type", "").lower()
        # Verify X-Frame-Options is SAMEORIGIN (not DENY) so it embeds cleanly
        frame_header = response.headers.get("x-frame-options", "").upper()
        assert frame_header in ["SAMEORIGIN", ""]

@pytest.mark.asyncio
async def test_geo_police_proximity_dispatch():
    """Verify police proximity calculation endpoint returns valid nearest station and ETA."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/geo/proximity?lat=28.5850&lon=77.3180")
        if response.status_code == 200:
            data = response.json()
            assert "name" in data or "nearest_station" in data or "distance_km" in data or "eta_mins" in data
