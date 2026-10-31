import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.external.vahan_service import lookup_vahan_vehicle
from app.services.external.cctns_service import sync_cctns_fir, query_suspect_priors_icjs
from app.services.external.anpr_stream import simulate_anpr_detections
from app.services.external.cctns_adapter import get_cctns_adapter
from app.database.postgres import SessionLocal
from app.database.neo4j import execute_cypher
from app.models.report import PoliceReport
from app.models.case import Case

logger = logging.getLogger("crimenexus.api.external")

router = APIRouter(prefix="/external", tags=["Government Police Grid & Telemetry"])


class VahanLookupRequest(BaseModel):
    plate_number: str


@router.get("/vahan/lookup/{plate_number}", summary="Query VAHAN National Vehicle Register")
def get_vahan_vehicle_details(plate_number: str):
    """
    Retrieves vehicle registration particulars, chassis number, engine number,
    and blacklisted/stolen status from the MoRTH VAHAN database.
    """
    if not plate_number or len(plate_number) < 4:
        raise HTTPException(status_code=400, detail="Invalid vehicle plate number.")
    return lookup_vahan_vehicle(plate_number)


@router.get("/cctns/sync/{fir_number}", summary="Sync FIR metadata from CCTNS / ICJS")
def get_cctns_fir_details(fir_number: str):
    """
    Fetches official First Information Report (FIR) record, Sections of Law,
    and accused criminal profile history sheets from CCTNS.
    """
    return sync_cctns_fir(fir_number)


@router.get("/icjs/priors", summary="Search inter-state criminal priors via ICJS")
def search_icjs_suspect_priors(name: str = Query(..., description="Suspect name to query")):
    """
    Searches across national police records for past chargesheets, FIRs, and history sheet status.
    """
    results = query_suspect_priors_icjs(name)
    return {
        "query": name,
        "matches_found": len(results),
        "records": results
    }


@router.get("/anpr/stream", summary="Simulate live ANPR highway checkpoint camera feed")
def get_live_anpr_telemetry(count: int = Query(5, ge=1, le=20)):
    """
    Simulates high-speed highway and city checkpoint ANPR camera detections,
    cross-matching against wanted crime syndicate hotlists.
    """
    return simulate_anpr_detections(count)


@router.post("/cctns/sync/{case_id}", summary="Pull live FIR from CCTNS adapter and merge into PostgreSQL & Neo4j")
def sync_live_cctns_fir_endpoint(case_id: str):
    """
    Fetches real-time digital FIR from National CCTNS Grid, pulls case history,
    and synchronizes entities (suspects, vehicles, sections) into PostgreSQL and Neo4j.
    """
    adapter = get_cctns_adapter()
    fir_res = adapter.fetch_fir(case_id)
    history_res = adapter.sync_case_history(case_id)
    fir_data = fir_res.get("fir_data", {})

    db = SessionLocal()
    try:
        # 1. Update or create Case in PostgreSQL
        existing_case = db.query(Case).filter(Case.case_number == case_id).first()
        if not existing_case:
            new_case = Case(
                case_number=case_id,
                title=f"CCTNS Ingested Case: {case_id} ({fir_data.get('police_station', 'Cyber Cell')})",
                status=fir_data.get("current_status", "active"),
                risk_level="high",
                description=f"Ingested from CCTNS National Grid. Sections: {', '.join(fir_data.get('acts_sections', []))}",
                location=fir_data.get("district", "Central Delhi")
            )
            db.add(new_case)
            db.commit()

        # 2. Dual-Write into Neo4j
        cypher = """
        MERGE (c:Case {case_number: $case_id})
          ON CREATE SET c.title = $title, c.cctns_status = $status, c.synced_at = datetime()
        WITH c
        UNWIND $accused AS acc
        MERGE (p:Person {name: acc.name})
          ON CREATE SET p.role = acc.crime_role, p.history_sheet = acc.history_sheet_status
        MERGE (p)-[:ACCUSED_IN]->(c)
        WITH c, p, acc
        FOREACH (_ IN CASE WHEN acc.phone_number IS NOT NULL THEN [1] ELSE [] END |
            MERGE (ph:Phone {phone_number: acc.phone_number})
            MERGE (p)-[:USES_PHONE]->(ph)
        )
        FOREACH (_ IN CASE WHEN acc.vehicle_number IS NOT NULL THEN [1] ELSE [] END |
            MERGE (v:Vehicle {plate_number: acc.vehicle_number})
            MERGE (p)-[:DRIVES]->(v)
        )
        """
        execute_cypher(cypher, {
            "case_id": case_id,
            "title": f"CCTNS Linked: {case_id}",
            "status": fir_data.get("current_status", "ACTIVE"),
            "accused": fir_data.get("accused_persons", [])
        })

        return {
            "status": "success",
            "case_id": case_id,
            "cctns_fir": fir_res,
            "icjs_history": history_res,
            "synced_into_databases": True
        }
    except Exception as exc:
        logger.error("Failed syncing CCTNS FIR into databases: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        db.close()
