"""
Custody Remand & Default Bail Monitoring Service.
Enforces statutory legal deadlines under Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
and Code of Criminal Procedure (CrPC):
  - 24-Hour Magistrate Production Ceiling (Article 22(2) Constitution / Sec 57 CrPC / Sec 58 BNSS)
  - 60/90-Day Mandatory Charge Sheet Filing Deadline (Sec 167 CrPC / Sec 187 BNSS)
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.database.postgres import SessionLocal
from app.models.custody_tracker import CustodyTracker
from app.models.alert import Alert

logger = logging.getLogger("crimenexus.legal.custody_monitor")


def start_custody_tracking(
    case_id: str,
    suspect_id: str,
    suspect_name: str,
    arrest_timestamp: Optional[datetime] = None,
    days_charge_sheet: int = 60,
    investigating_officer: Optional[str] = "Station IO",
    police_station: Optional[str] = "Central Police Station",
    offenses: Optional[str] = "Section 310 BNS / Section 392 IPC",
    notes: Optional[str] = None,
    db: Optional[Session] = None
) -> CustodyTracker:
    """
    Registers a suspect's formal arrest, setting strict 24-hour magistrate production
    and 60/90-day charge sheet default bail statutory clocks.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        now = arrest_timestamp or datetime.utcnow()
        remand_expiry = now + timedelta(hours=24)
        charge_sheet_deadline = now + timedelta(days=days_charge_sheet)

        record = CustodyTracker(
            case_id=case_id,
            suspect_id=suspect_id,
            suspect_name=suspect_name,
            investigating_officer=investigating_officer,
            police_station=police_station,
            offenses=offenses,
            arrest_timestamp=now,
            remand_expiry_timestamp=remand_expiry,
            charge_sheet_deadline=charge_sheet_deadline,
            status="ACTIVE",
            notes=notes,
            created_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info("[CUSTODY TRACKER] Started tracking arrest for %s (Case: %s). Remand Expiry: %s",
                    suspect_name, case_id, remand_expiry.isoformat())
        return record
    finally:
        if close_db:
            db.close()


def close_custody_tracking(
    custody_id: int,
    notes: Optional[str] = "Produced before court / Bail granted",
    db: Optional[Session] = None
) -> Optional[CustodyTracker]:
    """Closes an active custody tracking record when the suspect is remanded or bailed."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        record = db.query(CustodyTracker).filter(CustodyTracker.id == custody_id).first()
        if not record:
            return None
        record.status = "CLOSED"
        record.closed_at = datetime.utcnow()
        if notes:
            record.notes = (record.notes or "") + f" | Closed: {notes}"
        db.commit()
        db.refresh(record)
        return record
    finally:
        if close_db:
            db.close()


def check_upcoming_deadlines(
    reference_time: Optional[datetime] = None,
    db: Optional[Session] = None
) -> List[Dict[str, Any]]:
    """
    Scans all ACTIVE custody cases and evaluates statutory deadlines.
    - If remand expiry - now < 4 hours -> Generates HIGH priority Magistrate Production alert.
    - If charge sheet deadline - now < 7 days -> Generates MEDIUM priority Default Bail alert.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    alerts_generated = []
    now = reference_time or datetime.utcnow()

    try:
        active_records = db.query(CustodyTracker).filter(CustodyTracker.status == "ACTIVE").all()

        for c in active_records:
            # 1. 24-Hour Magistrate Production Check
            remand_remaining_hours = (c.remand_expiry_timestamp - now).total_seconds() / 3600.0

            if remand_remaining_hours <= 4.0:
                alert_title = f"URGENT MAGISTRATE PRODUCTION: Suspect {c.suspect_name} (Case: {c.case_id})"
                existing_alert = db.query(Alert).filter(
                    Alert.title == alert_title,
                    Alert.alert_type == "REMAND_24H_MAGISTRATE_DEADLINE"
                ).first()

                if not existing_alert:
                    alert = Alert(
                        alert_type="REMAND_24H_MAGISTRATE_DEADLINE",
                        title=alert_title,
                        description=(
                            f"Suspect {c.suspect_name} was arrested on {c.arrest_timestamp.strftime('%Y-%m-%d %H:%M:%S')}. "
                            f"Mandatory 24-hour magistrate production deadline expires at {c.remand_expiry_timestamp.strftime('%Y-%m-%d %H:%M:%S')} "
                            f"({max(0.0, round(remand_remaining_hours, 1))}h remaining). Article 22(2) & Sec 57 CrPC statutory compliance required."
                        ),
                        severity="high",
                        threat_score=0.95,
                        status="new",
                        created_at=now
                    )
                    db.add(alert)
                    alerts_generated.append({
                        "type": "REMAND_MAGISTRATE",
                        "suspect": c.suspect_name,
                        "case_id": c.case_id,
                        "hours_remaining": remand_remaining_hours
                    })

            # 2. Charge Sheet Filing / Default Bail Deadline Check (60/90 days)
            cs_remaining_days = (c.charge_sheet_deadline - now).total_seconds() / 86400.0

            if cs_remaining_days <= 7.0:
                alert_title = f"CHARGE SHEET FILING DEADLINE: Suspect {c.suspect_name} (Case: {c.case_id})"
                existing_alert = db.query(Alert).filter(
                    Alert.title == alert_title,
                    Alert.alert_type == "CHARGE_SHEET_DEFAULT_BAIL_WARNING"
                ).first()

                if not existing_alert:
                    alert = Alert(
                        alert_type="CHARGE_SHEET_DEFAULT_BAIL_WARNING",
                        title=alert_title,
                        description=(
                            f"Accused {c.suspect_name} in judicial custody has charge-sheet filing statutory deadline on "
                            f"{c.charge_sheet_deadline.strftime('%Y-%m-%d')} ({max(0.0, round(cs_remaining_days, 1))} days remaining). "
                            f"Failure to file before Day {60 if (c.charge_sheet_deadline - c.arrest_timestamp).days < 75 else 90} triggers statutory default bail under Sec 167 CrPC / Sec 187 BNSS."
                        ),
                        severity="medium",
                        threat_score=0.85,
                        status="new",
                        created_at=now
                    )
                    db.add(alert)
                    alerts_generated.append({
                        "type": "CHARGE_SHEET_DEADLINE",
                        "suspect": c.suspect_name,
                        "case_id": c.case_id,
                        "days_remaining": cs_remaining_days
                    })

        db.commit()
        return alerts_generated
    finally:
        if close_db:
            db.close()
