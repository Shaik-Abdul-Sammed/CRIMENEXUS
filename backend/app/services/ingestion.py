import logging
import uuid
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.database.neo4j import execute_cypher
from app.models.transaction import BankTransaction
from app.models.call_record import CallRecord
from app.models.vehicle_sighting import VehicleSighting
from app.models.report import PoliceReport

logger = logging.getLogger("crimenexus.ingestion")


def ingest_bank_transaction(data: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    Dual-writes a bank transaction to PostgreSQL and Neo4j graph database.
    Creates nodes for Sender, Receiver, Bank Accounts, and financial transaction edges.
    """
    tx_id = data.get("transaction_id") or f"TX-{uuid.uuid4().hex[:8].upper()}"
    timestamp = data.get("timestamp") or datetime.utcnow().isoformat()
    amount = float(data["amount"])
    currency = data.get("currency", "INR")
    sender_name = data["sender_name"]
    sender_account = data["sender_account"]
    receiver_name = data["receiver_name"]
    receiver_account = data["receiver_account"]
    suspicious = bool(data.get("suspicious", amount > 1000000))

    # 1. Persist in PostgreSQL
    pg_record = BankTransaction(
        transaction_id=tx_id,
        sender_name=sender_name,
        sender_account=sender_account,
        receiver_name=receiver_name,
        receiver_account=receiver_account,
        amount=amount,
        currency=currency,
        transaction_type=data.get("transaction_type", "WIRE_TRANSFER"),
        suspicious=suspicious,
        notes=data.get("notes")
    )
    db.add(pg_record)
    db.commit()
    db.refresh(pg_record)

    # 2. Dual-Write to Neo4j Graph
    cypher_query = """
    MERGE (sender:Person {name: $sender_name})
      ON CREATE SET sender.id = randomUUID(), sender.risk_score = 0.5
    MERGE (receiver:Person {name: $receiver_name})
      ON CREATE SET receiver.id = randomUUID(), receiver.risk_score = 0.5

    MERGE (s_acc:BankAccount {account_number: $sender_account})
      ON CREATE SET s_acc.owner = $sender_name
    MERGE (r_acc:BankAccount {account_number: $receiver_account})
      ON CREATE SET r_acc.owner = $receiver_name

    MERGE (sender)-[:OWNS_ACCOUNT]->(s_acc)
    MERGE (receiver)-[:OWNS_ACCOUNT]->(r_acc)

    CREATE (s_acc)-[:TRANSFERRED_MONEY_TO {
        transaction_id: $tx_id,
        amount: $amount,
        currency: $currency,
        timestamp: $timestamp,
        suspicious: $suspicious
    }]->(r_acc)

    CREATE (sender)-[:TRANSFERRED_MONEY_TO {
        transaction_id: $tx_id,
        amount: $amount,
        currency: $currency,
        timestamp: $timestamp,
        suspicious: $suspicious
    }]->(receiver)
    RETURN sender, receiver, s_acc, r_acc
    """

    params = {
        "tx_id": tx_id,
        "sender_name": sender_name,
        "sender_account": sender_account,
        "receiver_name": receiver_name,
        "receiver_account": receiver_account,
        "amount": amount,
        "currency": currency,
        "timestamp": timestamp,
        "suspicious": suspicious
    }

    try:
        execute_cypher(cypher_query, params)
        logger.info("Bank transaction %s ingested to PG and Neo4j graph.", tx_id)
    except Exception as exc:
        logger.error("Neo4j dual-write error for transaction %s: %s", tx_id, exc)

    return {
        "status": "success",
        "transaction_id": tx_id,
        "amount": amount,
        "suspicious": suspicious,
        "postgres_id": pg_record.id
    }


def ingest_call_record(data: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    Dual-writes Call Detail Records (CDR) to PostgreSQL and Neo4j graph database.
    """
    rec_id = data.get("record_id") or f"CDR-{uuid.uuid4().hex[:8].upper()}"
    timestamp = data.get("timestamp") or datetime.utcnow().isoformat()
    duration = int(data.get("duration_seconds", 60))
    caller_number = data["caller_number"]
    receiver_number = data["receiver_number"]
    caller_name = data.get("caller_name", f"Subscriber {caller_number[-4:]}")
    receiver_name = data.get("receiver_name", f"Subscriber {receiver_number[-4:]}")

    # 1. Persist in PostgreSQL
    pg_record = CallRecord(
        record_id=rec_id,
        caller_number=caller_number,
        caller_name=caller_name,
        receiver_number=receiver_number,
        receiver_name=receiver_name,
        duration_seconds=duration,
        tower_id=data.get("tower_id", "CELL-TOWER-01"),
        location_name=data.get("location_name", "Unknown Sector"),
        call_type=data.get("call_type", "VOICE")
    )
    db.add(pg_record)
    db.commit()
    db.refresh(pg_record)

    # 2. Dual-Write to Neo4j Graph
    cypher_query = """
    MERGE (caller:Person {name: $caller_name})
      ON CREATE SET caller.id = randomUUID()
    MERGE (receiver:Person {name: $receiver_name})
      ON CREATE SET receiver.id = randomUUID()

    MERGE (c_ph:Phone {phone_number: $caller_number})
    MERGE (r_ph:Phone {phone_number: $receiver_number})

    MERGE (caller)-[:USES_PHONE]->(c_ph)
    MERGE (receiver)-[:USES_PHONE]->(r_ph)

    CREATE (c_ph)-[:CALLED {
        record_id: $rec_id,
        duration: $duration,
        timestamp: $timestamp
    }]->(r_ph)

    CREATE (caller)-[:CALLED {
        record_id: $rec_id,
        duration: $duration,
        timestamp: $timestamp
    }]->(receiver)
    RETURN caller, receiver
    """

    params = {
        "rec_id": rec_id,
        "caller_name": caller_name,
        "receiver_name": receiver_name,
        "caller_number": caller_number,
        "receiver_number": receiver_number,
        "duration": duration,
        "timestamp": timestamp
    }

    try:
        execute_cypher(cypher_query, params)
        logger.info("CDR %s ingested to PG and Neo4j graph.", rec_id)
    except Exception as exc:
        logger.error("Neo4j dual-write error for CDR %s: %s", rec_id, exc)

    return {
        "status": "success",
        "record_id": rec_id,
        "caller_number": caller_number,
        "receiver_number": receiver_number,
        "postgres_id": pg_record.id
    }


def ingest_vehicle_sighting(data: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    Dual-writes ANPR / CCTV vehicle sightings to PostgreSQL and Neo4j.
    """
    sighting_id = data.get("sighting_id") or f"ANPR-{uuid.uuid4().hex[:8].upper()}"
    timestamp = data.get("timestamp") or datetime.utcnow().isoformat()
    plate = data["plate_number"].strip().upper()
    location_name = data["location_name"]
    owner_name = data.get("owner_name")

    # 1. Persist in PostgreSQL
    pg_record = VehicleSighting(
        sighting_id=sighting_id,
        plate_number=plate,
        vehicle_model=data.get("vehicle_model", "Unknown Model"),
        owner_name=owner_name,
        camera_id=data.get("camera_id", "CAM-ANPR-01"),
        location_name=location_name,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        speed_kmh=data.get("speed_kmh", 50.0),
        confidence=float(data.get("confidence", 0.95)),
        source_type=data.get("source_type", "ANPR")
    )
    db.add(pg_record)
    db.commit()
    db.refresh(pg_record)

    # 2. Dual-Write to Neo4j
    cypher_query = """
    MERGE (v:Vehicle {plate_number: $plate})
      ON CREATE SET v.model = $model
    MERGE (loc:Location {name: $location_name})
    CREATE (v)-[:SIGHTED_AT {
        sighting_id: $sighting_id,
        camera_id: $camera_id,
        timestamp: $timestamp,
        speed: $speed
    }]->(loc)
    """

    params = {
        "sighting_id": sighting_id,
        "plate": plate,
        "model": data.get("vehicle_model", "Unknown"),
        "location_name": location_name,
        "camera_id": data.get("camera_id", "CAM-ANPR-01"),
        "timestamp": timestamp,
        "speed": data.get("speed_kmh", 50.0)
    }

    if owner_name:
        cypher_query += """
        MERGE (owner:Person {name: $owner_name})
        MERGE (owner)-[:OWNS_VEHICLE]->(v)
        """
        params["owner_name"] = owner_name

    try:
        execute_cypher(cypher_query, params)
        logger.info("Vehicle sighting %s ingested to PG and Neo4j.", sighting_id)
    except Exception as exc:
        logger.error("Neo4j dual-write error for vehicle %s: %s", plate, exc)

    return {
        "status": "success",
        "sighting_id": sighting_id,
        "plate_number": plate,
        "postgres_id": pg_record.id
    }


def ingest_police_report(data: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    Dual-writes FIR and Witness statements to PostgreSQL and Neo4j.
    """
    report_num = data.get("report_number") or f"FIR-{uuid.uuid4().hex[:8].upper()}"
    report_type = data.get("report_type", "FIR")
    case_num = data.get("case_number", "CASE-2026-MAIN")
    title = data["title"]
    content = data["content"]
    filed_by = data.get("filed_by", "Officer On Duty")
    witness = data.get("witness_or_complainant")
    suspects = data.get("suspects_mentioned", "")

    # 1. PostgreSQL
    pg_record = PoliceReport(
        report_number=report_num,
        report_type=report_type,
        case_number=case_num,
        title=title,
        content=content,
        filed_by=filed_by,
        witness_or_complainant=witness,
        suspects_mentioned=suspects
    )
    db.add(pg_record)
    db.commit()
    db.refresh(pg_record)

    # 2. Neo4j
    cypher_query = """
    MERGE (c:Case {case_number: $case_num})
      ON CREATE SET c.title = $title
    """
    params = {
        "case_num": case_num,
        "title": title,
    }

    if witness:
        cypher_query += """
        MERGE (w:Person {name: $witness})
        MERGE (w)-[:WITNESSED_IN]->(c)
        """
        params["witness"] = witness

    if suspects:
        suspect_list = [s.strip() for s in suspects.split(",") if s.strip()]
        for idx, s_name in enumerate(suspect_list):
            param_key = f"suspect_{idx}"
            cypher_query += f"""
            MERGE (s_{idx}:Person {{name: ${param_key}}})
            MERGE (s_{idx})-[:SUSPECT_IN]->(c)
            """
            params[param_key] = s_name

    try:
        execute_cypher(cypher_query, params)
        logger.info("Police report %s ingested to PG and Neo4j.", report_num)
    except Exception as exc:
        logger.error("Neo4j dual-write error for report %s: %s", report_num, exc)

    return {
        "status": "success",
        "report_number": report_num,
        "case_number": case_num,
        "postgres_id": pg_record.id
    }
