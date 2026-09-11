# Project Milestones & Delivery Roadmap

**Platform:** AI-Powered Chatbot SaaS Platform (AdsZoo Agent)  
**Reference Document:** `PDR/AI_Chatbot_SaaS_Product_Requirements_Document_v1.1_OpenRouter.md`  
**Classification:** Internal Engineering Specification  
**Version:** 1.0  

---

## 1. Roadmap Overview & Timeline

The roadmap is structured across five sequential phases designed to deliver maximum risk reduction early, achieve a working end-to-end conversational prototype in Phase 1, and scale to full commercial viability in Phase 2.

```
Phase 0: Foundation (Weeks 1–6)
  └── Milestone M1: Core Infrastructure, Multi-Tenant Auth & Storage Ready

Phase 1: Core Product (Weeks 7–16)
  ├── Milestone M2: Knowledge Base, Document Parsing & RAG Engine
  ├── Milestone M3: OpenRouter LLM Gateway, Conversational Engine & Widget
  └── Milestone M4: Operator Dashboard (Inbox, Leads, Knowledge Management)

Phase 2: Full Platform (Weeks 17–24)
  ├── Milestone M5: Google Calendar Scheduling & Real-Time Human Handoff
  └── Milestone M6: Stripe Billing, Outbound Webhooks & REST API

Phase 3: Beta Hardening (Weeks 25–28)
  ├── Milestone M7: Security Audit, RLS Penetration Testing & Load Testing
  └── Milestone M8: Closed Beta Pilot (10–20 SMB Organizations)

Phase 4: Public Launch (Week 29+)
  └── Milestone M9: General Availability (GA), Self-Serve Onboarding & Scaling
```

---

## 2. Requirement Mapping to Milestones (MoSCoW Matrix)

