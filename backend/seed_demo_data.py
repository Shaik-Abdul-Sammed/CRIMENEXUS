import os
import sys
import logging

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database.neo4j import get_neo4j_driver, init_neo4j_constraints, execute_cypher
from app.database.postgres import SessionLocal, engine, Base
from app.models.case import Case
from app.models.person import Person as PGPerson
from app.models.vehicle_sighting import VehicleSighting as PGVehicleSighting
from app.models.call_record import CallRecord as PGCallRecord
from app.models.transaction import BankTransaction as PGBankTransaction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crimenexus.seed")


def seed_neo4j_and_postgres():
    print("=" * 65)
    print("CRIMENEXUS DEMO DATA SEEDING (NEO4J GRAPH + POSTGRESQL)")
    print("=" * 65)

    # 1. Initialize constraints in Neo4j
    print("\n[STEP 1] Initializing Neo4j Schema Constraints...")
    init_neo4j_constraints()

    # 2. Cypher query to seed graph entities and connections
    print("\n[STEP 2] Inserting Graph Nodes and Relationships into Neo4j...")
    seed_cypher = """
    // 1. Create Main Suspect and Associates
    MERGE (rajan:Person {name: "Rajan"})
      ON CREATE SET
        rajan.id = "SUSPECT-RAJAN-01",
        rajan.role = "Syndicate Ringleader",
        rajan.alias = "Bhai",
        rajan.risk_score = 0.95,
        rajan.status = "WANTED",
        rajan.threat_level = "CRITICAL"

    MERGE (vikram:Person {name: "Vikram"})
      ON CREATE SET
        vikram.id = "ASSOC-VIKRAM-02",
        vikram.role = "Logistics Coordinator",
        vikram.risk_score = 0.84,
        vikram.status = "ACTIVE"

    MERGE (suresh:Person {name: "Suresh"})
      ON CREATE SET
        suresh.id = "ASSOC-SURESH-03",
        suresh.role = "Hawala Cash Courier",
        suresh.risk_score = 0.79,
        suresh.status = "ACTIVE"

    // 2. Create Phone Node
    MERGE (phone:Phone {phone_number: "+91 98765 43210"})
      ON CREATE SET
        phone.imei = "358912093847291",
        phone.carrier = "Airtel",
        phone.risk_score = 0.88,
        phone.flagged = true

    // 3. Create Bank Account Node
    MERGE (bank:BankAccount {account_number: "ACC-HDFC-908122"})
      ON CREATE SET
        bank.bank_name = "HDFC Bank",
        bank.branch = "Noida Sector 62",
        bank.owner = "Apex Trading Co. (Shell Entity)",
        bank.flagged = true,
        bank.risk_score = 0.92

    // 4. Create Vehicle Node
    MERGE (vehicle:Vehicle {plate_number: "TS 09 AB 1234"})
      ON CREATE SET
        vehicle.make_model = "Toyota Fortuner 4x4",
        vehicle.color = "Black",
        vehicle.chassis = "MBJ11F498A1920394",
        vehicle.flagged = true,
        vehicle.risk_score = 0.89

    // 5. Create CCTV Location Node
    MERGE (cctv:Location {name: "Yamuna Expressway Toll KM 48"})
      ON CREATE SET
        cctv.camera_id = "ANPR-UP-YAMUNA-KM48",
        cctv.latitude = 28.1402,
        cctv.longitude = 77.5510,
        cctv.type = "TOLL_PLAZA_ANPR"

    // 6. Connect Relationships (Infographic Vision)
    MERGE (rajan)-[:USES_PHONE {since: "2025-06-01", frequency: 142}]->(phone)
    MERGE (rajan)-[:DRIVES {ownership: "Primary Operator", last_seen: "2026-03-14"}]->(vehicle)
    MERGE (rajan)-[:HAS_ACCOUNT {role: "Beneficial Controller", flagged: true}]->(bank)

    MERGE (vikram)-[:ASSOCIATED_WITH {relationship: "Logistics Lieutenant", comms_frequency: "High"}]->(rajan)
    MERGE (suresh)-[:ASSOCIATED_WITH {relationship: "Hawala Handler", comms_frequency: "Daily"}]->(rajan)

    MERGE (vehicle)-[:SIGHTED_AT {
        timestamp: "2026-03-14T10:45:00Z",
        lane: "Lane 03 Outbound",
        speed_kmh: 88,
        anpr_alert: "CRITICAL_HOTLIST_MATCH"
    }]->(cctv)

    // Additional cross-links for rich graph density
    MERGE (suresh)-[:TRANSFERRED_MONEY_TO {amount: 49500, mode: "UPI", date: "2026-03-14", suspicious: true}]->(bank)
    MERGE (vikram)-[:CALLED {duration: 320, timestamp: "2026-03-14T11:00:00Z"}]->(phone)

    RETURN count(*) as created
    """

    execute_cypher(seed_cypher)
    print(" -> Neo4j crime network nodes and relationships seeded.")

    # 3. Synchronize relational records in PostgreSQL
    print("\n[STEP 3] Synchronizing PostgreSQL Relational Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Case if not exists
        case = db.query(Case).filter(Case.case_number == "CASE-2026-NCR-001").first()
        if not case:
            case = Case(
                case_number="CASE-2026-NCR-001",
                title="Operation Nexus: Hawala & Extortion Syndicate",
                crime_type="Organized Extortion & Money Laundering",
                description="Cross-state organized financial crime network involving illicit money transfers, fake shell accounts, and logistics.",
                location="Delhi-NCR / Noida Sector 62",
                status="active",
                risk_level="critical"
            )
            db.add(case)
            db.commit()
            print(" -> Created Investigation Case: CASE-2026-NCR-001")

        # Seed Suspect Person
        suspect = db.query(PGPerson).filter(PGPerson.name == "Rajan").first()
        if not suspect:
            suspect = PGPerson(
                name="Rajan",
                age=42,
                gender="Male",
                occupation="Transport Operator / Hawala Controller",
                location="Noida Sector 62"
            )
            db.add(suspect)
            db.commit()
            print(" -> Created Suspect Person in PostgreSQL: Rajan")

        # Seed Bank Transaction
        tx = db.query(PGBankTransaction).filter(PGBankTransaction.transaction_id == "TX-DEMO-RAJAN-01").first()
        if not tx:
            tx = PGBankTransaction(
                transaction_id="TX-DEMO-RAJAN-01",
                sender_name="Suresh",
                sender_account="ACC-SURESH-03",
                receiver_name="Apex Trading Co. (Rajan)",
                receiver_account="ACC-HDFC-908122",
                amount=49500.0,
                currency="INR",
                transaction_type="UPI",
                suspicious=True,
                notes="Structuring under ₹50,000 threshold to evade AML monitoring"
            )
            db.add(tx)
            db.commit()
            print(" -> Created Flagged Bank Transaction in PostgreSQL: ₹49,500")

        # Seed Vehicle Sighting
        vs = db.query(PGVehicleSighting).filter(PGVehicleSighting.plate_number == "TS 09 AB 1234").first()
        if not vs:
            vs = PGVehicleSighting(
                sighting_id="VS-DEMO-RAJAN-01",
                plate_number="TS 09 AB 1234",
                vehicle_model="Toyota Fortuner 4x4",
                owner_name="Rajan",
                location_name="Yamuna Expressway Toll KM 48",
                latitude=28.1402,
                longitude=77.5510,
                camera_id="ANPR-UP-YAMUNA-KM48",
                speed_kmh=88.0,
                confidence=0.98,
                source_type="ANPR"
            )
            db.add(vs)
            db.commit()
            print(" -> Created Vehicle Sighting in PostgreSQL: TS 09 AB 1234")

    finally:
        db.close()

    # 4. Verify in Neo4j
    print("\n[STEP 4] Verifying Neo4j Graph Counts...")
    count_nodes = execute_cypher("MATCH (n) RETURN count(n) as node_count")[0]["node_count"]
    count_edges = execute_cypher("MATCH ()-[r]->() RETURN count(r) as edge_count")[0]["edge_count"]
    sample_nodes = execute_cypher("MATCH (n) RETURN labels(n)[0] as label, coalesce(n.name, n.plate_number, n.account_number, n.phone_number) as identifier")

    print(f" -> Total Graph Nodes: {count_nodes}")
    print(f" -> Total Graph Edges: {count_edges}")
    print("\n[SAMPLE NODES CREATED]:")
    for sn in sample_nodes:
        print(f"   [{sn['label']}] {sn['identifier']}")

    print("\n" + "=" * 65)
    print("DEMO GRAPH SEEDING COMPLETED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    seed_neo4j_and_postgres()
