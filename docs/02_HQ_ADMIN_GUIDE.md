# CRIMENEXUS: Police Headquarters IT Administrator Guide
**Document Classification:** RESTRICTED / POLICE IT INFRASTRUCTURE & CYBER CELL  
**Target Audience:** State Police IT Cells, Systems Engineers, DevOps & Infrastructure Leads  
**Version:** 2.0.0 (Production Hardened)

---

## 1. System Architecture Overview

CRIMENEXUS uses a microservice-based, containerized, zero-trust architecture partitioned into four core tiers:

```
                  +----------------------------------+
                  |  Police Terminal / IO Browser   |
                  +-----------------+----------------+
                                    | HTTPS / Port 5173
                                    v
+-------------------------------------------------------------------+
|               DOCKER CONTAINER NETWORK (crimenexus_net)           |
|                                                                   |
|   +--------------------------+       +------------------------+   |
|   |    crimenexus_frontend   |       |   crimenexus_backend   |   |
|   |    (Nginx / Vite SPA)    | ----> |   (FastAPI / PyMuPDF)  |   |
|   +--------------------------+       +-----------+------------+   |
|                                                  |                |
|               +----------------------------------+                |
|               | (Internal Docker Network Only - No Host Ports)   |
|               v                                  v                |
|   +-----------------------+          +------------------------+   |
|   |  crimenexus_postgres  |          |    crimenexus_neo4j    |   |
|   |   (PostgreSQL 15)     |          |   (Neo4j 5.24 Graph)   |   |
|   |   Port 5432 (Internal)|          |   Port 7687 (Internal) |   |
|   +-----------------------+          +------------------------+   |
+-------------------------------------------------------------------+
```

### Network Isolation Policy:
- **Zero Host Database Exposure:** `postgres` and `neo4j` do NOT expose host port bindings in `docker-compose.yml`. They use `expose` directives accessible exclusively across the internal Docker bridge network.
- **Reverse Proxying:** In production, route all inbound client traffic through Nginx with TLS 1.3 certificates.

---

## 2. Infrastructure Deployment & Commands

### Prerequisites:
- Ubuntu Server 22.04 LTS / 24.04 LTS or RHEL 9.x
- Docker Engine 24.0+ & Docker Compose Plugin 2.20+
- Minimum Server Specs: 8 vCPUs, 16 GB RAM, 100 GB SSD/NVMe (Air-gapped deployment capable)

### Initial Cluster Bring-up:
```bash
# 1. Clone or copy deployment bundle into secure /opt directory
cd /opt/crimenexus

# 2. Configure production environment file
cp .env.example .env
chmod 600 .env

# 3. Build containers
docker compose build

# 4. Spin up cluster as persistent daemon
docker compose up -d

# 5. Verify all services are healthy
docker compose ps
```

---

## 3. Cryptographic Key & Secret Management

### JWT Secret Key Protocol:
CRIMENEXUS enforces a zero-trust check on startup. If `JWT_SECRET_KEY` equals the factory default string, or has fewer than 32 characters, the application deliberately aborts in production mode.

#### Generating a Production Master Key:
```bash
# Generate high-entropy 256-bit hexadecimal key
openssl rand -hex 32
```
Update `.env`:
```ini
JWT_SECRET_KEY=<PASTE_GENERATED_KEY_HERE>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
AUDIT_HMAC_SECRET=<GENERATE_SEPARATE_HMAC_SECRET>
```

#### Key Rotation Schedule:
- **Quarterly Routine Rotation:** Update `JWT_SECRET_KEY` during scheduled maintenance windows. Existing users will re-authenticate using refresh tokens.
- **Emergency Revocation:** If a terminal or key is suspected compromised, update `JWT_SECRET_KEY` and restart the backend container immediately:
  ```bash
  docker compose restart backend
  ```

---

## 4. Database Backup & Disaster Recovery (DR)

### A. PostgreSQL Automated Backup (Relational & Audit Ledger)
Execute the daily backup cron job:
```bash
#!/usr/bin/env bash
BACKUP_DIR="/var/backups/crimenexus/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker exec -t crimenexus_postgres pg_dump -U postgres -F c crimenexus > "$BACKUP_DIR/crimenexus_pg_$TIMESTAMP.dump"

# Retain last 30 daily backups
find "$BACKUP_DIR" -type f -mtime +30 -delete
```

### B. Neo4j Graph Database Backup
```bash
#!/usr/bin/env bash
BACKUP_DIR="/var/backups/crimenexus/neo4j"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker exec -t crimenexus_neo4j neo4j-admin database dump neo4j --to-path=/tmp/
docker cp crimenexus_neo4j:/tmp/neo4j.dump "$BACKUP_DIR/neo4j_$TIMESTAMP.dump"
```

### Disaster Restoration Procedure:
```bash
# Restoring PostgreSQL
docker exec -i crimenexus_postgres pg_restore -U postgres -d crimenexus -c /tmp/restore.dump

# Restoring Neo4j
docker stop crimenexus_backend crimenexus_neo4j
docker compose run --rm neo4j neo4j-admin database load neo4j --from-path=/backups --overwrite-destination=true
docker compose start neo4j backend
```

---

## 5. Security & Rate Limiter Configuration

- **Login Endpoint Rate Limiting:** Configured in `app/main.py` via `slowapi` (`5 requests / minute` per IP) to mitigate brute-force and credential stuffing.
- **Refresh Endpoint:** Rate-limited to `20 requests / minute`.
- **Upload File Limits:** Enforced at both Nginx (`client_max_body_size 10M;`) and FastAPI layer (`MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024`).

---

## 6. System Monitoring & Health Check APIs

| Health Endpoint | Method | Expected Output | Purpose |
|:---|:---|:---|:---|
| `/health` | `GET` | `{"status":"healthy","relational_db":"postgresql","graph_db":"neo4j","ai_engine":"active"}` | Cluster Liveness |
| `/api/v1/analytics/alerts` | `GET` | Array of system alerts | Alert Queue Status |
| `/docs` | `GET` | OpenAPI 3.0 Interactive Documentation | API Reference |

To monitor live container logs:
```bash
docker compose logs -f --tail=100 backend
```
