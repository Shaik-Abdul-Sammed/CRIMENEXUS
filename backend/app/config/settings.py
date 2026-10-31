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
DEFAULT_INSECURE_SECRET = "crimenexus_super_secure_jwt_secret_key_change_in_prod_2026"
raw_jwt_secret = os.getenv("JWT_SECRET_KEY")

if not raw_jwt_secret or raw_jwt_secret.strip() == DEFAULT_INSECURE_SECRET:
    # Fail-safe zero-trust check in production
    app_env = os.getenv("APP_ENV", "development").lower()
    if app_env in ["production", "prod", "staging"]:
        raise ValueError(
            "FATAL: JWT_SECRET_KEY is unset or using default insecure development key! "
            "Set a cryptographically strong 256-bit secret key in .env for production deployment."
        )

JWT_SECRET_KEY = raw_jwt_secret if raw_jwt_secret else DEFAULT_INSECURE_SECRET
JWT_REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", f"{JWT_SECRET_KEY}_refresh_salt_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))  # Hardened to 15m
SHIFT_TOKEN_EXPIRE_MINUTES = int(os.getenv("SHIFT_TOKEN_EXPIRE_MINUTES", "720"))  # 12-hour shift terminal token
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
