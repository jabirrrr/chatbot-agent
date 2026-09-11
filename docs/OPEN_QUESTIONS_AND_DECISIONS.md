# Open Questions & Architectural Decisions Required

**Platform:** AI-Powered Chatbot SaaS Platform (AdsZoo Agent)  
**Reference Document:** `PDR/AI_Chatbot_SaaS_Product_Requirements_Document_v1.1_OpenRouter.md` (§12 Open Questions)  
**Classification:** Stakeholder Decision Matrix  
**Version:** 1.0  

---

## 1. Context

Per the user's explicit directive:
> *"ask me whatever the questions you have before you start working on the planning and never assume anything on your own and never hallucinate."*

This document formalizes the key architectural, business, and operational questions identified during the PRD analysis that require user/stakeholder confirmation before code execution commences.

---

## 2. Decision Matrix

### Decision 1: Background Task Execution Engine
* **PRD Reference:** §7.2, §12 Q1
* **Context:** The system requires an asynchronous background worker for document text extraction (PDF, DOCX), chunking, vector embedding generation via OpenAI, webhook dispatch, and scheduled analytics aggregation.
* **Options:**
  1. **Celery + Redis Broker (Recommended):** The battle-tested industry standard in the Python ecosystem. Features robust task retry backoffs, dead-letter queues, priority queues, scheduled execution via Celery Beat, and rich monitoring tooling (Flower). Slightly larger memory footprint.
  2. **ARQ + Redis:** An async-native Python worker library built on `asyncio`. Extremely lightweight and fast, but with a smaller community, fewer third-party integrations, and less native monitoring.
* **Impact:** Dictates worker configuration in `docker-compose.yml`, task decorator architecture, and scheduled aggregation jobs.

---

### Decision 2: Primary LLM Gateway & Provider Hierarchy
* **PRD Reference:** §5.1.5 REQ-AI-07, v1.1
* **Context:** The PRD v1.1 explicitly introduces the OpenRouter API gateway while requiring abstraction over multiple LLM providers (OpenRouter, OpenAI, Anthropic).
* **Options:**
  1. **OpenRouter as Primary Default Gateway (Recommended):** All conversational LLM requests route through OpenRouter by default. Gives instant access to multiple model families (`gpt-4o-mini`, `claude-3.5-sonnet`, `llama-3.1`) under a unified billing account. Direct OpenAI/Anthropic SDKs serve as automated fallbacks.
  2. **Direct OpenAI as Primary Default, OpenRouter as Multi-Model Backup:** Primary queries route directly to OpenAI (`api.openai.com`), falling back to OpenRouter or Anthropic if OpenAI returns 5xx errors or hits rate limits.
* **Impact:** Dictates default environment variables, routing logic in `adapters/llm/`, and API key management for early testing.

---

### Decision 3: Real-Time Transport for Human Handoff
* **PRD Reference:** §5.1.5 REQ-AI-05, §5.1.7 REQ-CONV-03, §12 Q3
* **Context:** When a visitor requests a human agent or the AI triggers handoff, an operator in the Next.js dashboard must be notified and communicate with the visitor in real time.
* **Options:**
  1. **Dual Transport: SSE for Widget + WebSockets for Dashboard (Recommended):**
     - Visitor widget connects via Server-Sent Events (SSE) over HTTP/2. Ideal for streaming LLM tokens, reconnects automatically, and passes through corporate firewalls and mobile networks.
     - Dashboard operator connects via WebSockets (backed by Redis Pub/Sub) for real-time alerts, typing indicators, and instant message handoff.
  2. **Pure Polling Fallback:** Widget uses SSE for AI generation; dashboard polls for new messages and handoff events every 3 to 5 seconds. Lowest operational complexity for v1, but introduces a 3–5s latency in live agent conversation takeover.
* **Impact:** Determines whether a WebSocket ASGI server layer and Redis Pub/Sub channels are deployed in Phase 1 vs. Phase 2.

---

### Decision 4: Free Plan Policy & Hard Quota Behavior
* **PRD Reference:** §5.1.11 REQ-BILLING-01, §12 Q7, §12 Q12
* **Context:** The platform offers a Free tier alongside Starter ($49/mo) and Professional ($149/mo). What happens when an organization on the free tier hits its monthly limit (e.g. 100 conversations or 50 leads)?
* **Options:**
  1. **Perpetual Free Tier with Graceful Lead Capture Fallback (Recommended):**
     - Account never expires.
     - When conversation cap (100 conversations/mo) is reached, AI chat pauses and the widget automatically falls back to: *"Our automated assistant is offline. Please enter your email and query, and our team will get back to you directly."*
     - Maximizes SMB adoption and lead capture value.
  2. **14-Day Free Trial (Time-Limited):**
     - Full access to Starter features for 14 days, after which the widget is disabled unless a credit card is provided.
     - Higher initial conversion pressure, but higher onboarding drop-off.
* **Impact:** Controls subscription state machine logic and widget degradation handlers.

---

### Decision 5: Website Knowledge Crawler
* **PRD Reference:** §12 Q10
* **Context:** In addition to manual text entry and file uploads (PDF, DOCX, TXT), should the platform include an automated website scraper where an SMB owner enters their URL (e.g., `https://mybusiness.com`), and the system automatically crawls and indexes their public pages?
* **Options:**
  1. **Defer to Post-Launch Roadmap (Recommended for v1):** Focus Phase 1 strictly on manual business info, FAQs, and document uploads. Scrapers introduce significant edge cases (JavaScript SPAs, rate limiting, anti-bot protections, crawling irrelevant terms/privacy pages).
  2. **Include Basic Single-Domain Crawler in Phase 2:** Utilize `trafilatura` or `crawl4ai` with a strict page limit (max 10 pages) to pre-populate the knowledge base during onboarding.
* **Impact:** Affects onboarding wizard step complexity and background worker dependencies.
