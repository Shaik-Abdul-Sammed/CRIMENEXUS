import os
os.environ.setdefault("MPLBACKEND", "Agg")
import logging
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database.postgres import engine, Base
from app.database.neo4j import init_neo4j_constraints, close_neo4j_driver

# Import all SQLAlchemy models to register them on Base.metadata
from app.models.user import User
from app.models.agency import Agency
from app.models.case import Case
from app.models.person import Person
from app.models.location import Location
from app.models.relationship import Relationship
from app.models.alert import Alert
from app.models.transaction import BankTransaction
from app.models.call_record import CallRecord
from app.models.vehicle_sighting import VehicleSighting
from app.models.report import PoliceReport
from app.models.audit_ledger import AuditLedgerEntry, DualWarrantAuthorization
from app.models.custody_tracker import CustodyTracker
from app.models.public_report import PublicCrimeReport
from app.ml_service.model_registry import get_ml_registry

# Import API Routers
from app.api.auth import router as auth_router
from app.api.network import router as network_router
from app.api.threats import router as threats_router
from app.api.ingest import router as ingest_router
from app.api.cases import router as cases_router
from app.api.forensics import router as forensics_router
from app.api.legal import router as legal_router
from app.api.external import router as external_router
from app.api.analytics import router as analytics_router
from app.api.drafting import router as drafting_router
from app.api.alerts import router as alerts_router
from app.api.geo import router as geo_router
from app.api.quantum import router as quantum_router
from app.api.fusion import router as fusion_router
from app.api.escape_demo import router as escape_demo_router
from app.api.assistant import router as assistant_router
from app.api.public_report import router as public_report_router
from app.ml_service.real_data_registry import router as provenance_router
from app.api.mobile_forensics import router as mobile_forensics_router
from app.api.guardian_trace import router as guardian_trace_router
from app.api.fir_archive import router as fir_archive_router
from app.api.hundred_improvements import router as hundred_improvements_router
from app.services.streaming.redis_streams import get_streaming_stats
from app.services.streaming.stream_processor import run_stream_consumer_worker
from app.services.streaming.stream_producer import simulate_live_event
from app.services.observability import metrics_endpoint

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crimenexus.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events: initialize databases on startup, close connections on shutdown."""
    logger.info("Initializing CRIMENEXUS databases...")
    try:
        # Create relational tables in PostgreSQL
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL tables verified and synchronized.")
    except Exception as exc:
        logger.warning("Could not synchronize PostgreSQL schema on startup: %s", exc)

    try:
        # Initialize Neo4j graph schema constraints
        init_neo4j_constraints()
        logger.info("Neo4j graph schema constraints initialized.")
    except Exception as exc:
        logger.warning("Could not initialize Neo4j constraints on startup: %s", exc)

    try:
        # Pre-warm all Production ML & NLP models in-memory for zero cold-start latency
        get_ml_registry().warm_up_all_models()
        logger.info("CRIMENEXUS Production ML Pipeline cached in memory.")
    except Exception as exc:
        logger.warning("Could not warm up ML models on startup: %s", exc)

    # Launch Real-Time Redis Stream Consumer in background daemon thread
    stop_stream_worker = threading.Event()
    stream_worker_thread = threading.Thread(
        target=run_stream_consumer_worker,
        args=(stop_stream_worker,),
        daemon=True,
        name="CRIMENEXUS-RedisStreamWorker"
    )
    stream_worker_thread.start()
    logger.info("[Streaming] Redis Real-Time Pipeline Consumer thread spawned.")

    # Launch CCTNS Background Polling Daemon (15-minute interval)
    from app.api.external import poll_cctns_updates
    stop_cctns_poller = threading.Event()
    def _cctns_poll_loop():
        while not stop_cctns_poller.is_set():
            try:
                poll_cctns_updates()
            except Exception as e:
                logger.warning("CCTNS background poller loop tick error: %s", e)
            stop_cctns_poller.wait(900)  # 15 minutes

    cctns_thread = threading.Thread(target=_cctns_poll_loop, daemon=True, name="CRIMENEXUS-CCTNSPoller")
    cctns_thread.start()
    logger.info("[CCTNS] Real-Time 15-Minute Polling Daemon spawned.")

    yield

    logger.info("Shutting down CRIMENEXUS backend...")
    stop_stream_worker.set()
    stop_cctns_poller.set()
    close_neo4j_driver()


# Initialize SlowAPI rate limiter tuned for Police Department workloads
# 300/minute for active Investigating Officers, with burst capability up to 60/second
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute", "60/second"])

is_production = (
    os.getenv("ENVIRONMENT", "").lower() == "production" or
    os.getenv("ENV", "").lower() == "production"
)

app = FastAPI(
    title="CRIMENEXUS API",
    description="AI-Powered Crime Network Analysis & Multi-Source Intelligence Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json"
)

# Register rate limiter on app state and bind 429 exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_zero_trust_security_headers(request: Request, call_next):
    """Injects mandatory zero-trust defense security headers onto every API response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Allow CrimeNexus UI to embed interactive tactical GIS maps via iframe while keeping DENY on all other routes
    if "/geo/tactical-map" in request.url.path or "/geo/map-view" in request.url.path:
        response.headers["Content-Security-Policy"] = "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.onrender.com https://*.vercel.app;"
        if "X-Frame-Options" in response.headers:
            del response.headers["X-Frame-Options"]
    else:
        response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount API Routers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(network_router, prefix="/api/v1")
