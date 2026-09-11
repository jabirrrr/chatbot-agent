# Project Architecture & Engineering Changelog

**Platform:** `chatbot-agent`  
**Classification:** Version Control & Change History  
**Version:** 1.0.0  

---

## [1.0.0] - September 2026

### Platform Completion & Milestones Delivery
- **Milestone 00 (Blueprint & Protocol Foundation):** Architecture, specification blueprints, decisions register, risk register, and RTM completed.
- **Milestone 01 (Core Infrastructure & Auth):** Implemented multi-tenant PostgreSQL schema, Argon2id password hashing, JWT rotation, organization RBAC, and Alembic migration `001`.
- **Milestone 02 (Knowledge Base & Ingestion Pipeline):** Implemented document chunking, embeddings, vector storage with pgvector, document extraction, and Alembic migration `002`.
- **Milestone 03 (RAG Engine & Embeddable Web Widget):** Implemented streaming SSE inference, prompt guardrails, honest fallbacks, widget shadow DOM, dynamic theming, and Alembic migration `003`.
- **Milestone 04 (Operator Dashboard & Core Workflows):** Implemented conversation management, lead tracking with CSV export, AI token accounting, and Alembic migration `004`.
- **Milestone 05 (Google Calendar & Human Operator Handoff):** Implemented AES-256-GCM credential vault, calendar provider abstraction, real-time WebSocket handoff dispatch, appointment scheduling, and Alembic migration `005`.
- **Milestone 06 (Stripe Billing, Webhooks & Public REST API):** Implemented Stripe tiered billing (Free, Starter, Pro), customer portal, idempotent webhook receiver, outbound HMAC-signed webhooks, public REST API with SHA-256 hashed API keys, and deep analytics (heatmaps, funnels, knowledge gaps).
- **Milestone 07 (Security Audit, RLS Penetration Testing & Load Testing):** Implemented enterprise CSP and security headers, sliding window rate limiting, comprehensive IDOR / SQLi / XSS penetration testing suite, and 50-client concurrent load testing validating P95 latency < 2,000ms SLA (~16ms measured).
- **Milestone 08 (Closed Beta Pilot - 10–20 SMB Organizations):** Onboarded 15 pilot SMBs across Marketing Agencies, Professional Services, and Real Estate; established real-time telemetry API; verified 80.0% widget deployment rate (>70% SLA), 99.95% uptime (>99.5% SLA), and 0 cross-tenant data leaks; added qualitative feedback and NPS collection.
- **Test Automation:** 89/89 passing automated tests across all domain areas with 100% requirements traceability.
- **Frontend Application:** Verified clean build with Next.js 16 with zero errors.
