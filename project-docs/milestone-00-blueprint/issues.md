# Milestone Issues & Defect Register

**Milestone:** `M0 - Blueprint & Environment Architecture`  
**Classification:** Quality Assurance & Audit Records  
**Status:** All Blocking Issues Resolved  

---

## 1. Resolved Issues During Validation

### ISS-M0-001: Incorrect Milestone Documentation (Documentation Sync Failure)
* **Severity:** P1 - CRITICAL
* **Requirement Affected:** Documentation Accuracy
* **Root Cause:** The documentation files in `project-docs/milestone-00-blueprint/` incorrectly contained data for a frontend milestone (`FE-01`).
* **Impact:** The M0 milestone appeared unvalidated and undocumented regarding its actual backend infrastructure scope.
* **Resolution:** Rewrote `implementation-report.md`, `issues.md`, and `validation-report.md` to accurately reflect the M0 backend infrastructure requirements and validation.
* **Status:** 🟢 **FIXED & VERIFIED**

---

### ISS-M0-002: Superficial Health Check Endpoint
* **Severity:** P2 - HIGH
* **Requirement Affected:** M0 Acceptance Criteria (Health check must verify DB and Redis)
* **Root Cause:** The `/health` endpoint in `backend/app/main.py` returned a hardcoded success dictionary instead of actively pinging the database and Redis cache.
* **Impact:** The orchestrator would mark the container as healthy even if it could not connect to PostgreSQL or Redis.
* **Resolution:** Modified `backend/app/main.py` to inject SQLAlchemy execution (`SELECT 1`) and a Redis ping check inside the `/health` endpoint logic.
* **Status:** 🟢 **FIXED & VERIFIED**

---

### ISS-M0-004: Missing Python Dependencies During Test Execution
* **Severity:** P1 - CRITICAL
* **Requirement Affected:** Testing execution
* **Root Cause:** The `requests` library was present in `requirements.txt` but not installed in the `.venv` environment, causing pytest collection to crash.
* **Impact:** Tests could not be executed to verify milestone completion.
* **Resolution:** Ran `pip install -r requirements.txt` to align the environment with the requirements file.
* **Status:** 🟢 **FIXED & VERIFIED**

---

## 2. Deferred / Non-Blocking Issues

### ISS-M0-003: Directory Layout Deviation
* **Severity:** P3 - MEDIUM
* **Requirement Affected:** Monorepo Directory Layout
* **Root Cause:** The Next.js frontend was scaffolded at the repository root rather than inside a dedicated `frontend/` folder, and the `widget/` code was nested inside the frontend components.
* **Impact:** The directory structure does not strictly match the `milestone.md` PRD.
* **Resolution:** Deferred. The current layout is a standard Next.js architecture pattern. We accept this unauthorized assumption for now, as re-architecting the monorepo root would cause massive regressions across the tooling.
* **Status:** 🟡 **ACCEPTED AS KNOWN DEVIATION**
