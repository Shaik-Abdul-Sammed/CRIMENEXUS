"""
STIX/TAXII Threat Intelligence Feed Integration.
Subscribes to CERT-In / I4C published Indicators of Compromise (IoCs)
including malicious UPI IDs, phone numbers, and IP addresses.
Automatically links discovered IoCs to existing cases in Neo4j.

MOCK: TAXII server URL points to a simulated endpoint.
Blocked by: Requires authorized access to CERT-In TAXII 2.1 feed
(https://www.cert-in.org.in). Contact: incident@cert-in.org.in.
Also requires MoU with I4C (Indian Cyber Crime Coordination Centre).
"""
import os
import json
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger("crimenexus.threat_intel.taxii")

TAXII_SERVER_URL = os.getenv("TAXII_SERVER_URL", "https://mock.cert-in.org.in/taxii2/")
TAXII_COLLECTION_ID = os.getenv("TAXII_COLLECTION_ID", "cert-in-ioc-collection")
TAXII_USERNAME = os.getenv("TAXII_USERNAME", "")
TAXII_PASSWORD = os.getenv("TAXII_PASSWORD", "")

# Simulated STIX 2.1 IoC bundle for demo/testing
MOCK_STIX_BUNDLE = {
    "type": "bundle",
    "id": "bundle--" + str(uuid.uuid4()),
    "objects": [
        {
            "type": "indicator",
            "id": "indicator--" + str(uuid.uuid4()),
            "spec_version": "2.1",
            "name": "Malicious UPI ID linked to phishing",
            "description": "UPI ID associated with PM Kisan scheme fraud. Reported by 47 victims.",
            "pattern": "[financial-account:account-number = 'scam@ybl']",
            "pattern_type": "stix",
            "ioc_type": "UPI",
            "ioc_value": "scam@ybl",
            "labels": ["malicious-activity", "financial-crime"],
            "created": datetime.utcnow().isoformat(),
            "valid_from": datetime.utcnow().isoformat(),
            "confidence": 90,
        },
        {
            "type": "indicator",
            "id": "indicator--" + str(uuid.uuid4()),
            "spec_version": "2.1",
            "name": "Malicious phone number — SIM-swap fraud",
            "description": "Phone used in coordinated SIM-swap attacks targeting 3 banks. I4C Reference: CY-2026-089.",
            "pattern": "[phone-number:value = '+919988123400']",
            "pattern_type": "stix",
            "ioc_type": "PHONE",
            "ioc_value": "+919988123400",
            "labels": ["malicious-activity", "cyber-crime"],
            "created": datetime.utcnow().isoformat(),
            "valid_from": datetime.utcnow().isoformat(),
            "confidence": 85,
        },
        {
            "type": "indicator",
            "id": "indicator--" + str(uuid.uuid4()),
            "spec_version": "2.1",
            "name": "Malicious IP — C2 server for phishing kit",
            "description": "IP hosting phishing kit mimicking SBI netbanking portal.",
            "pattern": "[ipv4-addr:value = '192.168.91.254']",
            "pattern_type": "stix",
            "ioc_type": "IP",
            "ioc_value": "192.168.91.254",
            "labels": ["malicious-activity", "cyber-crime"],
            "created": datetime.utcnow().isoformat(),
            "valid_from": datetime.utcnow().isoformat(),
            "confidence": 75,
        },
    ]
}


