import logging
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config.settings import DATABASE_URL

logger = logging.getLogger("crimenexus.database.postgres")

Base = declarative_base()


def _get_engine():
    """
    Initializes PostgreSQL engine if available.
    If PostgreSQL is unreachable (e.g. offline during local tests without Docker),
    gracefully falls back to a local SQLite database so test suites and standalone
    invocations never crash with connection refused errors.
    """
    try:
        eng = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3} if "postgresql" in DATABASE_URL else {}
        )
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL at %s", DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL)
        return eng
    except Exception as exc:
        logger.warning(
            "Primary PostgreSQL is unavailable (%s). Falling back to SQLite for resilient testing/offline execution.",
            exc
        )
        sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../test_fallback.db"))
        sqlite_url = f"sqlite:///{sqlite_path}"
        eng = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        return eng


engine = _get_engine()

# If using SQLite fallback, ensure all database tables are created automatically
if "sqlite" in str(engine.url):
    try:
        import app.models.user
        import app.models.case
        import app.models.alert
        import app.models.custody_tracker
        import app.models.transaction
        import app.models.public_report
        import app.models.vehicle_sighting
        import app.models.call_record
        import app.models.audit_ledger
        import app.models.agency
        import app.models.location
        import app.models.person
        import app.models.relationship
        import app.models.guardian_trace
        import app.models.fir_archive_models
        Base.metadata.create_all(bind=engine)
    except Exception as table_exc:
        logger.warning("Could not auto-create SQLite fallback tables: %s", table_exc)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

