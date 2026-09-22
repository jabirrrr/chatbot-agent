# Project Decision Register

**Platform:** `chatbot-agent`  
**Classification:** Stakeholder Decision Register  
**Version:** 1.0.0  

---

## 1. Decision Register Protocol

All architectural, business, design, and integration decisions must be formally recorded in this register. No blocking decision may be silently assumed or bypassed during implementation.

---

## 2. Active Decision Records

### DEC-001: Background Task Execution Engine
* **Area:** Backend Infrastructure
* **Question:** Which background task execution engine should be implemented for asynchronous document parsing, chunking, OpenAI embeddings, and outbound webhooks?
* **Context:** The backend needs to process long-running jobs off the main HTTP request-response cycle.
* **Recommended Option:** **Celery + Redis Broker**. Battle-tested Python standard with task retry policies, dead-letter queues, scheduled tasks (Celery Beat), and rich monitoring (Flower).
* **Alternatives:** ARQ + Redis (pure `asyncio` worker, lighter footprint, but smaller ecosystem and fewer monitoring tools).
* **Trade-offs:** Celery has slightly higher memory overhead (~50MB per worker) than ARQ, but offers superior reliability, observability, and ecosystem maturity.
* **Impact:** Controls worker definitions, decorators, dependencies in `requirements.txt`, and service definitions in `docker-compose.yml`.
* **Blocking Status:** **Non-blocking for M0; Blocking for M2 (Ingestion).**
* **Final Decision:** *Pending User Confirmation*
* **Decision Date/Status:** `PENDING_REVIEW`

---

### DEC-002: Primary LLM Gateway & Fallback Hierarchy
* **Area:** AI & LLM Engine
* **Question:** How should the platform route chat completion requests across model providers?
* **Recommended Option:** **OpenRouter as Primary Default Gateway**, backed by direct OpenAI and Anthropic SDK adapters as automated fallbacks when OpenRouter returns 5xx errors or exceeds 8,000ms latency.
* **Alternatives:** Direct OpenAI as primary provider; OpenRouter only as secondary multi-model backup.
* **Trade-offs:** OpenRouter simplifies billing into a single corporate account and gives access to multiple models (`gpt-4o-mini`, `claude-sonnet-5`, `llama-3.1`), but introduces an external gateway hop. Fallback adapters ensure zero single-point-of-failure risk.
* **Impact:** Controls environment variables, `LLMProvider` interface configuration, and API key management.
* **Blocking Status:** **Non-blocking for M0/M1; Blocking for M3 (Chat Engine).**
* **Final Decision:** *Pending User Confirmation*
* **Decision Date/Status:** `PENDING_REVIEW`

---

### DEC-003: Real-Time Transport for Widget & Human Handoff
* **Area:** Real-Time Networking
* **Question:** What transport protocols should power visitor chat and operator human takeover?
* **Recommended Option:** **Dual Transport (SSE for Widget + WebSockets for Operator Dashboard)**.
  - Visitor widget connects over Server-Sent Events (SSE) via HTTP/2 (robust against mobile network switches, passes through firewalls).
  - Operator dashboard connects over WebSockets backed by Redis Pub/Sub for two-way typing indicators and instant takeover.
* **Alternatives:** Pure polling for dashboard (simplest to implement, but introduces 3–5s latency); WebSockets for both widget and dashboard (higher disconnection rate on mobile client websites).
* **Trade-offs:** Dual transport requires both an SSE endpoint and a WebSocket ASGI route, but delivers optimal UX for both mobile visitors and desktop operators.
* **Impact:** Controls ASGI middleware, Redis Pub/Sub channels, and frontend hook architecture.
* **Blocking Status:** **Non-blocking for M0/M1/M2; Blocking for M3 (Widget) and M5 (Handoff).**
* **Final Decision:** *Pending User Confirmation*
* **Decision Date/Status:** `PENDING_REVIEW`

