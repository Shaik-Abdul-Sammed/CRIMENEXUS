import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database.neo4j import execute_cypher
from app.database.postgres import SessionLocal
from app.models.audit_ledger import AuditLedgerEntry
from app.models.case import Case

logger = logging.getLogger("crimenexus.gun_intelligence")

router = APIRouter(tags=["Crime Gun Intelligence Center (CGIC)"])

class FirearmTraceRequest(BaseModel):
    serial_number: str
    make: str
    model: str
    caliber: str
    recovery_fir: str
    recovery_location: str
    recovery_date: str
    purchaser_name: Optional[str] = "Unknown Initial Purchaser"
    first_retail_date: Optional[str] = "2025-11-01"

@router.get("/gun-intelligence/health", summary="CGIC Health Check")
def gun_intelligence_health():
    return {
        "status": "healthy",
        "service": "Crime Gun Intelligence Center (CGIC & eTrace)",
        "capabilities": ["Serial Tracing", "Time-To-Crime Straw Purchase Detection", "Ballistics Scene Linkage"],
        "statutory_framework": "Arms Act 1959 (Amended 2019) Sec 25 & Sec 7",
        "version": "1.0.0"
    }

@router.get("/gun-intelligence/traces", summary="Get Tracked Firearm Traces")
def get_gun_traces():
    neo_traces = []
    try:
        cypher = """
        MATCH (f:Firearm)
        OPTIONAL MATCH (f)-[:RECOVERED_IN]->(c:Case)
        RETURN f.serial_number AS serial_number,
               f.make AS make,
               f.model AS model,
               f.caliber AS caliber,
               f.recovery_location AS recovery_location,
               f.recovery_date AS recovery_date,
               f.first_purchaser AS first_purchaser,
               f.first_retail_date AS first_retail_date,
               f.time_to_crime_days AS time_to_crime_days,
               f.is_straw_purchase AS is_straw_purchase,
               c.case_number AS recovery_fir
        """
        records = execute_cypher(cypher)
        for r in records:
            if r.get("serial_number"):
                neo_traces.append({
                    "trace_id": f"CGIC-NEO-{r['serial_number']}",
                    "serial_number": r.get("serial_number"),
                    "make": r.get("make") or "Unknown Make",
                    "model": r.get("model") or "Unspecified Model",
                    "caliber": r.get("caliber") or "9mm",
                    "recovery_fir": r.get("recovery_fir") or "FIR-LIVE-RECOVERY",
                    "recovery_location": r.get("recovery_location") or "NCR Jurisdiction",
                    "first_purchaser": r.get("first_purchaser") or "Licensed Dealer Record",
                    "first_retail_date": r.get("first_retail_date") or "2025-01-01",
                    "recovery_date": r.get("recovery_date") or "2026-01-01",
                    "time_to_crime_days": r.get("time_to_crime_days") or 60,
                    "is_straw_purchase": bool(r.get("is_straw_purchase", False)),
                    "linked_shooting_scenes": [r.get("recovery_fir")] if r.get("recovery_fir") else [],
                    "trafficking_nexus": "Neo4j Graph Linked Pipeline",
                    "status": "LIVE_GRAPH_RECORD"
                })
    except Exception as exc:
        logger.warning("Error fetching firearm nodes from Neo4j: %s", exc)

    pg_traces = []
    try:
        db = SessionLocal()
        try:
            entries = db.query(AuditLedgerEntry).filter(AuditLedgerEntry.resource_type == "FIREARM").limit(50).all()
            for e in entries:
                try:
                    payload = json.loads(e.details) if e.details else {}
                except Exception:
                    payload = {}
                pg_traces.append({
                    "trace_id": f"CGIC-PG-{e.id[:8]}",
                    "serial_number": e.resource_id,
                    "make": payload.get("make", "Seized Weapon"),
                    "model": payload.get("model", "Recovered Firearm"),
                    "caliber": payload.get("caliber", "Unknown Caliber"),
                    "recovery_fir": payload.get("recovery_fir", "FIR-RECOVERED"),
                    "recovery_location": payload.get("recovery_location", "Seizure Evidence Locker"),
                    "first_purchaser": payload.get("first_purchaser", "Under Investigation"),
                    "first_retail_date": payload.get("first_retail_date", "2025-01-01"),
                    "recovery_date": str(e.timestamp)[:10],
                    "time_to_crime_days": payload.get("time_to_crime_days", 45),
                    "is_straw_purchase": payload.get("is_straw_purchase", False),
                    "linked_shooting_scenes": [payload.get("recovery_fir")] if payload.get("recovery_fir") else [],
                    "trafficking_nexus": "PostgreSQL Chain-of-Custody Audit Record",
                    "status": "POSTGRES_VERIFIED"
                })
        finally:
            db.close()
    except Exception as pg_exc:
        logger.warning("Error reading firearm records from PostgreSQL: %s", pg_exc)

    seen_serials = set()
    combined_traces = []
    for t in neo_traces + pg_traces:
        s = t.get("serial_number")
        if s and s not in seen_serials:
            seen_serials.add(s)
            combined_traces.append(t)

    return {
        "total_traces": len(combined_traces),
        "straw_purchases_detected": sum(1 for t in combined_traces if t.get("is_straw_purchase")),
        "traces": combined_traces
    }

