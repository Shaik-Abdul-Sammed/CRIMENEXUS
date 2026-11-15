import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.external.interpol_adapter import get_interpol_adapter

logger = logging.getLogger("crimenexus.interpol_sync")

router = APIRouter(tags=["Cross-Border Intelligence Sharing (Interpol Sync)"])

class InterpolQueryRequest(BaseModel):
    query: Optional[str] = None
    notice_type: Optional[str] = "ALL"
    nationality: Optional[str] = None

class RedNoticeDraftRequest(BaseModel):
    suspect_id: str
    suspect_name: str
    charges: str
    fir_number: str
    target_jurisdictions: List[str]

@router.get("/interpol-sync/health", summary="Interpol Sync Health Check")
@router.get("/interpol/health", summary="Interpol Health Check")
def interpol_health():
    return {
        "status": "healthy",
        "service": "Interpol I-24/7 Global Communications & NCB New Delhi Node",
        "gateway_status": "NCB_NEW_DELHI_CONNECTED",
        "notices_supported": ["RED_NOTICE", "YELLOW_NOTICE", "BLUE_NOTICE", "BLACK_NOTICE"],
        "mou_fallback_active": True,
        "version": "1.0.0"
    }

@router.get("/interpol/notices", summary="Fetch Interpol Notices from I-24/7 Pipeline")
@router.get("/interpol-sync/notices", summary="Fetch Interpol Notices from I-24/7 Pipeline")
def get_interpol_notices(
    query: Optional[str] = Query(None, description="Search by fugitive name, charges, or notice ID"),
    notice_type: Optional[str] = Query("ALL", description="RED_NOTICE, YELLOW_NOTICE, BLUE_NOTICE, or ALL")
):
    adapter = get_interpol_adapter()
    results = adapter.query_notices(query=query, notice_type=notice_type)
    return {
        "gateway": "CBI NCB New Delhi I-24/7 Terminal",
        "total_notices": len(results),
        "notices": results
    }

@router.post("/interpol/query", summary="Query Interpol I-24/7 Registry")
def query_interpol_notices(payload: InterpolQueryRequest):
    adapter = get_interpol_adapter()
    results = adapter.query_notices(
        query=payload.query,
        notice_type=payload.notice_type,
        nationality=payload.nationality
    )
    return {
        "query": payload.query,
        "total_hits": len(results),
        "results": results
    }

@router.post("/interpol/draft-red-notice", summary="Draft Interpol Red Notice Packet for MHA Clearance")
def draft_red_notice(payload: RedNoticeDraftRequest):
    adapter = get_interpol_adapter()
    return adapter.submit_red_notice_draft(payload.dict())
