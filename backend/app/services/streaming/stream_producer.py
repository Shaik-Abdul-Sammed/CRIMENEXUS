import time
import random
import logging

from app.services.streaming.redis_streams import publish_stream_event

logger = logging.getLogger("crimenexus.streaming.producer")


def emit_bank_transaction(
    sender_name: str = "Suresh Mules",
    sender_account: str = "ACC-MULE-8801",
    receiver_name: str = "Rajan Hawala Account",
    receiver_account: str = "ACC-RAJAN-0099",
    amount: float = 49500.0,
    tx_type: str = "RTGS"
) -> str:
    tx_id = f"TX-LIVE-{int(time.time()*1000)}"
    payload = {
        "transaction_id": tx_id,
        "sender_name": sender_name,
        "sender_account": sender_account,
        "receiver_name": receiver_name,
        "receiver_account": receiver_account,
        "amount": amount,
        "transaction_type": tx_type,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    return publish_stream_event("bank.transactions", payload)


def emit_telecom_cdr(
    caller_phone: str = "+919876543210",
    receiver_phone: str = "+919999988888",
    duration: int = 124,
    tower_id: str = "TOWER-DEL-KAROLBAGH-04"
) -> str:
    payload = {
        "caller_phone": caller_phone,
        "receiver_phone": receiver_phone,
        "duration": duration,
        "tower_id": tower_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    return publish_stream_event("telecom.cdr", payload)


def emit_anpr_sighting(
    plate_number: str = "TS 09 AB 1234",
    camera_id: str = "CAM-KHERKI-DAULA-02",
    location_name: str = "NH-48 Kherki Daula Toll Plaza"
) -> str:
    payload = {
        "plate_number": plate_number,
        "camera_id": camera_id,
        "location_name": location_name,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    return publish_stream_event("anpr.sightings", payload)


def simulate_live_event():
    """Generates a random realistic law-enforcement event."""
    choice = random.choice(["bank", "cdr", "anpr"])
    if choice == "bank":
        emit_bank_transaction(amount=random.choice([47000.0, 48500.0, 49200.0, 150000.0]))
    elif choice == "cdr":
        emit_telecom_cdr(duration=random.randint(20, 360))
    else:
        emit_anpr_sighting()
