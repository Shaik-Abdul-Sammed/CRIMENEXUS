import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.external.osint_monitor import get_osint_service

logger = logging.getLogger("crimenexus.osint_monitor")

router = APIRouter(tags=["OSINT & Dark Web Monitoring"])

class OSINTScanRequest(BaseModel):
    raw_text: str = Field(..., description="Paste or post content to scan for contraband or terror indicators")

@router.get("/osint-monitor/health", summary="OSINT Monitor Health Check")
@router.get("/osint/health", summary="OSINT Health Check")
def osint_health():
    return {
        "status": "healthy",
        "service": "Open Source Intelligence (OSINT) & Dark Web Threat Pipeline",
        "sources": ["Public Telegram Scrapers", "Tor Paste Sites", "Forum Threat Feeds"],
        "version": "1.0.0"
    }

@router.get("/osint/alerts", summary="Get Live OSINT Threat Alerts")
@router.get("/osint-monitor/alerts", summary="Get Live OSINT Threat Alerts")
def get_osint_alerts(min_threat: float = Query(50.0, description="Minimum threat score filter")):
    service = get_osint_service()
    alerts = service.get_latest_alerts(min_threat_score=min_threat)
    return {
        "total_alerts": len(alerts),
        "alerts": alerts
    }

@router.post("/osint/scan", summary="Scan Raw Intelligence Snippet")
def scan_osint_text(payload: OSINTScanRequest):
    service = get_osint_service()
    return service.scan_custom_text(payload.raw_text)