---

### DEC-004: Free Plan Policy & Quota Exhaustion Behavior
* **Area:** Product & Monetization
* **Question:** What happens when an organization on the Free tier reaches its monthly limit (e.g., 100 conversations or 50 leads)?
* **Recommended Option:** **Perpetual Free Tier with Graceful Lead Capture Fallback**. When the monthly quota is reached, AI generation pauses and the widget automatically displays: *"Our automated assistant is offline. Please leave your details and question below, and our team will get back to you directly."*
* **Alternatives:** 14-day time-limited trial requiring a credit card to proceed; complete widget shutdown (hidden launcher).
* **Trade-offs:** Graceful fallback maintains positive brand perception and captures leads for the business even after quota exhaustion, encouraging upgrades to the Starter plan ($49/mo).
* **Impact:** Controls subscription state machine, quota evaluation middleware, and widget fallback components.
* **Blocking Status:** **Non-blocking for M0–M5; Blocking for M6 (Billing).**
* **Final Decision:** *Pending User Confirmation*
* **Decision Date/Status:** `PENDING_REVIEW`

---

### DEC-005: Production Cloud Storage & Transactional Email
* **Area:** Cloud Infrastructure
* **Question:** Which cloud providers should be used for production Object Storage and Transactional Email?
* **Recommended Option:**
  - **Storage:** **Cloudflare R2** or **AWS S3** (S3-compatible, zero egress fees on R2, interchangeable with local MinIO via boto3).
  - **Email:** **Resend** (developer-first REST API, clean templates) with Postmark as an alternative; MailHog for local development.
* **Alternatives:** AWS S3 + SendGrid; Supabase Storage + AWS SES.
* **Impact:** Controls SDK dependencies and production environment secret specifications.
* **Blocking Status:** **Non-blocking for local development (MinIO/MailHog used locally).**
* **Final Decision:** *Pending User Confirmation*
* **Decision Date/Status:** `PENDING_REVIEW`

---

### DEC-006: Project Code Namespace
* **Area:** Architecture & Engineering
* **Question:** Should the project codebase, Docker containers, and package structure use the namespace `chatbot-agent` (matching the repository) or `adszoo-agent` (matching the PRD reference)?
* **Recommended Option:** Standardize on **`chatbot-agent`** for repository, Docker containers, package names, and environment variables, with full white-label customization available for tenant-facing interfaces.
* **Alternatives:** Retain `adszoo-agent` across internal code.
* **Trade-offs:** Clean alignment with Git repository prevents developer confusion and simplifies CI/CD.
* **Impact:** Directory naming, Docker container labels, package prefixes.
* **Blocking Status:** **Non-blocking (Recommendation implemented in M0 scaffolding).**
* **Final Decision:** *Pending User Confirmation*
* **Decision Date/Status:** `PENDING_REVIEW`

---

### DEC-007: Mandatory UI Design Approval Gate
* **Area:** Frontend & Design System
* **Question:** Has the UI design prompt and reference design image/Figma specification been provided and approved for Milestone 1 / Dashboard implementation?
* **Recommended Option:** Standardize on the Apple-inspired minimalist design system specified in [ui-design-spec.md](file:///e:/webverse%20files/antigravity/chat-agent/project-docs/ui-design-spec.md), featuring high contrast, soft glassmorphic depth, spring count-up transitions, and consistent 16px/12px corner radii.
* **Alternatives:** Material Design 3, Plain Tailwind UI defaults.
* **Impact:** Controls visual tokens, color palettes, responsive shell layouts, and component styling across the entire dashboard and widget.
* **Blocking Status:** **Resolved & Approved.**
* **Final Decision:** Formally approved. UI Design Prompt & Specification documented in [ui-design-spec.md](file:///e:/webverse%20files/antigravity/chat-agent/project-docs/ui-design-spec.md).
* **Decision Date/Status:** `APPROVED`

