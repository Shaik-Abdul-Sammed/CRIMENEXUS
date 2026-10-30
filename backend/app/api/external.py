import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.external.vahan_service import lookup_vahan_vehicle
from app.services.external.cctns_service import sync_cctns_fir, query_suspect_priors_icjs
from app.services.external.anpr_stream import simulate_anpr_detections

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
