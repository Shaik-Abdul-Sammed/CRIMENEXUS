#!/usr/bin/env bash
# ==============================================================================
# CRIMENEXUS — Unified 1-Line Full-Stack Runner
# Boots both FastAPI Backend (port 8000) and React Frontend (port 5173) in 1 command
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}    🚀 CRIMENEXUS: Starting Backend (FastAPI) & Frontend (Vite)         ${NC}"
echo -e "${CYAN}========================================================================${NC}"

# Check and start Docker databases if daemon is available (PostgreSQL & Neo4j)
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo -e "${BLUE}Ensuring background database containers (Postgres & Neo4j) are up...${NC}"
    docker compose up -d postgres neo4j 2>/dev/null || true
fi

# Check if Backend is ALREADY running and responding on port 8000 (e.g. from Docker container or background task)
if curl -s -m 1 http://127.0.0.1:8000/docs >/dev/null 2>&1 || curl -s -m 1 http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ FastAPI Backend is already running and healthy on http://localhost:8000${NC}"
else
    echo -e "${BLUE}[1/3] Preparing port 8000...${NC}"
    # Stop any conflicting docker backend containers holding port 8000
    docker stop crimenexus_backend crimenexus_backend_prod $(docker ps -q --filter "publish=8000" 2>/dev/null) 2>/dev/null || true
    docker compose stop backend 2>/dev/null || true
    fuser -k -9 8000/tcp 2>/dev/null || true
    sleep 0.8

    echo -e "${BLUE}[2/3] Launching FastAPI Backend on http://localhost:8000...${NC}"
    if [ -f "backend/venv/bin/uvicorn" ]; then
        backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend &
        BACKEND_PID=$!
    else
        python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend &
        BACKEND_PID=$!
    fi
    sleep 1.5
fi

# Cleanup handler on Ctrl+C
cleanup() {
    echo -e "\n${YELLOW}Shutting down CRIMENEXUS services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Frontend stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Launch React Frontend in foreground
echo -e "${BLUE}[3/3] Launching React 19 Frontend on http://localhost:5173...${NC}"
echo -e "${GREEN}✓ Dashboard: http://localhost:5173${NC}"
echo -e "${GREEN}✓ API Docs:  http://localhost:8000/docs${NC}"
echo -e "${CYAN}------------------------------------------------------------------------${NC}\n"

npm run dev
