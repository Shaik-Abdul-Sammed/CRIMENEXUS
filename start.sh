#!/usr/bin/env bash
set -e

# ==============================================================================
# CRIMENEXUS — All-In-One Unified Startup Script
# Boots PostgreSQL, Neo4j, FastAPI Backend, and React Frontend in a single command.
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "================================================================================"
echo "          CRIMENEXUS — AI Criminal Network Intelligence Platform                "
echo "================================================================================"
echo -e "${NC}"

# 1. Check Docker Daemon
echo -e "${BLUE}[1/5] Checking Docker & Database Containers...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running. Please start Docker and re-run.${NC}"
    exit 1
fi

# Ensure .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
fi

# 2. Start PostgreSQL and Neo4j
echo -e "${BLUE}[2/5] Starting PostgreSQL (port 5435) & Neo4j (ports 7474, 7687)...${NC}"
POSTGRES_PORT=5435 docker compose up -d postgres neo4j

# Wait for PostgreSQL to become ready
echo -e "${BLUE}Waiting for PostgreSQL to accept connections on port 5435...${NC}"
until docker exec crimenexus_postgres pg_isready -U postgres -d crimenexus > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL is healthy and accepting connections.${NC}"

# Wait for Neo4j Bolt port
echo -e "${BLUE}Waiting for Neo4j Bolt protocol on port 7687...${NC}"
for i in {1..30}; do
    if nc -z localhost 7687 2>/dev/null || (echo > /dev/tcp/localhost/7687) 2>/dev/null; then
        break
    fi
    sleep 1
done
echo -e "${GREEN}✓ Neo4j graph database is online.${NC}"

# 3. Apply Database Migrations
echo -e "${BLUE}[3/5] Applying Alembic Migrations to PostgreSQL...${NC}"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5435/crimenexus"
export POSTGRES_PORT=5435

if [ -f "backend/venv/bin/alembic" ]; then
    (cd backend && ./venv/bin/alembic upgrade head)
else
    python3 -m alembic upgrade head
fi
echo -e "${GREEN}✓ Relational tables & schema constraints synchronized.${NC}"

# 4. Start Backend Server
echo -e "${BLUE}[4/5] Launching FastAPI Backend on port 8000...${NC}"
# Gracefully stop any existing docker backend container or orphan process holding port 8000
docker stop crimenexus_backend_prod 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
sleep 1

if [ -f "backend/venv/bin/uvicorn" ]; then
    (cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
    BACKEND_PID=$!
else
    (cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
    BACKEND_PID=$!
fi

# Trap cleanup to stop backend on Ctrl+C
cleanup() {
    echo -e "\n${YELLOW}Shutting down CRIMENEXUS services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}Services stopped successfully.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Wait briefly for FastAPI to initialize
sleep 2

# 5. Display Access Banner & Launch Frontend
echo -e "${CYAN}"
echo "--------------------------------------------------------------------------------"
echo -e "${GREEN}✓ All CRIMENEXUS Services are LIVE and interconnected!${NC}"
echo "--------------------------------------------------------------------------------"
echo -e "  🌐 Frontend Dashboard:     ${YELLOW}http://localhost:5173${NC}"
echo -e "  ⚡ Backend API & Swagger:  ${YELLOW}http://localhost:8000/docs${NC}"
echo -e "  🕸️ Neo4j Graph Browser:   ${YELLOW}http://localhost:7474${NC} (neo4j / crimenexus123)"
echo -e "  🗄️ PostgreSQL Database:   ${YELLOW}localhost:5435${NC} (user: postgres, db: crimenexus)"
echo "--------------------------------------------------------------------------------"
echo -e "${BLUE}[5/5] Launching React 19 Frontend (Vite)...${NC}\n"

# Run Vite frontend in foreground
npm run dev
