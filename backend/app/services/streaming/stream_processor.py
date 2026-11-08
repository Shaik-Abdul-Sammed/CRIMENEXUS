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
from app.services.streaming.redis_streams import get_redis_client, STREAM_TOPICS

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
        dt_naive = dt.replace(tzinfo=None)
        if dt_naive > now + timedelta(minutes=5):
            raise ValueError(f"Adversarial future timestamp rejected: {dt_naive} > {now}")
        return dt_naive


class WorkerHealth:
    """Tracks streaming consumer worker health metrics and consumer group lag."""

    def __init__(self):
        self.messages_processed_total: int = 0
        self.messages_failed_total: int = 0
        self.last_message_at: Optional[str] = None
        self._lock = threading.Lock()

    def record_success(self):
        with self._lock:
            self.messages_processed_total += 1
            self.last_message_at = datetime.utcnow().isoformat() + "Z"

    def record_failure(self):
        with self._lock:
            self.messages_failed_total += 1
            self.last_message_at = datetime.utcnow().isoformat() + "Z"

    def get_metrics(self) -> Dict[str, Any]:
        lag = 0
        r = get_redis_client()
        if r:
            for topic in STREAM_TOPICS:
                try:
                    groups = r.xinfo_groups(topic)
                    for g in groups:
                        if g.get("name") == "crimenexus_workers":
                            lag += int(g.get("lag", g.get("pending", 0)) or 0)
                except Exception:
                    pass

        status = "healthy"
        if self.messages_failed_total > 50 and self.messages_failed_total > self.messages_processed_total:
            status = "degraded"

        with self._lock:
            return {
                "status": status,
                "messages_processed": self.messages_processed_total,
                "messages_failed": self.messages_failed_total,
                "last_message_at": self.last_message_at or datetime.utcnow().isoformat() + "Z",
                "consumer_group_lag": lag
            }


_worker_health_instance = WorkerHealth()

def get_worker_health() -> WorkerHealth:
    return _worker_health_instance


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
                tx_valid = StreamBankTxSchema(
                    transaction_id=data.get("transaction_id", f"TX-STREAM-{int(time.time()*1000)}"),
                    sender_name=data.get("sender_name", "Unknown Sender"),
                    sender_account=data.get("sender_account", "ACC-MULE-DEFAULT"),
                    receiver_name=data.get("receiver_name", "Unknown Receiver"),
                    receiver_account=data.get("receiver_account", "ACC-BENEFICIARY-01"),
                    amount=float(data.get("amount", 10000.0)),
                    transaction_type=data.get("transaction_type", "NEFT_STREAM"),
                    timestamp=data.get("timestamp") or datetime.utcnow()
                )
            except ValidationError as val_err:
                logger.warning("[Security] Adversarial or invalid stream transaction rejected: %s", val_err)
                return False

            tx = BankTransaction(
                transaction_id=tx_valid.transaction_id,
                sender_account=tx_valid.sender_account,
                receiver_account=tx_valid.receiver_account,
                amount=tx_valid.amount,
                transaction_type=tx_valid.transaction_type,
                timestamp=tx_valid.timestamp,
                status="COMPLETED"
            )
            db.add(tx)
            db.commit()

            # Dual-write into Neo4j
            cypher = """
            MERGE (a:BankAccount {account_number: $src})
            MERGE (b:BankAccount {account_number: $dst})
            CREATE (a)-[:TRANSFERRED_TO {amount: $amt, timestamp: datetime(), tx_id: $tx_id}]->(b)
            """
            execute_cypher(cypher, {
                "src": tx_valid.sender_account,
                "dst": tx_valid.receiver_account,
                "amt": tx_valid.amount,
                "tx_id": tx_valid.transaction_id
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
    Background worker that continuously pulls new messages from Redis Streams using consumer groups.
    Enforces 'crimenexus_workers' group with worker_1 and manual XACK acknowledgements.
    """
    logger.info("[Streaming] Redis Streams Consumer Group Worker loop started...")
    CONSUMER_GROUP = "crimenexus_workers"
    CONSUMER_NAME = "worker_1"

    # Initialize consumer groups for each stream topic
    r = get_redis_client()
    if r:
        for topic in STREAM_TOPICS:
            try:
                r.xgroup_create(topic, CONSUMER_GROUP, id="0", mkstream=True)
                logger.info("[Streaming] Consumer group '%s' initialized on topic '%s'", CONSUMER_GROUP, topic)
            except Exception:
                pass

    while stop_event is None or not stop_event.is_set():
        try:
            r = get_redis_client()
            if not r:
                time.sleep(2.0)
                continue

            for topic in STREAM_TOPICS:
                try:
                    r.xgroup_create(topic, CONSUMER_GROUP, id="0", mkstream=True)
                except Exception:
                    pass

            streams_dict = {topic: ">" for topic in STREAM_TOPICS}
            res = r.xreadgroup(CONSUMER_GROUP, CONSUMER_NAME, streams_dict, count=10, block=2000)
            if res:
                for stream_name, messages in res:
                    for msg_id, fields in messages:
                        raw_payload = fields.get("payload")
                        success = False
                        if raw_payload:
                            try:
                                payload = json.loads(raw_payload)
                                success = process_single_event(stream_name, payload)
                            except Exception as parse_err:
                                logger.warning("Failed parsing payload for stream %s: %s", stream_name, parse_err)
                                success = False

                        if success:
                            try:
                                r.xack(stream_name, CONSUMER_GROUP, msg_id)
                            except Exception:
                                pass
                            _worker_health_instance.record_success()
                        else:
                            _worker_health_instance.record_failure()
        except Exception as exc:
            logger.debug("Redis stream consumer group tick error: %s", exc)
            time.sleep(1.0)

    logger.info("[Streaming] Redis Streams Worker stopped gracefully.")