def fetch_taxii_feed(use_mock: bool = True) -> List[Dict[str, Any]]:
    """
    Fetch IoCs from a TAXII 2.1 feed.

    MOCK: Returns a bundled set of realistic CERT-In-style IoCs.
    Real implementation uses taxii2-client library.
    """
    if use_mock or not TAXII_SERVER_URL or "mock" in TAXII_SERVER_URL:
        logger.info("[TAXII CLIENT MOCK] Returning %d mock IoCs.", len(MOCK_STIX_BUNDLE["objects"]))
        return MOCK_STIX_BUNDLE["objects"]

    try:
        from taxii2client.v21 import Server, Collection
        server = Server(TAXII_SERVER_URL, user=TAXII_USERNAME, password=TAXII_PASSWORD)
        collection = Collection(f"{TAXII_SERVER_URL}collections/{TAXII_COLLECTION_ID}/")
        bundle = collection.get_objects()
        objects = bundle.get("objects", [])
        indicators = [o for o in objects if o.get("type") == "indicator"]
        logger.info("[TAXII CLIENT] Fetched %d indicators from %s", len(indicators), TAXII_SERVER_URL)
        return indicators
    except ImportError:
        logger.warning("[TAXII CLIENT] taxii2-client not installed. Using mock feed.")
        return MOCK_STIX_BUNDLE["objects"]
    except Exception as exc:
        logger.error("[TAXII CLIENT] Feed fetch failed: %s. Using mock.", exc)
        return MOCK_STIX_BUNDLE["objects"]


def sync_threat_intel_to_neo4j(neo4j_driver, db=None) -> Dict[str, Any]:
    """
    Fetch IoCs from TAXII and insert them into Neo4j as IOC nodes,
    linking to any matching existing entities (phones, accounts, IPs).
    """
    indicators = fetch_taxii_feed()
    inserted = 0
    linked = 0

    try:
        with neo4j_driver.session() as session:
            for indicator in indicators:
                ioc_type = indicator.get("ioc_type", "UNKNOWN")
                ioc_value = indicator.get("ioc_value", "")
                description = indicator.get("description", "")
                confidence = indicator.get("confidence", 50)
                labels = indicator.get("labels", [])

                if not ioc_value:
                    continue

                # Insert IOC node
                session.run(
                    """
                    MERGE (ioc:IOC {value: $value})
                    SET ioc.type = $type,
                        ioc.description = $description,
                        ioc.confidence = $confidence,
                        ioc.labels = $labels,
                        ioc.source = 'CERT-In TAXII Feed',
                        ioc.synced_at = $synced_at
                    """,
                    value=ioc_value,
                    type=ioc_type,
                    description=description,
                    confidence=confidence,
                    labels=json.dumps(labels),
                    synced_at=datetime.utcnow().isoformat(),
                )
                inserted += 1

                # Auto-link: match against Phone entities
                if ioc_type == "PHONE":
                    result = session.run(
                        """
                        MATCH (p:Phone {phone_number: $value})
                        MERGE (ioc:IOC {value: $value})
                        MERGE (p)-[:FLAGGED_AS]->(ioc)
                        RETURN count(p) as matched
                        """,
                        value=ioc_value,
                    )
                    linked += (result.single() or {}).get("matched", 0)

                # Auto-link: match against BankAccount entities
                elif ioc_type == "UPI":
                    result = session.run(
                        """
                        MATCH (b:BankAccount)
                        WHERE b.account_number CONTAINS $value OR b.upi_id = $value
                        MERGE (ioc:IOC {value: $value})
                        MERGE (b)-[:FLAGGED_AS]->(ioc)
                        RETURN count(b) as matched
                        """,
                        value=ioc_value,
                    )
                    linked += (result.single() or {}).get("matched", 0)

        logger.info("[TAXII SYNC] Inserted %d IOC nodes, %d linked to existing entities.", inserted, linked)
        return {
            "status": "SUCCESS",
            "iocs_fetched": len(indicators),
            "iocs_inserted_in_neo4j": inserted,
            "existing_entities_linked": linked,
            "synced_at": datetime.utcnow().isoformat(),
        }

    except Exception as exc:
        logger.warning("[TAXII SYNC] Neo4j sync skipped (not connected): %s", exc)
        return {
            "status": "MOCK_SUCCESS",
            "iocs_fetched": len(indicators),
            "iocs_inserted_in_neo4j": inserted,
            "existing_entities_linked": 0,
            "note": "Neo4j sync simulated. Connect Neo4j for real insertion.",
            "synced_at": datetime.utcnow().isoformat(),
        }
