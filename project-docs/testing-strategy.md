# Holistic Testing Strategy & Quality Assurance Protocol

**Platform:** `chatbot-agent`  
**Classification:** Quality Assurance & Testing Engineering  
**Version:** 1.0.0  

---

## 1. Quality Engineering Principles

Quality is not evaluated solely on happy-path execution. Every component and user workflow must withstand boundary stress, edge cases, permission violations, network interruptions, provider degradation, and forecasted scaling loads.

---

## 2. Test Execution Tiers

### 2.1 Tier 1: Unit & Component Tests
- **Backend:** Pytest executing against isolated service layers, utility functions (recursive chunker, token calculators), Pydantic request validators, and prompt assembly.
- **Frontend:** Vitest + React Testing Library for isolated React component rendering, state stores (Zustand), and utility hooks.
- **Widget:** Vitest verifying vanilla TypeScript state machines, SSE parsing, and Shadow DOM rendering.

### 2.2 Tier 2: Integration & Database Tests
- **RLS & Security Harness:** Transactional test suite executing database queries with various `app.current_org_id` contexts to prove that cross-tenant access consistently returns 0 rows or errors.
- **Async Celery Pipeline:** Testing background ingestion tasks with mock S3 storage and mock OpenAI embedding vectors.

### 2.3 Tier 3: End-to-End & API Contract Tests
- **FastAPI TestClient / HTTPX:** Testing authenticated REST endpoints against an active PostgreSQL + Redis container.
- **Playwright / Cypress:** Browser automation testing the embeddable widget embedded on dummy third-party HTML pages and Next.js operator flows.

---

## 3. Forecasted Testing & Scenario Matrix

| Scenario ID | Category | Forecasted Stress Scenario | Preconditions | Simulated Failure Condition | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FOR-001** | High Concurrency | 250 simultaneous chat sessions stream messages across 10 organizations | Active Docker environment | High simultaneous SSE connections hitting FastAPI ASGI workers | Sub-2,000ms P95 latency; Redis handles rate-limiting counters without starvation; zero cross-talk between sessions. |
| **FOR-002** | Provider Downtime | OpenRouter API returns HTTP 503 or experiences severe network dropouts | Chat session in progress | OpenRouter endpoint returns 503 Service Unavailable | System detects error immediately, switches via circuit breaker to Direct OpenAI / Anthropic fallback without dropping visitor connection. |
| **FOR-003** | Token Quota Exhaustion | Organization exceeds monthly conversation cap (100 msgs) mid-chat | Free tier organization | Monthly counter in Redis reaches 101 | Widget transitions gracefully to Lead Capture fallback mode: *"Our assistant is offline. Please leave your details..."* without crashing. |
| **FOR-004** | Malicious File Upload | User uploads corrupted, password-protected, or 100MB PDF | File upload form | Corrupted binary stream or massive file size | Input validation rejects files >25MB; Celery worker catches parsing errors, marks source as `FAILED`, and surfaces friendly error message. |
| **FOR-005** | Host Theme Style Piercing | Host website has aggressive `* { color: red !important; font-size: 10px !important; }` | External test HTML page | External CSS loaded before widget script | Shadow DOM boundaries prevent external styles from affecting internal chat bubble colors, fonts, or launcher position. |
| **FOR-006** | Webhook Replay Attack | Stripe dispatches duplicate `customer.subscription.updated` events simultaneously | Stripe integration configured | Multiple identical webhook events arrive within 100ms | Redis atomic lock (`SET lock:stripe:{id} NX EX 30`) processes only the first request; secondary requests return HTTP 200 `already_processed`. |
| **FOR-007** | Network Interruption | Mobile visitor switches from Wi-Fi to 4G/5G while AI is streaming response | Active SSE stream | Connection drops mid-sentence | SSE client attempts automatic reconnection with `Last-Event-ID`; server resumes or re-renders completed message history cleanly. |
| **FOR-008** | Unauthorized URL Access | Organization Member attempts to navigate directly to `/dashboard/billing` | User logged in as `Member` role | Direct navigation or API call to admin endpoint | RBAC guard intercepts request and returns HTTP 403 Forbidden with clear permission notification. |
