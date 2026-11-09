import pytest
from datetime import datetime, timezone
from app.services.guardian_trace.fusion_engine import GuardianFusionEngine

def test_school_prediction_higher_during_morning_hours():
    engine = GuardianFusionEngine()
    
    # Anchors with school and home
    frequent_locations = [
        {"name": "Delhi Public School Noida", "lat": 28.5700, "lon": 77.3300, "type": "school"},
        {"name": "Home Residence Sector 62", "lat": 28.5355, "lon": 77.3910, "type": "home"},
        {"name": "City Center Metro Station", "lat": 28.5747, "lon": 77.3560, "type": "transit"}
    ]
    
    trajectory = [
        {"lat": 28.5400, "lon": 77.3800, "timestamp": "2026-11-09T08:00:00Z", "source": "CCTV", "confidence": 0.8},
        {"lat": 28.5500, "lon": 77.3650, "timestamp": "2026-11-09T08:45:00Z", "source": "UPI", "confidence": 0.85}
    ]

    # Predict at 09:00 AM (Morning School Hours)
    morning_time = datetime(2026, 11, 9, 9, 0, 0, tzinfo=timezone.utc)
    predictions_morning = engine.predict_next_locations(
        trajectory=trajectory,
        frequent_locations=frequent_locations,
        target_time=morning_time
    )

    assert len(predictions_morning) > 0
    school_preds_morning = [p for p in predictions_morning if "School" in p["location_name"]]
    assert len(school_preds_morning) > 0
    morning_school_conf = school_preds_morning[0]["confidence"]

    # Predict at 23:00 (Night Hours)
    night_time = datetime(2026, 11, 9, 23, 0, 0, tzinfo=timezone.utc)
    predictions_night = engine.predict_next_locations(
        trajectory=trajectory,
        frequent_locations=frequent_locations,
        target_time=night_time
    )

    school_preds_night = [p for p in predictions_night if "School" in p["location_name"]]
    if school_preds_night:
        night_school_conf = school_preds_night[0]["confidence"]
        assert morning_school_conf > night_school_conf, (
            f"School probability during morning ({morning_school_conf}) must exceed night ({night_school_conf})"
        )

def test_confidence_scores_strictly_bounded():
    engine = GuardianFusionEngine()
    
    frequent_locations = [
        {"name": "Grandparents Residence", "lat": 28.5200, "lon": 77.4200, "type": "family"},
        {"name": "Coaching Center", "lat": 28.5600, "lon": 77.3500, "type": "education"}
    ]

    trajectory = [
        {"lat": 28.5355, "lon": 77.3910, "timestamp": "2026-11-09T10:00:00Z", "source": "CCTV", "confidence": 0.99},
        {"lat": 28.5400, "lon": 77.3850, "timestamp": "2026-11-09T10:30:00Z", "source": "IMEI", "confidence": 0.99},
        {"lat": 28.5500, "lon": 77.3700, "timestamp": "2026-11-09T11:00:00Z", "source": "TRANSIT", "confidence": 0.99}
    ]

    target_time = datetime(2026, 11, 9, 12, 0, 0, tzinfo=timezone.utc)
    predictions = engine.predict_next_locations(
        trajectory=trajectory,
        frequent_locations=frequent_locations,
        target_time=target_time
    )

    assert len(predictions) > 0
    for pred in predictions:
        conf = pred["confidence"]
        assert isinstance(conf, float)
        assert 0.0 <= conf <= 1.0, f"Confidence {conf} is outside [0.0, 1.0] bound!"
        assert "feature_weights" in pred
        # SHAP-style weights should sum or be positive
        weights = pred["feature_weights"]
        assert "velocity_vector" in weights
        assert "anchor_affinity" in weights
        assert "diurnal_pattern" in weights
