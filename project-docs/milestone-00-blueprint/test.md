# Milestone 00 Test Plan & Verification Matrix

**Milestone:** `M0 - Blueprint & Environment Architecture`  
**Status:** Ready to Execute  

---

## 1. Test Cases

| Test ID | Description | Preconditions | Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-M0-001` | Verify Docker Compose stack startup | Docker daemon running | Run `docker compose -f docker/docker-compose.yml up -d` | All 5 services (postgres, redis, minio, mailhog, backend) start without exiting | Pending execution | NOT RUN |
| `TEST-M0-002` | Verify FastAPI `/health` endpoint | Containers running | `curl -s http://localhost:8000/health` | Returns HTTP 200 with status healthy and DB/Redis connected | Pending execution | NOT RUN |
| `TEST-M0-003` | Verify `pgvector` extension in PostgreSQL | PostgreSQL container healthy | Connect via psql: `SELECT extname FROM pg_extension WHERE extname = 'vector';` | Returns `vector` | Pending execution | NOT RUN |
| `TEST-M0-004` | Verify Redis connectivity & ping | Redis container healthy | Run `redis-cli ping` | Returns `PONG` | Pending execution | NOT RUN |
| `TEST-M0-005` | Verify Alembic migration baseline | DB container running | Run `alembic upgrade head` inside backend container | Applies baseline migration with 0 errors | Pending execution | NOT RUN |
