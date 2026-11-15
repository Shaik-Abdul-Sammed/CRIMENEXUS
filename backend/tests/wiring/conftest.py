import os
import sys
import uuid
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure sys.path includes the project root and app directory
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.main import app
from app.database.postgres import SessionLocal
from app.database.neo4j import execute_cypher
from app.models.user import User
from app.models.case import Case
from app.models.person import Person
from app.security.authentication import create_access_token, get_password_hash


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient fixture for invoking live API routes."""
    return TestClient(app)


@pytest.fixture
def db():
    """SQLAlchemy database session fixture with automatic cleanup."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_user(db):
    """Creates a real test officer with SUPERVISOR role and cleans up after test."""
    unique_suffix = uuid.uuid4().hex[:6]
    officer = User(
        username=f"officer_test_{unique_suffix}",
        email=f"officer_{unique_suffix}@police.gov.in",
        hashed_password=get_password_hash("PoliceSecurePass2026!"),
        role="supervisor",
        is_active=True
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)

    yield officer

    # Teardown
    try:
        db.delete(officer)
        db.commit()
    except Exception:
        db.rollback()


@pytest.fixture
def auth_headers(test_user):
    """Generates valid Bearer authentication headers for test_user."""
    token = create_access_token(
        data={"sub": str(test_user.id), "username": test_user.username, "role": test_user.role},
        expires_delta=timedelta(minutes=60)
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_case(db):
    """Creates a distinct test criminal case and cleans up after test."""
    unique_num = f"FIR-TEST-{uuid.uuid4().hex[:6].upper()}"
    case_obj = Case(
        case_number=unique_num,
        title="Operation Cyber Fortress Probe",
        crime_type="ORGANIZED_CYBER_CRIME",
        description="Extortion syndicate routing illicit funds through multiple mule channels.",
        location="Connaught Place, New Delhi",
        status="active",
        risk_level="high",
        created_at=datetime.utcnow()
    )
    db.add(case_obj)
    db.commit()
    db.refresh(case_obj)

    yield case_obj

    # Teardown
    try:
        db.delete(case_obj)
        db.commit()
    except Exception:
        db.rollback()


@pytest.fixture
def test_person_with_graph(db):
    """Creates a test Person in PostgreSQL and a linked node in Neo4j with test_marker."""
    unique_name = f"Suspect Test {uuid.uuid4().hex[:5]}"
    person = Person(
        name=unique_name,
        age=32,
        gender="Male",
        occupation="Courier Broker",
        location="Delhi NCR"
    )
    db.add(person)
    db.commit()
    db.refresh(person)

    # Neo4j Node insertion
    try:
        execute_cypher(
            "MERGE (p:Person {id: $id}) SET p.name = $name, p.status = 'WANTED', p.risk_score = 0.88, p.test_marker = true",
            {"id": f"TEST-P-{person.id}", "name": unique_name}
        )
    except Exception:
        pass

    yield person

    # Teardown
    try:
        db.delete(person)
        db.commit()
    except Exception:
        db.rollback()

    try:
        execute_cypher(
            "MATCH (p:Person {name: $name}) DETACH DELETE p",
            {"name": unique_name}
        )
    except Exception:
        pass


@pytest.fixture(autouse=True)
def cleanup_neo4j():
    """Autouse fixture ensuring test graph nodes tagged with test_marker are cleaned up."""
    yield
    try:
        execute_cypher("MATCH (n) WHERE n.test_marker = true DETACH DELETE n")
    except Exception:
        pass
