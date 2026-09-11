# Master Implementation Roadmap: AI-Powered Chatbot SaaS Platform

**Platform:** `chatbot-agent` (Multi-Tenant AI Conversational Platform)  
**Version:** 1.0.0  
**Status:** In Planning & Architecture Stage  
**Target Delivery:** 7 Verifiable Milestones  

---

## 1. Project Overview & Target State

The `chatbot-agent` platform is a production-grade, multi-tenant conversational AI Software-as-a-Service (SaaS) application designed for Small and Medium-sized Businesses (SMBs), service agencies, and enterprise clients.

### Target State Capabilities
1. **Instant Website Embedding:** A client embeds an isolated `<script>` tag on any website (WordPress, Shopify, Webflow, custom HTML). The widget launches in an isolated Shadow DOM with zero styling bleed.
2. **Grounded Business RAG:** The chatbot provides responses strictly grounded in the business’s uploaded knowledge sources (PDF, DOCX, TXT, Q&A, and business profile) using `pgvector` HNSW vector similarity search and OpenRouter LLMs.
3. **Autonomous Lead Qualification:** Conversational extraction of visitor contact details (name, email, phone, requirements) via LLM function calling, instantly persisted to the tenant database and surfaced to operators.
4. **Automated Appointment Scheduling:** Interactive calendar slot discovery and booking powered by Google Calendar OAuth 2.0.
5. **Real-Time Human Operator Takeover:** Seamless transition from AI assistant to live human agent in the Next.js operator dashboard via WebSockets and Redis Pub/Sub.
6. **Multi-Tenant Isolation & Tiered Monetization:** Complete data isolation via PostgreSQL Row-Level Security (RLS) combined with Stripe subscription tiers (Free, Starter, Professional).

---

## 2. Architectural Summary & Technology Decisions

| Domain | Selected Technology | Architectural Role |
| :--- | :--- | :--- |
| **Backend API Engine** | Python 3.11+ / FastAPI 0.111+ | High-throughput asynchronous ASGI web framework with strict Pydantic v2 validation contracts. |
| **Primary Database** | PostgreSQL 15+ | ACID relational storage, JSONB configuration storage, and Row-Level Security (RLS). |
| **Vector Search** | `pgvector` 0.7+ | Native HNSW vector index (`vector_cosine_ops`) with 1536-dimensional embeddings. |
| **In-Memory Store & Cache**| Redis 7.2+ | Rate limiting (Token Bucket), session state, task broker, and Pub/Sub for WebSockets. |
| **Asynchronous Workers** | Celery 5.4+ / ARQ | Offloads document text extraction, chunking, embedding generation, and outbound webhooks. |
| **LLM Gateway** | OpenRouter API Gateway | Multi-model routing (`gpt-4o-mini`, `claude-3.5-sonnet`, `llama-3.1`) with direct OpenAI/Anthropic fallback adapters. |
| **Embedding Engine** | OpenAI `text-embedding-3-small` | 1536-dimensional embeddings with high semantic fidelity ($0.02 / 1M tokens). |
| **Operator Dashboard** | Next.js 14 App Router (TypeScript) | Server components, Tailwind CSS, and accessible shadcn/ui primitives. |
| **Embeddable Widget** | Vanilla TypeScript + Vite (<40 KB) | Framework-free IIFE bundle rendering inside an open Shadow DOM with SSE streaming. |
| **Billing & Subscriptions** | Stripe API / Webhooks | Subscription lifecycle management, Checkout sessions, and Customer Portal with idempotency ledgers. |
| **Object Storage** | MinIO (Dev) / Cloudflare R2 or S3 (Prod) | Secure storage for tenant-uploaded business documents. |

---

## 3. Milestone Breakdown & Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ Milestone 0: Blueprint, Contracts & Environment (M0)        │
│ Scaffolding, Docker Compose, Alembic baselines & API schemas│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Milestone 1: Multi-Tenant Auth & RLS Isolation (M1)         │
│ Argon2id, JWT rotation, Org workspaces, RLS policies        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Milestone 2: Knowledge Ingestion & Vector Storage (M2)      │
│ MinIO, PDF/DOCX parsing, recursive chunking, pgvector HNSW  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Milestone 3: OpenRouter Conversational RAG & Widget (M3)    │
│ OpenRouter LLM, function calling, SSE stream, Shadow DOM UI │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Milestone 4: Operator Dashboard & CRM Inbox (M4)            │
│ Next.js 14, chat inbox, lead management table, token metrics│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Milestone 5: Google Calendar & Live Human Handoff (M5)      │
│ Google OAuth, slot booking tool calls, WebSockets handoff   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Milestone 6: Stripe Billing, Webhooks & Public REST API (M6)│
│ Stripe Checkout, idempotent webhooks, HMAC outbound, API key│
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Dependencies & Critical Path

1. **Database & Auth (M0 $\rightarrow$ M1):** Tenant authentication, RBAC, and RLS session context variables must exist before any domain entity can be securely stored.
2. **Vector Pipeline (M1 $\rightarrow$ M2):** Document parsing and embedding generation must be operational before prompt assembly can inject context.
3. **Conversational Engine (M2 $\rightarrow$ M3):** OpenRouter streaming and lead capture tool calling must be verified before building the operator inbox.
4. **Operator Inbox & Leads (M3 $\rightarrow$ M4):** Conversation records and lead models feed directly into the Next.js 14 dashboard UI.
5. **Human Takeover & Booking (M4 $\rightarrow$ M5):** Live handoff relies on the conversation UI built in M4 and the live chat pipeline in M3.
6. **Monetization & API (M4/M5 $\rightarrow$ M6):** Subscription limits enforce conversation and chatbot quotas across the entire system.

---

## 5. Major Technical Risks & Mitigation

1. **Cross-Tenant Data Exposure:**
   - *Mitigation:* Two-layer defense: SQLAlchemy repositories always inject `WHERE organization_id = :org_id`, and PostgreSQL RLS enforces session settings `app.current_org_id` on all tables. Automated CI test suite executes cross-tenant exploit attempts.
2. **LLM Gateway Downtime & Latency Spikes:**
   - *Mitigation:* Provider abstraction layer (`LLMProvider`) implements a circuit breaker falling back from OpenRouter to direct OpenAI/Anthropic SDKs upon consecutive 5xx errors or >8s timeouts.
3. **Host CSS Conflicts on Client Websites:**
   - *Mitigation:* Chat widget compiles to a pure Shadow DOM (`attachShadow({ mode: 'open' })`) with internal reset styles (`:host { all: initial }`).
4. **Duplicate Webhook Processing:**
   - *Mitigation:* Redis distributed locking (`SET lock:{id} NX EX 30`) + PostgreSQL unique constraint on `processed_webhook_events(event_id)`.

---

## 6. Testing & Quality Strategy

Every milestone is governed by a **Green Gate**:
- **Unit Tests:** Pytest test suite testing pure domain services and validation rules.
- **Integration Tests:** Database transactions asserting RLS boundaries and API response contracts.
- **Forecast Testing:** Verifying edge cases including rate-limit exhaustion, network dropouts during SSE streaming, and invalid webhook signatures.
- **Milestone Exit Verification:** Independent verification report signed off before subsequent milestones start.

---

## 7. Mandatory UI Design Gate

> [!IMPORTANT]
> **Milestone 1 Implementation Gate Rule:**  
> Implementation of the frontend dashboard and user-facing design systems will strictly not proceed until the approved UI design prompt and reference image/design reference are provided by the product owner.
