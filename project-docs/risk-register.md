# Risk Register & Mitigation Strategy

**Platform:** `chatbot-agent`  
**Classification:** Engineering Risk Management  
**Version:** 1.0.0  

---

## 1. Risk Scoring Methodology

Risks are assessed on Probability (Low, Med, High) and Impact (Low, Med, High, Critical).

---

## 2. Active Risk Register

| Risk ID | Category | Risk Description | Prob. | Impact | Early Indicators | Mitigation Strategy | Contingency Plan |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **RSK-SEC-01** | Security | Cross-tenant data leakage via missing `organization_id` in database query | Low | Critical | Query reviews; tenant mismatch in automated tests | Enforce PostgreSQL Row-Level Security (RLS) policies at the DB level; automated CI malicious cross-tenant test suite. | Emergency hotfix isolating the affected table and audit log inspection. |
| **RSK-COST-01**| Financial | Runaway LLM API token costs driven by malicious bot scraping or spam | Med | High | Spike in OpenRouter billing metrics; high token count in Redis | Enforce per-session token bucket rate limit (max 20 msgs / session, 2s cooldown) and monthly organization token budget caps. | Automatically degrade widget to "Lead Capture Only" mode when monthly token limit hits 100%. |
| **RSK-AI-01**  | Reliability | OpenRouter gateway outages or elevated latency (>8,000ms) impacting widget chat | Med | High | 5xx HTTP response codes from OpenRouter; SSE timeout exceptions | Implement circuit breaker pattern in `LLMProvider` that automatically shifts traffic to direct OpenAI or Anthropic SDKs. | Display non-blocking friendly retry UI to visitor; alert on-call engineer. |
| **RSK-PERF-01**| Performance| Slow vector similarity search as chunk counts grow past 100,000 rows | Med | Med | Query execution time >150ms in PostgreSQL slow query logs | Implement HNSW indexing (`vector_cosine_ops`) with tuned `m = 16, ef_construction = 64` and tenant partitioning. | Increase `ef_search` dynamically or partition knowledge chunks by organization. |
| **RSK-INT-01** | Integration | Google Calendar OAuth token expiration or user revokes consent | High | Med | HTTP 401/403 responses from Google API | Store encrypted refresh tokens; proactively refresh access tokens 5 minutes prior to expiry; detect revocation. | Mark integration as `NEEDS_RECONNECT` and fallback gracefully to conversational email capture. |
| **RSK-UX-01**  | Frontend | Host website CSS bleeding into the embedded widget | High | High | User visual defect reports; distorted widget buttons on specific themes | Compile widget in an isolated open Shadow DOM (`attachShadow({ mode: 'open' })`) with `:host { all: initial }` CSS reset. | Inject CSS property overrides with `!important` inside the Shadow Root. |
| **RSK-INT-02** | Reliability | Duplicate Stripe webhook events causing double-processing or incorrect tier state | Med | High | Repeated webhook IDs in access logs; duplicate customer updates | Implement Redis atomic distributed locks (`SET lock:{id} NX EX 30`) combined with a PostgreSQL idempotency ledger table. | Idempotency filter drops duplicate events immediately and returns HTTP 200. |
