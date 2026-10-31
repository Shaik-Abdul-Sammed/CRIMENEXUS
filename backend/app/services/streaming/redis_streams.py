import os
import json
import logging
import time
from typing import Dict, Any, Optional
import redis

logger = logging.getLogger("crimenexus.streaming.redis")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
STREAM_TOPICS = [
    "bank.transactions",
    "telecom.cdr",
    "anpr.sightings",
    "fir.uploads"
]

# In-memory streaming telemetry counter
streaming_telemetry: Dict[str, Any] = {
    "status": "RUNNING",
    "connected": False,
    "total_events": 0,
    "topics": {
        "bank.transactions": 0,
        "telecom.cdr": 0,
        "anpr.sightings": 0,
        "fir.uploads": 0
    },
    "last_event_time": None
}

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2.0)
        r.ping()
        _redis_client = r
        streaming_telemetry["connected"] = True
        logger.info("Connected to Redis Streaming Engine at %s", REDIS_URL)
        return _redis_client
    except Exception as exc:
        logger.warning("Redis stream connection failed (%s). Operating in-memory mode.", exc)
        return None


def publish_stream_event(topic: str, payload: Dict[str, Any]) -> str:
    """Publishes a structured event message to a Redis Stream topic."""
    r = get_redis_client()
    encoded_data = {
        "payload": json.dumps(payload),
        "timestamp": str(time.time()),
        "topic": topic
    }
    
    # Update telemetry
    streaming_telemetry["total_events"] += 1
    streaming_telemetry["topics"][topic] = streaming_telemetry["topics"].get(topic, 0) + 1
    streaming_telemetry["last_event_time"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    if r:
        try:
            msg_id = r.xadd(topic, encoded_data)
            return str(msg_id)
        except Exception as exc:
            logger.error("Failed publishing to Redis Stream topic %s: %s", topic, exc)
    
    return f"inmem-{time.time()}"


def get_streaming_stats() -> Dict[str, Any]:
    """Returns real-time streaming pipeline stats for the frontend monitor."""
    r = get_redis_client()
    streaming_telemetry["connected"] = r is not None
    return streaming_telemetry
