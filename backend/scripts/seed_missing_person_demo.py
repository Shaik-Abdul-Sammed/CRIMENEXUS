import os
import sys
import json
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.database.postgres import SessionLocal, engine, Base
from app.models.guardian_trace import MissingPersonCase, DigitalSighting, SearchPrediction

DEMO_CASE = {
    "case_number": "MP-2026-DEMO-001",
    "person_name": "Aanya Sharma",
    "age": 8,
    "gender": "Female",
    "description": "8-year-old girl, brown hair, wearing blue school uniform (Delhi Public School), red school bag, small scar on left knee",
    "photo_url": "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400",
    "last_seen_lat": 28.5665,
    "last_seen_lon": 77.2431,
    "last_seen_location": "Lajpat Nagar Metro Station, Exit Gate 3",
    "last_seen_time": (datetime.utcnow() - timedelta(hours=18)).isoformat(),
    "reporter_name": "Ramesh Sharma",
    "reporter_phone": "+91 98XXXX1234",
    "reporter_relation": "Father",
    "mobile_number": "+91 98XXXX5678",  # Aanya's phone (with her)
    "imei": "356789012345678",
    "known_contacts": ["+91 98XXXX1234", "+91 98XXXX9999"],  # Father, mother
    "frequent_locations": [
        {"name": "Home", "lat": 28.5710, "lon": 77.2450},
        {"name": "DPS School Lajpat Nagar", "lat": 28.5640, "lon": 77.2400},
        {"name": "Tuition Center", "lat": 28.5680, "lon": 77.2380}
    ],
    "medical_conditions": ["Asthma - carries inhaler in bag"],
    "priority": "CRITICAL",
    "station_id": "PS-LAJPAT-NAGAR"
}

# Exactly 12 digital sightings across 18 hours:
SIGHTINGS = [
    # Hour 0 (18.0h ago) - Last seen at metro
    {"source": "IMEI_PING", "lat": 28.5665, "lon": 77.2431, "confidence": 0.95, "hours_ago": 18.0, "note": "Lajpat Nagar Metro Gate 3 initial cellular ping"},
    {"source": "CCTV", "lat": 28.5668, "lon": 77.2425, "confidence": 0.85, "hours_ago": 17.8, "note": "Station exit corridor optical verification"},
    {"source": "METRO_CARD", "lat": 28.5660, "lon": 77.2435, "confidence": 0.90, "hours_ago": 17.5, "note": "Metro card tap - Violet Line entry"},
    # Hour 1 (17.2h ago) - Train ride to Rajiv Chowk
    {"source": "METRO_CARD", "lat": 28.6328, "lon": 77.2197, "confidence": 0.90, "hours_ago": 17.2, "note": "Rajiv Chowk Interchange exit tap"},
    # Hour 3 (15.0h ago) - CCTV sighting Connaught Place
    {"source": "CCTV", "lat": 28.6320, "lon": 77.2185, "confidence": 0.80, "hours_ago": 15.0, "note": "CP Inner Circle optical detection"},
    # Hour 5 (13.0h ago) - Sudden WiFi probe near Connaught Place
    {"source": "WIFI_PROBE", "lat": 28.6315, "lon": 77.2167, "confidence": 0.70, "hours_ago": 13.0, "note": "Public cafe WiFi probe broadcast"},
    # Hour 6 (12.0h ago) - UPI transaction
    {"source": "UPI", "lat": 28.6280, "lon": 77.2140, "confidence": 0.85, "hours_ago": 12.0, "note": "UPI transaction - ₹200 pharmacy medicine debit"},
    # Hour 8 (10.0h ago) - Bluetooth MAC near Paharganj
    {"source": "BLUETOOTH", "lat": 28.6420, "lon": 77.2120, "confidence": 0.65, "hours_ago": 10.0, "note": "Bluetooth BLE peripheral beacon in Paharganj"},
    # Hour 12 (6.0h ago) - Secondary WiFi router handshake
    {"source": "WIFI_PROBE", "lat": 28.6435, "lon": 77.2105, "confidence": 0.72, "hours_ago": 6.0, "note": "Commercial guesthouse router probe"},
    # Hour 16 (2.0h ago) - Bus ticket purchase
    {"source": "TRANSIT", "lat": 28.6458, "lon": 77.2087, "confidence": 0.90, "hours_ago": 2.0, "note": "DTC Bus E-Ticket: Paharganj to NDLS"},
    # Hour 17 (1.0h ago) - Citizen sighting report
    {"source": "CITIZEN", "lat": 28.6480, "lon": 77.2070, "confidence": 0.60, "hours_ago": 1.0, "note": "Citizen Sentinel verified tip: girl with red school bag"},
    # Hour 18 (0.5h ago) - Latest IMEI ping
    {"source": "IMEI_PING", "lat": 28.6500, "lon": 77.2050, "confidence": 0.92, "hours_ago": 0.5, "note": "Active tower handover: Sector 4 New Delhi Railway"}
]

PREDICTIONS = [
    {
        "predicted_lat": 28.6430,
        "predicted_lon": 77.2195,
        "confidence": 0.87,
        "reasoning": {
            "title": "New Delhi Railway Station (Platform Concourse)",
            "summary": "Time-of-day + transit direction vector points directly to NDLS platform gates.",
            "shap_weights": {"trajectory_vector": 0.42, "transit_hub": 0.38, "time_of_day": 0.20}
        }
    },
    {
        "predicted_lat": 28.6420,
        "predicted_lon": 77.2120,
        "confidence": 0.72,
        "reasoning": {
            "title": "Paharganj Hotel & Transit Lodging Zone",
            "summary": "Dense Bluetooth MAC cluster and high-turnover pedestrian lodging density.",
            "shap_weights": {"bluetooth_beacon": 0.40, "shelter_density": 0.35, "historical_cases": 0.25}
        }
    },
    {
        "predicted_lat": 28.6520,
        "predicted_lon": 77.1900,
        "confidence": 0.65,
        "reasoning": {
            "title": "Karol Bagh Commercial Metro Corridor",
            "summary": "Westbound Blue Line connection and high-density commercial markets.",
            "shap_weights": {"metro_line": 0.45, "crowd_density": 0.30, "time_of_day": 0.25}
        }
    }
]


