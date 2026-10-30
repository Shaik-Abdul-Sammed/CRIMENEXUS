# STANDARD OPERATING PROCEDURE (SOP) 04: AIR-GAPPED & POLICE INTRANET DEPLOYMENT GUIDE
**Document Reference:** CRIMENEXUS-SOP-04-DEVOPS  
**Target Audience:** State Police IT Cell, Cyber Command System Administrators, DevOps Engineers  
**Classification:** RESTRICTED - TECHNICAL INFRASTRUCTURE SPECIFICATION  

---

## 1. ARCHITECTURAL OVERVIEW & DEPLOYMENT TOPOLOGY
CRIMENEXUS is architected for zero-internet dependency and can be deployed inside an air-gapped Police Local Area Network (POLNET / State Police Intranet) or isolated On-Premises Government Data Center (SDC).

```
                      +-----------------------------------+
                      |   Police Secure Terminal / CCTNS  |
                      |   (VLAN 10.x / 172.x Restricted)  |
                      +-----------------+-----------------+
                                        | (HTTPS / WSS)
                                        v
                      +-----------------+-----------------+
                      |    Reverse Proxy / Nginx Gateway   |
                      +-----------------+-----------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+----------------+---------------+           +-----------------+---------------+
|   CRIMENEXUS Backend Service   |           |    CRIMENEXUS Frontend UI       |
|    (FastAPI / AI Core Engine)  |           |     (React 19 / Cytoscape)      |
+----------------+---------------+           +---------------------------------+
                 |
      +----------+----------+
      |                     |
      v                     v
+-----+-------------+ +-----+-------------+
| PostgreSQL (5435) | | Neo4j Graph (7687)|
| Relational Ledger | | Network Topology  |
+-------------------+ +-------------------+
```

---

## 2. AIR-GAPPED SYSTEM PREREQUISITES
- **Operating System:** Ubuntu Server 22.04 LTS / RHEL 9 / Rocky Linux 9.
- **Hardware Minimums:**
  - CPU: 8 Cores (AMD EPYC or Intel Xeon)
  - RAM: 32 GB ECC DDR4/DDR5
  - Storage: 500 GB NVMe SSD (Encrypted with LUKS)
- **Container Runtime:** Docker Engine 24.0+ & Docker Compose v2.

---

## 3. SINGLE-COMMAND INITIALIZATION
To boot the full stack on any authorized police terminal:

```bash
# Clone or transfer release bundle into secure directory
cd /opt/crimenexus

# Set environment credentials
cp .env.example .env
# Edit credentials: POSTGRES_PASSWORD, NEO4J_PASSWORD, JWT_SECRET_KEY

# Grant execution rights and run
chmod +x start.sh
./start.sh
```

`start.sh` automatically executes:
1. Docker Compose boot of PostgreSQL (Port 5435) and Neo4j Enterprise/Community (Ports 7474 & 7687).
2. Health-check verification loop.
3. Database migration execution (`alembic upgrade head`).
4. Neo4j graph uniqueness schema constraint application.
5. FastAPI service initialization on `http://0.0.0.0:8000`.
6. Frontend production build serving on `http://0.0.0.0:5173`.

---

## 4. AIR-GAPPED DOCKER IMAGE EXPORT / IMPORT
For completely severed networks with no external internet connection:

**On Connected Staging Machine:**
```bash
docker compose build
docker save -o crimenexus_bundle.tar crimenexus-backend crimenexus-frontend postgres:15-alpine neo4j:5.24-community
```

**On Secure Air-Gapped Police Server:**
```bash
docker load -i crimenexus_bundle.tar
docker compose up -d
```

---

## 5. CRYPTOGRAPHIC BACKUP & DATA RETENTION
- **PostgreSQL Database Dump:**
  ```bash
  docker exec -t crimenexus_postgres pg_dump -U postgres crimenexus > /backup/pg_backup_$(date +%F).sql
  ```
- **Neo4j Graph Database Dump:**
  ```bash
  docker exec -t crimenexus_neo4j neo4j-admin database dump neo4j --to-path=/backup/neo4j
  ```
- Backups should be written to encrypted optical WORM media or BitLocker/LUKS external drives and signed by the Station In-Charge.