@router.post("/gun-intelligence/trace", summary="Submit Firearm for eTrace & Straw Purchase Analysis")
def submit_firearm_trace(payload: FirearmTraceRequest):
    try:
        d1 = datetime.fromisoformat(payload.first_retail_date)
        d2 = datetime.fromisoformat(payload.recovery_date)
        ttc = max(0, (d2 - d1).days)
    except Exception:
        ttc = 65

    is_straw = ttc <= 90

    trace_seq = int(datetime.utcnow().timestamp()) % 10000
    new_trace = {
        "trace_id": f"CGIC-TR-2026-{trace_seq:04d}",
        "serial_number": payload.serial_number,
        "make": payload.make,
        "model": payload.model,
        "caliber": payload.caliber,
        "recovery_fir": payload.recovery_fir,
        "recovery_location": payload.recovery_location,
        "first_purchaser": payload.purchaser_name,
        "first_retail_date": payload.first_retail_date,
        "recovery_date": payload.recovery_date,
        "time_to_crime_days": ttc,
        "is_straw_purchase": is_straw,
        "linked_shooting_scenes": [payload.recovery_fir or "FIR-2026-UNSOLVED-BALLISTICS"],
        "trafficking_nexus": "Interstate Arms Ring (Arms Act Sec 25(1AA))" if is_straw else "Secondary Market Diversion",
        "status": "STRAW_PURCHASE_FLAGGED" if is_straw else "TRACE_COMPLETE"
    }

    try:
        cypher = """
        MERGE (f:Firearm {serial_number: $serial})
        SET f.make = $make,
            f.model = $model,
            f.caliber = $caliber,
            f.recovery_location = $recovery_location,
            f.recovery_date = $recovery_date,
            f.first_purchaser = $first_purchaser,
            f.first_retail_date = $first_retail_date,
            f.time_to_crime_days = $ttc,
            f.is_straw_purchase = $is_straw
        WITH f
        MERGE (c:Case {case_number: $recovery_fir})
        MERGE (f)-[:RECOVERED_IN]->(c)
        """
        execute_cypher(cypher, {
            "serial": payload.serial_number,
            "make": payload.make,
            "model": payload.model,
            "caliber": payload.caliber,
            "recovery_location": payload.recovery_location,
            "recovery_date": payload.recovery_date,
            "first_purchaser": payload.purchaser_name,
            "first_retail_date": payload.first_retail_date,
            "ttc": ttc,
            "is_straw": is_straw,
            "recovery_fir": payload.recovery_fir
        })
    except Exception as neo_err:
        logger.warning("Failed writing firearm node to Neo4j: %s", neo_err)

    try:
        db = SessionLocal()
        try:
            import hashlib
            raw_hash = hashlib.sha256(f"{payload.serial_number}|{payload.recovery_fir}|{datetime.utcnow().isoformat()}".encode()).hexdigest()
            entry = AuditLedgerEntry(
                officer_badge="CGIC-BALLISTICS-UNIT",
                officer_name="Forensic Arms Examiner",
                station_id="CGIC_HQ",
                action="FIREARM_TRACE_REGISTERED",
                resource_type="FIREARM",
                resource_id=payload.serial_number,
                details=json.dumps(new_trace),
                previous_hash="0"*64,
                current_hash=raw_hash
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as pg_err:
        logger.warning("Failed logging firearm trace to PostgreSQL: %s", pg_err)

    return new_trace

@router.get("/gun-intelligence/export/atf", summary="Export Traced Firearms to ATF eTrace Form 3312.1 Format")
@router.get("/gun-intelligence/atf-etrace/export", summary="Export Traced Firearms to ATF eTrace Form 3312.1 Format")
def export_traces_to_atf(year: Optional[str] = None, format: Optional[str] = "JSON"):
    if year and not year.isdigit():
        return {"status": "INVALID_FILTER", "warning": f"Year filter '{year}' ignored, returning all active records."}
    from app.services.legal.atf_export import ATFeTraceExporter
    traces_data = get_gun_traces()
    return ATFeTraceExporter.export_trace_to_atf_format(traces_data.get("traces", []))