def seed_guardian_trace_demo():
    print("=" * 70)
    print("CRIMENEXUS GUARDIAN TRACE: Seeding Demo Missing Child Case...")
    print("Scenario: Aanya Sharma (8), Lajpat Nagar Metro Station")
    print("=" * 70)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if case exists
        existing_case = db.query(MissingPersonCase).filter(
            MissingPersonCase.case_number == DEMO_CASE["case_number"]
        ).first()

        now = datetime.utcnow()

        if existing_case:
            print(f"[+] Case {DEMO_CASE['case_number']} already exists (ID: {existing_case.id}). Updating records...")
            case_id = existing_case.id
            # Clean old demo sightings & predictions to keep test idempotent
            db.query(DigitalSighting).filter(DigitalSighting.case_id == case_id).delete()
            db.query(SearchPrediction).filter(SearchPrediction.case_id == case_id).delete()
            db.commit()
        else:
            new_case = MissingPersonCase(
                case_number=DEMO_CASE["case_number"],
                person_name=DEMO_CASE["person_name"],
                age=DEMO_CASE["age"],
                gender=DEMO_CASE["gender"],
                description=DEMO_CASE["description"],
                photo_url=DEMO_CASE["photo_url"],
                last_seen_lat=DEMO_CASE["last_seen_lat"],
                last_seen_lon=DEMO_CASE["last_seen_lon"],
                last_seen_time=now - timedelta(hours=18),
                last_seen_location=DEMO_CASE["last_seen_location"],
                reporter_name=DEMO_CASE["reporter_name"],
                reporter_phone=DEMO_CASE["reporter_phone"],
                reporter_relation=DEMO_CASE["reporter_relation"],
                mobile_number=DEMO_CASE["mobile_number"],
                imei=DEMO_CASE["imei"],
                known_contacts=DEMO_CASE["known_contacts"],
                frequent_locations=DEMO_CASE["frequent_locations"],
                medical_conditions=DEMO_CASE["medical_conditions"],
                status="ACTIVE",
                priority=DEMO_CASE["priority"],
                assigned_officer="Inspector Rajesh Varma (Missing Persons Unit)",
                station_id=DEMO_CASE["station_id"],
                created_at=now - timedelta(hours=18),
            )
            db.add(new_case)
            db.commit()
            db.refresh(new_case)
            case_id = new_case.id
            print(f"[+] Created MissingPersonCase: {new_case.case_number} (ID: {case_id})")

        # Insert exactly 12 digital sightings
        print(f"[+] Seeding {len(SIGHTINGS)} multimodal digital sightings across 18 hours...")
        geojson_features = []
        coordinates_line = []

        for s in SIGHTINGS:
            s_time = now - timedelta(hours=s["hours_ago"])
            sighting = DigitalSighting(
                case_id=case_id,
                source=s["source"],
                latitude=s["lat"],
                longitude=s["lon"],
                confidence=s["confidence"],
                timestamp=s_time,
                raw_data={"note": s["note"], "hours_ago": s["hours_ago"]},
                verified=True,
            )
            db.add(sighting)

            coordinates_line.append([s["lon"], s["lat"]])
            geojson_features.append({
                "type": "Feature",
                "properties": {
                    "source": s["source"],
                    "confidence": s["confidence"],
                    "timestamp": s_time.isoformat(),
                    "note": s["note"],
                    "hours_ago": s["hours_ago"]
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [s["lon"], s["lat"]]
                }
            })

        # Insert 3 Search Predictions
        print(f"[+] Seeding {len(PREDICTIONS)} AI next-location predictions...")
        for p in PREDICTIONS:
            pred = SearchPrediction(
                case_id=case_id,
                predicted_lat=p["predicted_lat"],
                predicted_lon=p["predicted_lon"],
                confidence=p["confidence"],
                time_window_start=now,
                time_window_end=now + timedelta(hours=6),
                reasoning=p["reasoning"],
            )
            db.add(pred)

        db.commit()

        # Add trajectory line to GeoJSON
        geojson_features.append({
            "type": "Feature",
            "properties": {
                "name": "Aanya Sharma Movement Trajectory",
                "case_number": DEMO_CASE["case_number"],
                "total_hours": 18,
                "sightings_count": len(SIGHTINGS)
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates_line
            }
        })

        geojson_doc = {
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": geojson_features
        }

        # Write GeoJSON to backend/data/demo/guardian_trace_aanya.geojson
        demo_dir = os.path.join(BACKEND_ROOT, "data", "demo")
        os.makedirs(demo_dir, exist_ok=True)
        geojson_path = os.path.join(demo_dir, "guardian_trace_aanya.geojson")

        with open(geojson_path, "w", encoding="utf-8") as f:
            json.dump(geojson_doc, f, indent=2)

        print(f"[+] Generated merged GeoJSON trajectory at: {geojson_path}")
        print("=" * 70)
        print("SEEDING COMPLETE: Case MP-2026-DEMO-001 is ready for live demo!")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"[-] Error seeding demo case: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_guardian_trace_demo()
