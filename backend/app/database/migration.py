import logging
from sqlalchemy import inspect, text
from app.database.postgres import engine, Base

# Import all SQLAlchemy models to register them on Base.metadata
import app.models.user
import app.models.agency
import app.models.case
import app.models.person
import app.models.location
import app.models.relationship
import app.models.alert
import app.models.transaction
import app.models.call_record
import app.models.vehicle_sighting
import app.models.report
import app.models.audit_ledger
import app.models.custody_tracker
import app.models.public_report
import app.models.guardian_trace
import app.models.fir_archive_models
import app.models.officer_disciplinary
import app.models.unused_material
import app.models.smart_meter_reading

logger = logging.getLogger("crimenexus.database.migration")


def auto_migrate_db_schema(target_engine=None, target_metadata=None):
    """
    Idempotent schema synchronizer:
    1. Creates all missing tables defined in SQLAlchemy metadata.
    2. Inspects existing tables in PostgreSQL / SQLite and adds any missing columns.
    Ensures zero crashes when models evolve without requiring manual database wipes.
    """
    active_engine = target_engine or engine
    metadata = target_metadata or Base.metadata

    try:
        # Step 1: Create any missing tables
        metadata.create_all(bind=active_engine)
        logger.info("[Auto-Migration] Verified base tables exist.")

        # Step 2: Inspect existing tables and sync missing columns
        inspector = inspect(active_engine)
        existing_tables = set(inspector.get_table_names())
        dialect_name = active_engine.dialect.name.lower()
        is_postgres = "postgres" in dialect_name

        with active_engine.begin() as conn:
            for table_name, table in metadata.tables.items():
                if table_name not in existing_tables:
                    continue

                # Query existing columns for this table
                try:
                    columns_info = inspector.get_columns(table_name)
                    existing_cols = {col["name"].lower() for col in columns_info}
                except Exception as col_inspect_err:
                    logger.warning("[Auto-Migration] Could not inspect columns for %s: %s", table_name, col_inspect_err)
                    continue

                for col in table.columns:
                    col_name_lower = col.name.lower()
                    if col_name_lower not in existing_cols:
                        try:
                            # Compile SQL type for target database dialect
                            col_type = col.type.compile(dialect=active_engine.dialect)
                            
                            # Construct ALTER TABLE statement (always nullable for existing rows)
                            if is_postgres:
                                stmt = f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col.name}" {col_type};'
                            else:
                                stmt = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type};'

                            logger.info("[Auto-Migration] Adding missing column: %s", stmt)
                            conn.execute(text(stmt))
                            existing_cols.add(col_name_lower)
                        except Exception as add_err:
                            # Avoid fatal crash if column already exists under race conditions
                            logger.warning(
                                "[Auto-Migration] Warning adding column '%s' to '%s': %s",
                                col.name, table_name, add_err
                            )

        logger.info("[Auto-Migration] Schema synchronization successfully completed.")
        return True
    except Exception as exc:
        logger.error("[Auto-Migration] Database schema auto-migration error: %s", exc)
        return False