| Requirement ID | Requirement Title | Priority | Target Milestone | Phase |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | User Registration (Email/Password) | P0 | Milestone 1 | Phase 0 |
| **REQ-AUTH-02** | Login & Refresh Token Rotation | P0 | Milestone 1 | Phase 0 |
| **REQ-AUTH-03** | Password Reset via Email | P0 | Milestone 1 | Phase 0 |
| **REQ-AUTH-04** | Google OAuth 2.0 Social Login | P1 | Milestone 1 | Phase 0 |
| **REQ-AUTH-05** | Email Verification Flow | P0 | Milestone 1 | Phase 0 |
| **REQ-ORG-01** | Organization / Workspace Creation | P0 | Milestone 1 | Phase 0 |
| **REQ-ORG-02** | Role-Based Access Control (Owner/Admin/Member) | P0 | Milestone 1 | Phase 0 |
| **REQ-ORG-03** | Team Member Invitations | P0 | Milestone 1 | Phase 0 |
| **REQ-ORG-04** | Strict Multi-Tenant Isolation | P0 | Milestone 1 | Phase 0 |
| **REQ-BOT-01** | Create Chatbot & Generate Widget Token | P0 | Milestone 2 | Phase 1 |
| **REQ-BOT-02** | Edit Chatbot Configuration & Prompt Instructions | P0 | Milestone 2 | Phase 1 |
| **REQ-BOT-03** | Enable / Disable Chatbot Switch | P0 | Milestone 2 | Phase 1 |
| **REQ-BOT-04** | Appearance Customization & Theme Picker | P0 | Milestone 3 | Phase 1 |
| **REQ-BOT-05** | JavaScript Embed Snippet Generation | P0 | Milestone 3 | Phase 1 |
| **REQ-KB-01** | Structured Business Info Entry (FAQs, Hours) | P0 | Milestone 2 | Phase 1 |
| **REQ-KB-02** | Document Upload (PDF, TXT, DOCX) & Ingestion | P0 | Milestone 2 | Phase 1 |
| **REQ-KB-03** | Text Knowledge Article Management | P0 | Milestone 2 | Phase 1 |
| **REQ-KB-04** | Knowledge Source Status & Re-indexing | P0 | Milestone 2 | Phase 1 |
| **REQ-KB-05** | Text Chunking, Embeddings & Vector Storage | P0 | Milestone 2 | Phase 1 |
| **REQ-AI-01** | Natural Language Understanding & Streaming | P0 | Milestone 3 | Phase 1 |
| **REQ-AI-02** | Retrieval-Augmented Generation (RAG) | P0 | Milestone 3 | Phase 1 |
| **REQ-AI-03** | Conversational Lead Qualification & Capture | P0 | Milestone 3 | Phase 1 |
| **REQ-AI-04** | Function / Tool Calling Infrastructure | P0 | Milestone 3 | Phase 1 |
| **REQ-AI-05** | Human Agent Handoff | P0 | Milestone 5 | Phase 2 |
| **REQ-AI-06** | Honest Fallback Behavior (No Hallucination) | P0 | Milestone 3 | Phase 1 |
| **REQ-AI-07** | LLM Abstraction Layer (OpenRouter / OpenAI / Anthropic) | P0 | Milestone 3 | Phase 1 |
| **REQ-AI-08** | Conversation Session Memory | P0 | Milestone 3 | Phase 1 |
| **REQ-WIDGET-01** | Widget Initialization & Config Fetching | P0 | Milestone 3 | Phase 1 |
| **REQ-WIDGET-02** | Mobile & Desktop Responsive Design | P0 | Milestone 3 | Phase 1 |
| **REQ-WIDGET-03** | Messaging Interface & Typing Indicator | P0 | Milestone 3 | Phase 1 |
| **REQ-WIDGET-04** | Inline Lead Capture Confirmation UI | P0 | Milestone 3 | Phase 1 |
| **REQ-WIDGET-05** | Accessibility (WCAG 2.1 AA) | P0 | Milestone 3 | Phase 1 |
| **REQ-WIDGET-06** | Error Handling & Auto-Reconnect | P0 | Milestone 3 | Phase 1 |
| **REQ-CONV-01** | Conversation List with Filters & Search | P0 | Milestone 4 | Phase 1 |
| **REQ-CONV-02** | Conversation Detail Thread & Context View | P0 | Milestone 4 | Phase 1 |
| **REQ-CONV-03** | Real-Time Conversation Updates | P1 | Milestone 5 | Phase 2 |
| **REQ-LEAD-01** | Lead Profile & Detail Sidebar | P0 | Milestone 4 | Phase 1 |
| **REQ-LEAD-02** | Lead Pipeline List & Search | P0 | Milestone 4 | Phase 1 |
| **REQ-LEAD-03** | Lead Export to CSV | P0 | Milestone 4 | Phase 1 |
| **REQ-APPT-01** | Calendar Provider Abstraction & Google OAuth | P0 | Milestone 5 | Phase 2 |
| **REQ-APPT-02** | In-Widget Slot Selection & Booking | P0 | Milestone 5 | Phase 2 |
| **REQ-APPT-03** | Appointment List in Dashboard | P0 | Milestone 5 | Phase 2 |
| **REQ-APPT-04** | Calendar Failure Graceful Degradation | P0 | Milestone 5 | Phase 2 |
| **REQ-ANALYTICS-01** | Executive Overview Dashboard | P0 | Milestone 6 | Phase 2 |
| **REQ-ANALYTICS-02** | Conversation Volume & Heatmaps | P1 | Milestone 6 | Phase 2 |
| **REQ-ANALYTICS-03** | Lead Conversion Funnels | P1 | Milestone 6 | Phase 2 |
| **REQ-ANALYTICS-04** | Unanswered Question Logs & Gaps | P2 | Milestone 6 | Phase 2 |
| **REQ-ANALYTICS-05** | AI Usage & Per-Tenant Token Cost Accounting | P0 | Milestone 4 | Phase 1 |
| **REQ-BILLING-01** | Tiered Subscription Plans | P0 | Milestone 6 | Phase 2 |
| **REQ-BILLING-02** | Payment Gateway Abstraction (Stripe) | P0 | Milestone 6 | Phase 2 |
| **REQ-BILLING-03** | Subscription Webhook Lifecycle Sync | P0 | Milestone 6 | Phase 2 |
| **REQ-BILLING-04** | Billing Portal & Invoicing | P0 | Milestone 6 | Phase 2 |
| **REQ-INT-01** | Integration Framework & Encrypted Vault | P0 | Milestone 5 | Phase 2 |
| **REQ-INT-02** | Outbound Webhooks with HMAC Verification | P1 | Milestone 6 | Phase 2 |
| **REQ-INT-03** | Public REST API with Scoped API Keys | P1 | Milestone 6 | Phase 2 |

---

## 3. Detailed Phase Breakdown & Exit Criteria