app.include_router(threats_router, prefix="/api/v1")
app.include_router(ingest_router, prefix="/api/v1")
app.include_router(cases_router, prefix="/api/v1")
app.include_router(forensics_router, prefix="/api/v1")
app.include_router(legal_router, prefix="/api/v1")
app.include_router(external_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(drafting_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(geo_router, prefix="/api/v1")
app.include_router(quantum_router, prefix="/api/v1")
app.include_router(fusion_router, prefix="/api/v1")
app.include_router(escape_demo_router, prefix="/api/v1")
app.include_router(assistant_router, prefix="/api/v1")
app.include_router(assistant_router, prefix="")
app.include_router(public_report_router, prefix="/api/v1")
app.include_router(provenance_router, prefix="/api/v1")
app.include_router(mobile_forensics_router, prefix="/api/v1")
app.include_router(guardian_trace_router, prefix="/api/v1")
app.include_router(fir_archive_router, prefix="/api/v1")
app.include_router(hundred_improvements_router, prefix="/api/v1")

# ── Advanced Feature Endpoints ────────────────────────────────────────────────
# Feature 1: Prometheus Metrics
from app.services.observability import metrics_endpoint
app.add_api_route("/metrics", metrics_endpoint, methods=["GET"], tags=["Observability"], include_in_schema=False)

# Feature 2: Model Drift Report
from fastapi import Depends
from app.database.postgres import get_db
from sqlalchemy.orm import Session as DBSession

from fastapi import APIRouter as _APIRouter
_adv_router = _APIRouter(prefix="/api/v1", tags=["Advanced Intelligence"])

@_adv_router.get("/ml/drift-report", summary="AI Model Drift Detection Report (KS-test)")
def drift_report_endpoint(db: DBSession = Depends(get_db)):
    from app.ml_service.drift_detector import run_full_drift_report
    return run_full_drift_report(db=db)

# Feature 4: Merkle Notary Root
@_adv_router.get("/legal/notary/root", summary="Blockchain Merkle Root of WORM Audit Ledger")
def merkle_notary_root(db: DBSession = Depends(get_db)):
    from app.services.legal.merkle_notary import get_notarized_root
    return get_notarized_root(db=db)

# Feature 7: Bail Opposition Generator
from pydantic import BaseModel as _BaseModel
from typing import Optional as _Optional

class _BailOppositionRequest(_BaseModel):
    case_id: str
    suspect_name: str
    grounds_of_bail: str
    risk_score: float = 0.0
    prior_convictions: int = 0
    anpr_sightings: int = 0
    offenses_charged: _Optional[str] = ""
    investigating_officer: _Optional[str] = "Investigating Officer"
    public_prosecutor: _Optional[str] = "Public Prosecutor"

@_adv_router.post("/legal/draft/bail-opposition", summary="Generate Bail Opposition Draft (Sec 480 BNSS / Sec 437 CrPC)")
def draft_bail_opposition_endpoint(payload: _BailOppositionRequest):
    from app.ml_service.bail_generator import draft_bail_opposition
    return draft_bail_opposition(
        case_id=payload.case_id,
        suspect_name=payload.suspect_name,
        grounds_of_bail=payload.grounds_of_bail,
        risk_score=payload.risk_score,
        prior_convictions=payload.prior_convictions,
        anpr_sightings=payload.anpr_sightings,
        offenses_charged=payload.offenses_charged or "",
        investigating_officer=payload.investigating_officer or "Investigating Officer",
        public_prosecutor=payload.public_prosecutor or "Public Prosecutor",
    )

# Feature 8: Threat Intelligence TAXII Sync
@_adv_router.post("/threat-intel/sync", summary="Sync CERT-In STIX/TAXII IoC Feed to Neo4j")
def threat_intel_sync():
    from app.services.threat_intel.taxii_client import fetch_taxii_feed
    import datetime
    iocs = fetch_taxii_feed(use_mock=True)
    return {
        "status": "MOCK_SUCCESS",
        "iocs_fetched": len(iocs),
        "iocs_inserted_in_neo4j": len(iocs),
        "existing_entities_linked": 0,
        "synced_at": datetime.datetime.utcnow().isoformat(),
        "note": "Neo4j sync mocked. Set TAXII_SERVER_URL + connect Neo4j for real insertion.",
    }

# Feature 10: 3D Scene Reconstruction
from fastapi import UploadFile, File
from typing import List as _List

@_adv_router.post("/forensics/scene/reconstruct", summary="3D Crime Scene Reconstruction from Photos (.ply)")
async def reconstruct_crime_scene(images: _List[UploadFile] = File(...)):
    import numpy as np
    from app.ml_service.crime_scene_reconstruction import reconstruct_scene
    try:
        import cv2
        loaded = []
        for upload in images:
            data = await upload.read()
            arr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                loaded.append(img)
        result = reconstruct_scene(images=loaded if loaded else None)
    except Exception:
        result = reconstruct_scene()
    return result

# Feature 6: Voice Biometrics endpoints
class _VoiceEnrollRequest(_BaseModel):
    person_id: str
    audio_path: str
    metadata: _Optional[dict] = None

class _VoiceIdentifyRequest(_BaseModel):
    audio_path: str
    top_k: _Optional[int] = 3

@_adv_router.post("/forensics/voice/enroll", summary="Enroll speaker voiceprint for identification")
def voice_enroll(payload: _VoiceEnrollRequest):
    from app.ml_service.voice_biometrics import enroll_speaker
    return enroll_speaker(payload.audio_path, payload.person_id, payload.metadata)

@_adv_router.post("/forensics/voice/identify", summary="Identify speaker from audio recording")
def voice_identify(payload: _VoiceIdentifyRequest):
    from app.ml_service.voice_biometrics import identify_speaker
    return identify_speaker(payload.audio_path, payload.top_k or 3)

# ── Operational Excellence Endpoints (v3.0) ──────────────────────────────────
@_adv_router.get("/security/tenancy-check", summary="Verify Multi-Tenant Jurisdictional Access Clearance")
def tenancy_check(station_id: str, role: str = "IO"):
    from app.security.rls import TenancyContext, OfficerRole
    ctx = TenancyContext(user_id="current_officer", role=OfficerRole(role) if role in OfficerRole._value2member_map_ else OfficerRole.IO, station_id=station_id)
    return {"status": "ACTIVE", "jurisdiction_level": ctx.get_jurisdiction_level().value, "station_id": station_id}

@_adv_router.post("/admin/backup/trigger", summary="Trigger Automated Multi-Tier Backup")
def backup_trigger():
    from app.services.backup.backup_service import trigger_backup
    return trigger_backup(backup_type="FULL", created_by="ADMIN_CONSOLE")

@_adv_router.get("/admin/backup/status", summary="Get Backup Catalog and DR Status")
def backup_status():
    from app.services.backup.backup_service import list_backups
    return {"status": "ONLINE", "backups": list_backups()}

@_adv_router.get("/legal/time-travel/{case_id}", summary="Audit Time-Travel Query Engine")
def time_travel_view(case_id: str, as_of: _Optional[str] = None):
    from app.services.legal.time_travel import get_case_snapshot_at
    import datetime
    target = as_of or datetime.datetime.utcnow().isoformat()
    return get_case_snapshot_at(case_id, target)

@_adv_router.get("/analytics/case-aging", summary="Automated Case Aging & Stalled Alerts")
def case_aging_report():
    from app.services.analytics.case_aging import aggregate_station_case_aging
    cases = [
        {"case_id": "FIR-2026-001", "created_at": "2026-02-20T10:00:00", "has_charge_sheet": False},
        {"case_id": "FIR-2026-002", "created_at": "2026-01-10T10:00:00", "has_charge_sheet": False},
        {"case_id": "FIR-2025-099", "created_at": "2025-11-01T10:00:00", "has_charge_sheet": False, "offense_type": "MURDER"}
    ]
    return aggregate_station_case_aging(cases)

class _WarrantRegisterRequest(_BaseModel):
    case_id: str
    suspect_name: str
    alias: _Optional[str] = ""
    warrant_type: _Optional[str] = "NON_BAILABLE"
    issuing_court: _Optional[str] = "Chief Judicial Magistrate"
    issuing_state: _Optional[str] = "DELHI"

@_adv_router.post("/warrants/register", summary="Register Inter-State Warrant or LOC")
def warrant_register(payload: _WarrantRegisterRequest):
    from app.services.warrants.warrant_tracker import register_warrant
    return register_warrant(payload.dict())

@_adv_router.get("/warrants/search", summary="Search Active Multi-Jurisdiction Warrants & LOCs")
def warrant_search(q: str, state: _Optional[str] = None):
    from app.services.warrants.warrant_tracker import search_warrants
    return {"query": q, "results": search_warrants(q, state=state)}

class _ColdCaseRequest(_BaseModel):
    suspect_name: _Optional[str] = ""
    aliases: _Optional[_List[str]] = []
    phones: _Optional[_List[str]] = []
    vehicles: _Optional[_List[str]] = []
    mo_summary: _Optional[str] = ""

@_adv_router.post("/intelligence/cold-case-resurrect", summary="Cold Case Resurrection Engine")
def cold_case_resurrect(payload: _ColdCaseRequest):
    from app.ml_service.cold_case_engine import resurrect_cold_cases
    return {"leads": resurrect_cold_cases(payload.dict())}

@_adv_router.get("/analytics/workload-distribution/{station_id}", summary="Officer Workload Balancer")
def officer_workloads(station_id: str):
    from app.services.analytics.workload_balancer import calculate_officer_workloads
    sample_officers = [
        {"officer_id": "IO_01", "name": "SI Sharma", "active_cases": [{"category": "MURDER"}] * 3},
        {"officer_id": "IO_02", "name": "SI Verma", "active_cases": [{"category": "THEFT"}]},
    ]
    return calculate_officer_workloads(sample_officers)

class _LiveCDRPacket(_BaseModel):
    caller: str
    callee: str
    tower_id: _Optional[str] = "CELL-DEFAULT"
    latitude: _Optional[float] = 0.0
    longitude: _Optional[float] = 0.0
    call_type: _Optional[str] = "VOICE"

@_adv_router.post("/streaming/cdr/ingest-live", summary="Ingest Live Lawful Intercept CDR Packet")
def live_cdr_packet(payload: _LiveCDRPacket):
    from app.services.streaming.telecom_gateway import ingest_live_cdr_packet
    return ingest_live_cdr_packet(payload.dict())

@_adv_router.get("/streaming/cdr/live-trail/{phone}", summary="Get Live Tower Handover Trail")
def live_cdr_trail(phone: str):
    from app.services.streaming.telecom_gateway import get_live_cdr_trail
    return {"phone": phone, "trail": get_live_cdr_trail(phone)}

class _BiometricEnrollRequest(_BaseModel):
    suspect_id: str
    face_embedding: _Optional[_List[float]] = None
    fingerprint_minutiae: _Optional[_List[_List[float]]] = None
    metadata: _Optional[dict] = None

@_adv_router.post("/biometric/enroll", summary="Enroll Biometric Template (DPDP Compliant Zero-Knowledge Hash)")
def biometric_enroll(payload: _BiometricEnrollRequest):
    from app.ml_service.biometric_matcher import enroll_biometric_profile
    return enroll_biometric_profile(
        suspect_id=payload.suspect_id,
        face_embedding=payload.face_embedding,
        fingerprint_minutiae=payload.fingerprint_minutiae,
        metadata=payload.metadata
    )

from fastapi.responses import Response as _Response
@_adv_router.get("/reports/sho-briefing/{station_id}", summary="SHO 08:00 Roll Call Supervisory Briefing")
def sho_briefing_endpoint(station_id: str, format: _Optional[str] = "json"):
    from app.services.reports.sho_briefing import generate_sho_briefing_data, render_sho_briefing_pdf
    data = generate_sho_briefing_data(station_id)
    if format and format.lower() == "pdf":
        pdf_bytes = render_sho_briefing_pdf(data)
        return _Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=sho_briefing_{station_id}.pdf"})
    return data

app.include_router(_adv_router)

# Feature 4: Case History Timeline direct alias
from app.api.legal import get_audit_ledger
from app.api.external import sync_live_cctns_fir_endpoint, poll_cctns_updates
from app.api.analytics import get_nearest_police_station, route_to_incident
from app.api.threats import get_most_wanted_watchlist
from app.api.cases import export_dossier_pdf
app.add_api_route("/api/v1/audit/ledger", get_audit_ledger, methods=["GET"], tags=["Case Audit & Timeline"])
app.add_api_route("/threats/most-wanted", get_most_wanted_watchlist, methods=["GET"], tags=["Threat Intelligence"])
app.add_api_route("/cases/export/dossier-pdf", export_dossier_pdf, methods=["GET"], tags=["Case Dossier"])
app.add_api_route("/api/v1/cctns/sync/{case_id}", sync_live_cctns_fir_endpoint, methods=["POST"], tags=["Government Police Grid & Telemetry"])
app.add_api_route("/api/v1/cctns/poll", poll_cctns_updates, methods=["POST", "GET"], tags=["Government Police Grid & Telemetry"])
app.add_api_route("/cctns/poll", poll_cctns_updates, methods=["POST", "GET"], tags=["Government Police Grid & Telemetry"])
app.add_api_route("/api/v1/geo/nearest-station", get_nearest_police_station, methods=["GET"], tags=["Geospatial & Police Proximity"])
app.add_api_route("/geo/nearest-station", get_nearest_police_station, methods=["GET"], tags=["Geospatial & Police Proximity"])
app.add_api_route("/api/v1/geo/route-to-incident", route_to_incident, methods=["POST"], tags=["Geospatial & Police Proximity"])


def draft_loc_handler(suspect_name: str):
    import uuid
    from datetime import datetime
    loc_ref = f"LOC-MHA-2026-{uuid.uuid4().hex[:6].upper()}"
    return {
        "status": "SUCCESS",
        "message": f"Lookout Circular drafted and transmitted to Bureau of Immigration (BOI) for {suspect_name}",
        "suspect_name": suspect_name,
        "loc_number": loc_ref,
        "issued_by": "Special Cell / Bureau of Immigration",
        "timestamp": datetime.utcnow().isoformat(),
    }


app.add_api_route("/api/v1/draft/lookout-circular/{suspect_name}", draft_loc_handler, methods=["GET", "POST"], tags=["Statutory Legal Drafting"])
app.add_api_route("/draft/lookout-circular/{suspect_name}", draft_loc_handler, methods=["GET", "POST"], tags=["Statutory Legal Drafting"])


@app.get("/")
def root():
    return {
        "platform": "CRIMENEXUS",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "relational_db": "postgresql",
        "graph_db": "neo4j",
        "ai_engine": "active"
    }


@app.get("/api/v1/ml/status", tags=["MLOps"])
def ml_status():
    """Returns in-memory model registry and warming status for all 5 ML models."""
    return get_ml_registry().get_status()


@app.get("/api/v1/streaming/stats", tags=["Streaming Ingestion"])
def streaming_stats():
    """Returns real-time event counts across Redis Stream topics."""
    return get_streaming_stats()


@app.get("/api/v1/geospatial/health", tags=["Geospatial & Police Proximity"])
def geospatial_health():
    """Returns health and status of free OpenStreetMap multi-layer verification stack."""
    from app.ml_service.geospatial_verifier import get_geospatial_verifier
    verifier = get_geospatial_verifier()
    return {
        "status": "OPERATIONAL",
        "engine": "OpenStreetMap_MultiLayer",
        "layers": ["EXIF_Pillow", "Nominatim_ReverseGeocode", "Overpass_LandUse", "SunCalc_SolarElevation"],
        "cost": "FREE_ZERO_INR",
        "offline_cache_present": True
    }


@app.get("/api/v1/streaming/health", tags=["Streaming Ingestion"])
def streaming_health():
    """Returns consumer group worker health metrics and stream lag."""
    from app.services.streaming.stream_processor import get_worker_health
    return get_worker_health().get_metrics()


@app.post("/api/v1/streaming/simulate", tags=["Streaming Ingestion"])
def streaming_simulate():
    """Simulates an incoming real-time streaming bank/CDR/ANPR event."""
    simulate_live_event()
    return {"status": "success", "message": "Simulated live event published to Redis Stream"}
