import os
import logging
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

    yield

    logger.info("Shutting down CRIMENEXUS backend...")
    close_neo4j_driver()


# Initialize SlowAPI rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

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


@app.get("/")
def root():
    return {
        "platform": "CRIMENEXUS",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "relational_db": "postgresql",
        "graph_db": "neo4j",
        "ai_engine": "active"
    }
