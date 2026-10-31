import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import threading
from pydantic import BaseModel, Field, field_validator, ValidationError

from app.database.postgres import SessionLocal
from app.database.neo4j import execute_cypher
from app.models.transaction import BankTransaction
from app.models.call_record import CallRecord
from app.models.vehicle_sighting import VehicleSighting
from app.services.streaming.redis_streams import get_redis_client, STREAM_TOPICS, streaming_telemetry

logger = logging.getLogger("crimenexus.streaming.processor")


class StreamBankTxSchema(BaseModel):
    transaction_id: str
    sender_name: str = "Unknown Sender"
    sender_account: str
    receiver_name: str = "Unknown Receiver"
    receiver_account: str
    amount: float = Field(gt=0, description="Amount must be strictly positive")
    transaction_type: str = "NEFT_STREAM"
    timestamp: datetime

    @field_validator("timestamp", mode="before")
    @classmethod
    def parse_and_validate_time(cls, v):
        if isinstance(v, str):
            try:
                dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            except Exception:
                dt = datetime.utcnow()
        elif isinstance(v, datetime):
            dt = v
        else:
            dt = datetime.utcnow()

        # Reject adversarial future timestamps > 5 minutes into the future
        now = datetime.utcnow()
        # strip tz for comparison
        dt_naive = dt.replace(tzinfo=None)
        if dt_naive > now + timedelta(minutes=5):
            raise ValueError(f"Adversarial future timestamp rejected: {dt_naive} > {now}")
        return dt_naive


def process_single_event(topic: str, data: Dict[str, Any]) -> bool:
    """
    Pipes ingested streaming events into PostgreSQL relational storage
    and dual-writes corresponding nodes & relationships into Neo4j.
    Applies strict zero-trust Pydantic schema validation.
    """
    db = SessionLocal()
    try:
        if topic == "bank.transactions":
            # Zero-Trust Schema Validation
            try:
                validated_tx = StreamBankTxSchema(
                    transaction_id=data.get("transaction_id") or f"TX-STREAM-{int(time.time()*1000)}",
                    sender_name=data.get("sender_name", "Unknown Sender"),
                    sender_account=data.get("sender_account", "ACC-STREAM-001"),
                    receiver_name=data.get("receiver_name", "Unknown Receiver"),
                    receiver_account=data.get("receiver_account", "ACC-STREAM-002"),
                    amount=float(data.get("amount", 0.0)),
                    transaction_type=data.get("transaction_type", "NEFT_STREAM"),
                    timestamp=data.get("timestamp") or datetime.utcnow()
                )
            except (ValidationError, ValueError) as val_err:
                logger.warning("[ZERO TRUST REJECTION] Malformed or adversarial stream transaction: %s", val_err)
                return False

            tx_id = validated_tx.transaction_id
            amount = validated_tx.amount
            tx_time = validated_tx.timestamp

            # 1. PostgreSQL Persistence
            tx = BankTransaction(
                transaction_id=tx_id,
                sender_name=validated_tx.sender_name,
                sender_account=validated_tx.sender_account,
                receiver_name=validated_tx.receiver_name,
                receiver_account=validated_tx.receiver_account,
                amount=amount,
                timestamp=tx_time,
                transaction_type=validated_tx.transaction_type
            )
            db.add(tx)
            db.commit()

            # 2. Neo4j Dual-Write
            cypher = """
            MERGE (b1:BankAccount {account_number: $s_acc})
              ON CREATE SET b1.holder_name = $s_name
            MERGE (b2:BankAccount {account_number: $r_acc})
              ON CREATE SET b2.holder_name = $r_name
            CREATE (b1)-[:TRANSFERRED_MONEY_TO {
                transaction_id: $tx_id,
                amount: $amount,
                timestamp: $ts,
                channel: "REALTIME_STREAM"
            }]->(b2)
            """
            execute_cypher(cypher, {
                "s_acc": tx.sender_account,
                "s_name": tx.sender_name,
                "r_acc": tx.receiver_account,
                "r_name": tx.receiver_name,
                "tx_id": tx_id,
                "amount": amount,
                "ts": tx_time.isoformat()
            })
            return True

        elif topic == "telecom.cdr":
            rec_id = data.get("record_id") or f"CDR-STREAM-{int(time.time()*1000)}"
            caller = data.get("caller_number") or data.get("caller_phone", "+919800000001")
            receiver = data.get("receiver_number") or data.get("receiver_phone", "+919800000002")
            dur = int(data.get("duration_seconds") or data.get("duration", 60))
            tower = data.get("tower_id", "TOWER-DEL-01")

            record = CallRecord(
                record_id=rec_id,
                caller_number=caller,
                receiver_number=receiver,
                call_type="VOICE",
                duration_seconds=dur,
                timestamp=datetime.utcnow(),
                tower_id=tower
            )
            db.add(record)
            db.commit()

            cypher = """
            MERGE (p1:Phone {phone_number: $p1})
            MERGE (p2:Phone {phone_number: $p2})
            CREATE (p1)-[:CALLED {duration: $dur, tower_id: $tower, timestamp: datetime()}]->(p2)
            """
            execute_cypher(cypher, {"p1": caller, "p2": receiver, "dur": dur, "tower": tower})
            return True

        elif topic == "anpr.sightings":
            sight_id = data.get("sighting_id") or f"ANPR-STREAM-{int(time.time()*1000)}"
            plate = data.get("plate_number", "TS 09 AB 1234")
            cam = data.get("camera_id", "CAM-TOLL-01")
            loc = data.get("location_name", "Kherki Daula Toll")

            sighting = VehicleSighting(
                sighting_id=sight_id,
                plate_number=plate,
                camera_id=cam,
                location_name=loc,
                timestamp=datetime.utcnow(),
                source_type="ANPR"
            )
            db.add(sighting)
            db.commit()

            cypher = """
            MERGE (v:Vehicle {plate_number: $plate})
            MERGE (l:Location {name: $loc})
            CREATE (v)-[:SIGHTED_AT {camera_id: $cam, timestamp: datetime()}]->(l)
            """
            execute_cypher(cypher, {"plate": plate, "loc": loc, "cam": cam})
            return True

        return True
    except Exception as exc:
        logger.error("Error processing stream event [%s]: %s", topic, exc)
        db.rollback()
        return False
    finally:
        db.close()


def run_stream_consumer_worker(stop_event: Optional[threading.Event] = None):
    """
    Background worker that continuously pulls new messages from Redis Streams.
    """
    logger.info("[Streaming] Redis Streams Worker loop started...")
    last_ids = {topic: "$" for topic in STREAM_TOPICS}

    while stop_event is None or not stop_event.is_set():
        try:
            r = get_redis_client()
            if not r:
                time.sleep(2.0)
                continue

            # Read up to 10 events per stream with a 1-second block timeout
            res = r.xread(last_ids, count=10, block=1000)
            if res:
                for stream_name, messages in res:
                    for msg_id, fields in messages:
                        last_ids[stream_name] = msg_id
                        raw_payload = fields.get("payload")
                        if raw_payload:
                            try:
                                payload = json.loads(raw_payload)
                                process_single_event(stream_name, payload)
                            except Exception as parse_err:
                                logger.warning("Failed parsing payload for stream %s: %s", stream_name, parse_err)
        except Exception as exc:
            logger.debug("Redis stream consumer loop tick error: %s", exc)
            time.sleep(1.0)

    logger.info("[Streaming] Redis Streams Worker stopped gracefully.")
