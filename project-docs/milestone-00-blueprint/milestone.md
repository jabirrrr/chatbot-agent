# Milestone 00: Project Blueprint, Scaffolding & Environment Architecture

**Platform:** `chatbot-agent`  
**Phase:** Phase 0 (Foundation)  
**Milestone ID:** `M0`  
**Status:** In Progress / Ready for Setup  

---

## 1. Milestone Goal
Establish the foundational monorepo structure, container orchestration environment (`docker-compose.yml`), baseline database migrations, and development tooling. Ensure all dependencies can be spun up with a single command with zero errors.

---

## 2. Scope & Technical Deliverables
1. **Monorepo Directory Layout:** Initialize `backend/`, `frontend/`, `widget/`, `docker/`, and `project-docs/`.
2. **Container Orchestration (`docker/docker-compose.yml`):**
   - PostgreSQL 15 with `pgvector` extension.
   - Redis 7.2 (Alpine).
   - MinIO Object Storage with auto-bucket provisioning.
   - MailHog (SMTP on port 1025, Web UI on port 8025).
   - FastAPI application stub with live reload.
3. **Backend Environment Configuration:**
   - FastAPI 0.111+ application bootstrap.
   - SQLAlchemy 2.0 async engine and session management.
   - Alembic initialization with `alembic.ini` and async `env.py`.
   - Health check endpoint at `GET /health` verifying DB and Redis connectivity.
4. **Environment Variables:** `.env.example` defining all required configuration keys.

---

## 3. Dependencies & Prerequisites
- Docker Engine 24+ & Docker Compose v2.
- Python 3.11+.
- Node.js 18+ (for frontend/widget).

---

## 4. Acceptance Criteria
- [ ] Running `docker compose up -d` boots PostgreSQL, Redis, MinIO, MailHog, and the FastAPI service.
- [ ] `GET http://localhost:8000/health` returns `{"status": "healthy", "database": "connected", "redis": "connected"}`.
- [ ] Running `alembic upgrade head` executes without errors.
- [ ] PostgreSQL logs show `pgvector` extension created successfully.

---

## 5. Definition of Done
All containers run healthy, database migrations apply cleanly, health check endpoint passes automated tests, and all documentation is current.
