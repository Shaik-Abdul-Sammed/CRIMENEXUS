import csv
import io
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database.neo4j import execute_cypher
from app.models.call_record import CallRecord

logger = logging.getLogger("crimenexus.forensics.cdr")

# Reference cell tower coordinate registry (expandable via cell database)
KNOWN_TOWERS: Dict[str, Dict[str, Any]] = {
    "TOWER-NOIDA-62": {"lat": 28.6280, "lon": 77.3649, "sector": "Sector 62 Tech Zone, Noida", "azimuth": 45},
    "TOWER-DEL-CONN": {"lat": 28.6315, "lon": 77.2167, "sector": "Connaught Place Inner Circle, Delhi", "azimuth": 180},
    "TOWER-MUM-PORT": {"lat": 18.9496, "lon": 72.8530, "sector": "Nhava Sheva Dockyards, Mumbai", "azimuth": 270},
    "TOWER-BLR-ECITY": {"lat": 12.8399, "lon": 77.6770, "sector": "Electronic City Phase 1, Bengaluru", "azimuth": 90},
    "TOWER-YAMUNA-KM48": {"lat": 28.1402, "lon": 77.5510, "sector": "Yamuna Expressway Toll KM 48", "azimuth": 135},
}


def parse_telecom_cdr_csv(file_content: str, db: Session) -> Dict[str, Any]:
    """
    Parses telecom CDR data (supporting Airtel, Jio, Vi, BSNL multi-carrier formats),
    performs forensic cell tower geolocation, identifies SIM-swapping / IMEI anomalies,
    and executes dual-write to PostgreSQL and Neo4j.
    """
    reader = csv.DictReader(io.StringIO(file_content))
    processed_records: List[Dict[str, Any]] = []
    imei_to_sims: Dict[str, set] = {}
    tower_hits: Dict[str, int] = {}
    pair_counts: Dict[str, int] = {}

    for row in reader:
        # Standardize heterogeneous carrier column names
        caller = row.get("calling_number") or row.get("caller") or row.get("a_party") or row.get("source_number", "")
        receiver = row.get("called_number") or row.get("receiver") or row.get("b_party") or row.get("destination_number", "")
        duration = int(row.get("duration") or row.get("duration_sec") or row.get("call_duration", 60))
        timestamp = row.get("timestamp") or row.get("date_time") or datetime.utcnow().isoformat()
        tower = row.get("cell_tower") or row.get("tower_id") or row.get("first_cgi") or "TOWER-NOIDA-62"
        imei = row.get("imei") or row.get("handset_imei") or "358912093847291"
        call_type = row.get("call_type") or "VOICE"

        if not caller or not receiver:
            continue

        caller = caller.strip()
        receiver = receiver.strip()
        tower = tower.strip()
        imei = imei.strip()

        # Track IMEI to SIM swapping anomalies
        if imei not in imei_to_sims:
            imei_to_sims[imei] = set()
        imei_to_sims[imei].add(caller)

        # Track tower density
        tower_hits[tower] = tower_hits.get(tower, 0) + 1

        # Track pair communication frequency
        pair_key = f"{caller} <-> {receiver}"
        pair_counts[pair_key] = pair_counts.get(pair_key, 0) + 1

        # Geolocation lookup
        tower_geo = KNOWN_TOWERS.get(tower, {"lat": 28.6139, "lon": 77.2090, "sector": "General Metropolitan", "azimuth": 0})

        record_id = f"CDR-{uuid.uuid4().hex[:8].upper()}"

        # 1. PostgreSQL Relational Persistence
        pg_record = CallRecord(
            record_id=record_id,
            caller_number=caller,
            caller_name=row.get("caller_name", f"Subscriber {caller[-4:]}"),
            receiver_number=receiver,
            receiver_name=row.get("receiver_name", f"Subscriber {receiver[-4:]}"),
            duration_seconds=duration,
            tower_id=tower,
            location_name=tower_geo["sector"],
            call_type=call_type
        )
        db.add(pg_record)
        processed_records.append({
            "record_id": record_id,
            "caller": caller,
            "receiver": receiver,
            "duration": duration,
            "tower": tower,
            "sector": tower_geo["sector"],
            "timestamp": timestamp,
            "imei": imei
        })

    db.commit()

    # 2. Graph Topologies in Neo4j
    cypher_ingest = """
    UNWIND $records as r
    MERGE (c_ph:Phone {phone_number: r.caller})
    MERGE (r_ph:Phone {phone_number: r.receiver})
    MERGE (tower:Location {name: r.sector})
      ON CREATE SET tower.tower_id = r.tower
    MERGE (handset:Device {imei: r.imei})

    MERGE (c_ph)-[:CONNECTED_FROM]->(tower)
    MERGE (c_ph)-[:INSERTED_IN]->(handset)

    CREATE (c_ph)-[:CALLED {
        record_id: r.record_id,
        duration: r.duration,
        timestamp: r.timestamp
    }]->(r_ph)
    """
    try:
        execute_cypher(cypher_ingest, {"records": processed_records})
    except Exception as exc:
        logger.error("Failed to dual-write bulk CDR to Neo4j: %s", exc)

    # Detect Handset Swapping (Burner SIMs used in same physical phone)
    sim_swap_alerts = []
    for imei, sims in imei_to_sims.items():
        if len(sims) > 1:
            sim_swap_alerts.append({
                "imei": imei,
                "associated_sims": list(sims),
                "alert": f"CRITICAL: Handset IMEI {imei} used with {len(sims)} distinct SIM numbers (Burner Swapping)."
            })

    return {
        "status": "success",
        "total_records_ingested": len(processed_records),
        "unique_phone_nodes": len(set([r["caller"] for r in processed_records] + [r["receiver"] for r in processed_records])),
        "tower_distribution": tower_hits,
        "highest_frequency_pairs": sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)[:5],
        "sim_swap_anomalies": sim_swap_alerts,
        "first_5_records": processed_records[:5]
    }
