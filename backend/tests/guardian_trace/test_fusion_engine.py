import pytest
from datetime import datetime, timedelta, timezone
from app.services.guardian_trace.fusion_engine import GuardianFusionEngine

def test_12_sightings_ordered_trajectory():
    engine = GuardianFusionEngine()
    base_time = datetime(2026, 11, 8, 14, 0, 0, tzinfo=timezone.utc)
    
    # Generate 12 sightings in shuffled/unordered order
    raw_sightings = [
        {"id": 1, "timestamp": (base_time + timedelta(hours=i * 1.5)).isoformat(), "lat": 28.5355 + i * 0.005, "lon": 77.3910 + i * 0.004, "source": "CCTV", "confidence": 0.8}
        for i in range(12)
    ]
    # Reverse to test that fusion engine sorts chronologically
    shuffled_sightings = list(reversed(raw_sightings))

    fused = engine.fuse_sightings(shuffled_sightings)
    trajectory = fused["trajectory"]

    assert len(trajectory) == 12
    # Verify strict ascending chronological order
    for idx in range(len(trajectory) - 1):
        t1 = datetime.fromisoformat(trajectory[idx]["timestamp"])
        t2 = datetime.fromisoformat(trajectory[idx + 1]["timestamp"])
        assert t1 <= t2, f"Trajectory order inverted at index {idx}: {t1} > {t2}"

    assert fused["last_known"] is not None
    assert fused["last_known"]["id"] == 11 or trajectory[-1]["id"] == 11
    assert fused["total_sightings"] == 12

def test_3_sightings_within_100m_cluster_to_one_hotspot():
    engine = GuardianFusionEngine()
    base_time = datetime(2026, 11, 8, 14, 0, 0, tzinfo=timezone.utc)

    # 3 sightings clustered tightly within ~50 meters of (28.5355, 77.3910)
    clustered_sightings = [
        {
            "id": 101,
            "timestamp": (base_time + timedelta(minutes=10)).isoformat(),
            "lat": 28.53550,
            "lon": 77.39100,
            "source": "WIFI",
            "confidence": 0.75,
            "location_name": "Sector 62 Tea Stall"
        },
        {
            "id": 102,
            "timestamp": (base_time + timedelta(minutes=20)).isoformat(),
            "lat": 28.53565,
            "lon": 77.39115,
            "source": "BLE",
            "confidence": 0.70,
            "location_name": "Sector 62 Bus Shelter"
        },
        {
            "id": 103,
            "timestamp": (base_time + timedelta(minutes=30)).isoformat(),
            "lat": 28.53545,
            "lon": 77.39090,
            "source": "UPI",
            "confidence": 0.85,
            "location_name": "Sector 62 Grocery Kiosk"
        },
    ]

    fused = engine.fuse_sightings(clustered_sightings)
    hotspots = fused["hotspots"]

    # Since all 3 sightings are within 50-80m (well below the 500m threshold),
    # they must cluster into exactly 1 hotspot
    assert len(hotspots) == 1
    hotspot = hotspots[0]
    assert hotspot["sighting_count"] == 3
    # Check centroid coordinates are close to the cluster average
    assert abs(hotspot["lat"] - 28.5355) < 0.001
    assert abs(hotspot["lon"] - 77.3910) < 0.001

def test_search_grid_returns_3_tiers():
    engine = GuardianFusionEngine()
    lat, lon = 28.5355, 77.3910

    grid = engine.generate_search_grid(lat, lon, speed_kmh=4.0, hours_elapsed=1.0)
    assert "tiers" in grid
    tiers = grid["tiers"]

    # Standard Ring Search must produce exactly 3 tactical tiers
    assert len(tiers) == 3

    tier_1 = tiers[0]
    assert tier_1["tier"] == 1
    assert "Foot Patrol" in tier_1["tactical_action"] or "Drone" in tier_1["tactical_action"]
    assert tier_1["radius_km"] == 1.0

    tier_2 = tiers[1]
    assert tier_2["tier"] == 2
    assert "PCR Van" in tier_2["tactical_action"] or "Transit" in tier_2["tactical_action"]
    assert tier_2["radius_km"] == 3.0

    tier_3 = tiers[2]
    assert tier_3["tier"] == 3
    assert "Border" in tier_3["tactical_action"] or "Cordon" in tier_3["tactical_action"]
    assert tier_3["radius_km"] == 10.0