### Phase 0: Foundation & Core Infrastructure (Weeks 1–6)
* **Goal:** Build the complete underlying substrate: multi-tenant database, authentication, RBAC, background queues, and containerization.
* **Key Deliverables:**
  1. Docker Compose setup for PostgreSQL 15 (with `pgvector`), Redis 7, MinIO, MailHog, and FastAPI.
  2. Database models in SQLAlchemy 2.0 with Alembic versioning.
  3. Authentication service: Argon2id password hashing, email verification, JWT bearer tokens, refresh token rotation in HttpOnly cookies.
  4. Organization workspace creation, invitation tokens, and role authorization guards (`Owner`, `Admin`, `Member`).
  5. PostgreSQL Row-Level Security (RLS) policies and tenant isolation test harness.
* **Exit Criteria (Milestone M1):**
  - A developer can register, verify email, create an organization, invite a member, and authenticate via API.
  - Automated CI test suite confirms that cross-tenant access attempts return HTTP 403/404.

---

### Phase 1: Core Product & RAG Engine (Weeks 7–16)
* **Goal:** Complete the foundational end-to-end chatbot loop: ingest business knowledge, build the RAG pipeline, expose the embeddable widget, execute conversations via OpenRouter, and capture leads in the dashboard.
* **Key Deliverables:**
  1. **Milestone M2 (Knowledge & RAG):** Document upload endpoints (`PDF`, `DOCX`, `TXT`), Celery task pipeline for text extraction, recursive chunking (512 tokens / 50 overlap), embedding via OpenAI `text-embedding-3-small`, and pgvector HNSW indexing.
  2. **Milestone M3 (OpenRouter & Widget):** `LLMProvider` abstraction with OpenRouter gateway implementation; dynamic prompt assembly; function calling for lead capture (`create_lead`); vanilla TypeScript widget compiled via Vite into isolated Shadow DOM with SSE streaming.
  3. **Milestone M4 (Dashboard Inbox & Leads):** Next.js 14 App Router dashboard with shadcn/ui; Onboarding setup wizard; Conversation list and thread detail view; Lead management table with CSV export; AI token cost calculation.
* **Exit Criteria:**
  - A user uploads a business PDF in the dashboard, copies the widget snippet into an external HTML test page, chats with the bot, verifies answers are grounded in the PDF, and watches a lead record automatically populate the dashboard.

---

### Phase 2: Full Commercial Platform (Weeks 17–24)
* **Goal:** Complete all enterprise and monetization modules: automated scheduling, real-time human takeover, Stripe billing, and integrations.
* **Key Deliverables:**
  1. **Milestone M5 (Appointments & Handoff):** Google Calendar OAuth 2.0 integration; slot availability detection and appointment creation tool calls; real-time human agent handoff with status transitions (`Active` $\rightarrow$ `Waiting for Human` $\rightarrow$ `Resolved`).
  2. **Milestone M6 (Billing, Webhooks & API):** Stripe Checkout and Customer Portal integration; subscription lifecycle webhook processor (`payment_succeeded`, `subscription_updated`); outbound webhooks with HMAC-SHA256 signatures; public REST API with hashed API key authentication and OpenAPI documentation at `/api/docs`.
* **Exit Criteria:**
  - Complete commercial user flow: visitor books a calendar slot in chat, requests a human agent who answers from the dashboard, and the organization upgrades from Free to Starter tier via Stripe Checkout.

---

### Phase 3: Beta Hardening & Validation (Weeks 25–28)
* **Goal:** Perform rigorous security auditing, stress testing, and real-world pilot validation.
* **Key Deliverables:**
  1. **Milestone M7 (Security & Load Testing):** Penetration testing of tenant boundaries, CSP header configuration, rate limit verification under load, and stress testing 50 concurrent chat sessions per organization (asserting P95 latency < 2,000ms).
  2. **Milestone M8 (Closed Beta):** Onboard 10–20 real SMB businesses across marketing agencies, professional services, and real estate; monitor activation funnel and error logs; gather qualitative feedback.
* **Exit Criteria:**
  - >70% of beta organizations successfully deploy their widget.
  - Zero cross-tenant data leaks.
  - System uptime >99.5% during testing period.

---

### Phase 4: Public Launch & Scaling (Week 29+)
* **Goal:** Open self-serve registration, activate marketing campaigns, and monitor growth metrics.
* **Key Deliverables:**
  1. Marketing landing page with interactive widget preview and transparent pricing.
  2. Automated onboarding checklist and transactional email sequence.
  3. Real-time system status page and Sentry error monitoring.
  4. Tracking Monthly Recurring Revenue (MRR), churn rate (<5%), and AI cost margins (>65% gross margin).
