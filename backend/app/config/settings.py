import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL Database Configuration
user = os.getenv("POSTGRES_USER", "postgres")
password = os.getenv("POSTGRES_PASSWORD", "postgres")
host = os.getenv("POSTGRES_HOST", "localhost")
port = os.getenv("POSTGRES_PORT", "5435")
db = os.getenv("POSTGRES_DB", "crimenexus")

default_db_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
DATABASE_URL = os.getenv("DATABASE_URL", os.getenv("POSTGRES_URL", default_db_url))

# Neo4j Graph Database Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "crimenexus123")

# JWT & Security Configuration
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "crimenexus_super_secure_jwt_secret_key_change_in_prod_2026"
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
