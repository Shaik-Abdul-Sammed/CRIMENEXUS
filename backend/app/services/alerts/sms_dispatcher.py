"""
SMS / WhatsApp Alert Dispatcher for Beat Constables.
Sends urgent field alerts via Twilio (or MSG91 fallback) for:
 - HIGH priority smurfing alerts
 - WANTED vehicle ANPR sightings
 - Remand deadline < 4 hours

MOCK: When TWILIO_ACCOUNT_SID is not set, falls back to structured
console logging — this allows full testing without Twilio credentials.
Blocked by: Requires DLT registration on TRAI platform for commercial SMS
sending in India (Template registration with operator mandatory).
"""
import os
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
from collections import defaultdict

logger = logging.getLogger("crimenexus.alerts.sms")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+14155238886")  # WhatsApp sandbox default
MSG91_API_KEY = os.getenv("MSG91_API_KEY", "")
MSG91_SENDER_ID = os.getenv("MSG91_SENDER_ID", "CRIMNX")
SMS_RATE_LIMIT_PER_HOUR = int(os.getenv("SMS_RATE_LIMIT_PER_HOUR", "5"))

# In-memory rate limiter: {phone: [(timestamp), ...]}
_rate_tracker: Dict[str, list] = defaultdict(list)


def _is_rate_limited(phone: str) -> bool:
    """Check if a recipient has exceeded the hourly SMS limit."""
    now = time.time()
    cutoff = now - 3600
    # Purge old timestamps
    _rate_tracker[phone] = [t for t in _rate_tracker[phone] if t > cutoff]
    return len(_rate_tracker[phone]) >= SMS_RATE_LIMIT_PER_HOUR


def _record_sent(phone: str):
    """Record a successfully dispatched SMS for rate limiting."""
    _rate_tracker[phone].append(time.time())


def dispatch_alert(
    phone: str,
    message: str,
    priority: str = "MEDIUM",
    channel: str = "sms",
    dry_run: bool = False,
) -> Dict:
    """
    Dispatch an SMS or WhatsApp message to a beat constable/officer.

    Args:
        phone: E.164 format phone number (e.g., +919876543210)
        message: Alert message body (max 160 chars for SMS)
        priority: "HIGH" | "MEDIUM" | "LOW"
        channel: "sms" | "whatsapp"
        dry_run: If True, log only without sending (test mode)

    Returns:
        {"status": "SENT"|"RATE_LIMITED"|"MOCK"|"ERROR", "message_sid": str, ...}
    """
    if _is_rate_limited(phone):
        logger.warning("[SMS DISPATCHER] Rate limit hit for %s. Max %d/hour.", phone, SMS_RATE_LIMIT_PER_HOUR)
        return {
            "status": "RATE_LIMITED",
            "phone": phone,
            "limit": SMS_RATE_LIMIT_PER_HOUR,
            "retry_after_seconds": 3600,
        }

    truncated_message = message[:160]

    if dry_run:
        logger.info("[SMS DISPATCHER DRY RUN] %s → %s [%s]", phone, truncated_message[:50], priority)
        _record_sent(phone)
        return {"status": "DRY_RUN", "phone": phone, "priority": priority}

    # --- Twilio Path ---
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            to_number = f"whatsapp:{phone}" if channel == "whatsapp" else phone
            from_number = f"whatsapp:{TWILIO_FROM_NUMBER}" if channel == "whatsapp" else TWILIO_FROM_NUMBER
            msg = client.messages.create(body=truncated_message, from_=from_number, to=to_number)
            _record_sent(phone)
            logger.info("[SMS DISPATCHER] Twilio %s sent. SID: %s", channel.upper(), msg.sid)
            return {"status": "SENT", "provider": "twilio", "message_sid": msg.sid, "phone": phone}
        except Exception as exc:
            logger.error("[SMS DISPATCHER] Twilio send failed: %s", exc)
            return {"status": "ERROR", "provider": "twilio", "error": str(exc)}

    # --- MSG91 Path (India fallback) ---
    if MSG91_API_KEY:
        try:
            import httpx
            response = httpx.post(
                "https://api.msg91.com/api/v5/flow/",
                json={
                    "flow_id": os.getenv("MSG91_FLOW_ID", ""),
                    "sender": MSG91_SENDER_ID,
                    "mobiles": phone.replace("+", ""),
                    "VAR1": truncated_message,
                },
                headers={"authkey": MSG91_API_KEY, "Content-Type": "application/json"},
                timeout=5.0,
            )
            _record_sent(phone)
            return {"status": "SENT", "provider": "msg91", "response": response.json(), "phone": phone}
        except Exception as exc:
            logger.error("[SMS DISPATCHER] MSG91 send failed: %s", exc)

    # --- MOCK fallback (no credentials configured) ---
    logger.info(
        "[SMS DISPATCHER MOCK] [%s] → %s | MSG: %s",
        priority, phone, truncated_message[:80]
    )
    _record_sent(phone)
    return {
        "status": "MOCK",
        "provider": "console_logger",
        "phone": phone,
        "priority": priority,
        "message": truncated_message,
        "sent_at": datetime.utcnow().isoformat(),
        "note": "Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN to enable real SMS sending",
    }


def dispatch_smurfing_alert(account_id: str, amount: float, officer_phone: str) -> Dict:
    """Convenience wrapper for HIGH-priority smurfing financial crime alerts."""
    message = (
        f"[CRIMENEXUS ALERT] SMURFING DETECTED: Account {account_id} received "
        f"structured deposits near INR {amount:,.0f} threshold. Initiate freeze via CCTNS."
    )
    return dispatch_alert(officer_phone, message, priority="HIGH")


def dispatch_anpr_alert(plate: str, case_id: str, location: str, officer_phone: str) -> Dict:
    """Convenience wrapper for WANTED vehicle ANPR sighting alerts."""
    message = (
        f"[CRIMENEXUS ALERT] WANTED VEHICLE: {plate} sighted at {location}. "
        f"Case: {case_id}. Intercept immediately and inform control room."
    )
    return dispatch_alert(officer_phone, message, priority="HIGH")


def dispatch_remand_deadline_alert(suspect_name: str, hours_remaining: float, officer_phone: str) -> Dict:
    """Convenience wrapper for urgent remand deadline alerts."""
    message = (
        f"[CRIMENEXUS LEGAL ALERT] REMAND EXPIRY IN {hours_remaining:.1f}h: "
        f"Produce {suspect_name} before Magistrate immediately. Article 22(2) CrPC/BNSS compliance required."
    )
    return dispatch_alert(officer_phone, message, priority="HIGH")
