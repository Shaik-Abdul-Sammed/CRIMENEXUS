import logging
from typing import Generator, Optional
from neo4j import GraphDatabase, Driver, Session
from app.config.settings import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

logger = logging.getLogger("crimenexus.neo4j")

_driver: Optional[Driver] = None


def get_neo4j_driver() -> Optional[Driver]:
    """Returns or initializes the global Neo4j driver singleton."""
    global _driver
    if _driver is None:
        try:
            _driver = GraphDatabase.driver(
                NEO4J_URI,
                auth=(NEO4J_USER, NEO4J_PASSWORD),
                max_connection_lifetime=3600,
                max_connection_pool_size=50,
                connection_acquisition_timeout=30.0,
            )
            # Verify connectivity
            _driver.verify_connectivity()
            logger.info("Connected to Neo4j at %s", NEO4J_URI)
        except Exception as exc:
            logger.warning("Could not connect to Neo4j (%s): %s", NEO4J_URI, exc)
            _driver = None
    return _driver


def close_neo4j_driver() -> None:
    """Closes the active Neo4j driver connection."""
    global _driver
    if _driver is not None:
        _driver.close()
        logger.info("Neo4j driver connection closed.")
        _driver = None


def get_neo4j_session() -> Generator[Optional[Session], None, None]:
    """FastAPI dependency yielding a Neo4j session."""
    driver = get_neo4j_driver()
    if driver is None:
        yield None
        return

    session = driver.session()
    try:
        yield session
    finally:
        session.close()


def execute_cypher(query: str, parameters: Optional[dict] = None) -> list:
    """Helper function to execute a Cypher query with automatic session handling."""
    driver = get_neo4j_driver()
    if driver is None:
        logger.warning("Skipping Cypher execution: Neo4j driver is not connected.")
        return []

    with driver.session() as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]


def init_neo4j_constraints() -> None:
    """
    Applies graph schema constraints to guarantee entity uniqueness and fast index lookups.
    Safe to execute multiple times (IF NOT EXISTS).
    """
    driver = get_neo4j_driver()
    if driver is None:
        logger.warning("Skipping Neo4j schema constraint initialization: driver unavailable.")
        return

    constraints = [
        "CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
        "CREATE CONSTRAINT person_name_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE",
        "CREATE CONSTRAINT vehicle_plate_unique IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.plate_number IS UNIQUE",
        "CREATE CONSTRAINT bank_account_unique IF NOT EXISTS FOR (b:BankAccount) REQUIRE b.account_number IS UNIQUE",
        "CREATE CONSTRAINT phone_number_unique IF NOT EXISTS FOR (ph:Phone) REQUIRE ph.phone_number IS UNIQUE",
        "CREATE CONSTRAINT case_number_unique IF NOT EXISTS FOR (c:Case) REQUIRE c.case_number IS UNIQUE",
        "CREATE CONSTRAINT location_name_unique IF NOT EXISTS FOR (l:Location) REQUIRE l.name IS UNIQUE",
    ]

    with driver.session() as session:
        for constraint_cypher in constraints:
            try:
                session.run(constraint_cypher)
                logger.info("Applied Neo4j constraint: %s", constraint_cypher)
            except Exception as exc:
                logger.error("Failed to apply constraint '%s': %s", constraint_cypher, exc)
