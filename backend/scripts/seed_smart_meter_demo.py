"""
Seeds smart meter demo readings into PostgreSQL smart_meter_readings table.
Generates 10 realistic smart grid meters across Delhi-NCR with intentional surge anomalies.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add backend to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database.postgres import SessionLocal, engine, Base
from app.models.smart_meter_reading import SmartMeterReading


DEMO_READINGS = [
    {
        "meter_id": "SM-NOIDA-9811",
        "address": "Sector 62 Safehouse Hideout, Noida",
        "latitude": 28.6355,
        "longitude": 77.3720,
        "baseline_kwh": 0.38,
        "kwh_reading": 4.82,  # Surge: ~12x baseline
    },
    {
        "meter_id": "SM-NOIDA-1042",
        "address": "Sector 18 Commercial Concourse, Noida",
        "latitude": 28.5710,
        "longitude": 77.3265,
        "baseline_kwh": 12.4,
        "kwh_reading": 14.1,  # Normal
    },
    {
        "meter_id": "SM-DEL-CP-4401",
        "address": "Connaught Place Inner Circle Block C",
        "latitude": 28.6328,
        "longitude": 77.2197,
        "baseline_kwh": 4.5,
        "kwh_reading": 11.2,  # Surge: >2x baseline
    },
    {
        "meter_id": "SM-DEL-KB-0912",
        "address": "Karol Bagh Commercial Hub, Central Delhi",
        "latitude": 28.6517,
        "longitude": 77.1906,
        "baseline_kwh": 2.2,
        "kwh_reading": 6.8,  # Surge: >3x baseline
    },
    {
        "meter_id": "SM-YE-TOLL-4801",
        "address": "Yamuna Expressway KM 48 Checkpoint",
        "latitude": 28.1402,
        "longitude": 77.5510,
        "baseline_kwh": 3.1,
        "kwh_reading": 3.9,  # Normal
    },
    {
        "meter_id": "SM-GUR-CYBER-02",
        "address": "DLF Cyber City Phase 2, Gurugram",
        "latitude": 28.4950,
        "longitude": 77.0895,
        "baseline_kwh": 5.0,
        "kwh_reading": 15.5,  # Surge: >3x baseline
    },
    {
        "meter_id": "SM-GZ-IND-001",
        "address": "Sahibabad Industrial Area Site 4, Ghaziabad",
        "latitude": 28.6720,
        "longitude": 77.3480,
        "baseline_kwh": 25.0,
        "kwh_reading": 27.2,  # Normal
    },
    {
        "meter_id": "SM-DEL-HAUZ-08",
        "address": "Hauz Khas Village Perimeter, South Delhi",
        "latitude": 28.5535,
        "longitude": 77.1945,
        "baseline_kwh": 3.5,
        "kwh_reading": 4.1,  # Normal
    },
    {
        "meter_id": "SM-NOIDA-SEC20-01",
        "address": "Noida Sector 20 Logistics Corridor",
        "latitude": 28.5815,
        "longitude": 77.3308,
        "baseline_kwh": 2.0,
        "kwh_reading": 7.4,  # Surge: >3.5x baseline
    },
    {
        "meter_id": "SM-DEL-DARYA-04",
        "address": "Daryaganj Ring Road Warehousing",
        "latitude": 28.6480,
        "longitude": 77.2410,
        "baseline_kwh": 4.2,
        "kwh_reading": 4.9,  # Normal
    }
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        count = 0
        for item in DEMO_READINGS:
            existing = db.query(SmartMeterReading).filter(SmartMeterReading.meter_id == item["meter_id"]).first()
            if not existing:
                reading = SmartMeterReading(
                    meter_id=item["meter_id"],
                    address=item["address"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    kwh_reading=item["kwh_reading"],
                    baseline_kwh=item["baseline_kwh"],
                    reading_timestamp=now - timedelta(hours=count * 2)
                )
                db.add(reading)
                count += 1
        db.commit()
        print(f"Successfully seeded {count} smart meter readings into database.")
    except Exception as exc:
        print(f"Seeding error: {exc}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
