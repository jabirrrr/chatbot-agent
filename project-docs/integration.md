# Third-Party Integration Register & Interface Specifications

**Platform:** `chatbot-agent`  
**Classification:** Integration Architecture Specification  
**Version:** 1.0.0  

---

## 1. Integration Inventory

The platform integrates with the following external providers:
1. **OpenRouter API** (Primary Conversational LLM Gateway)
2. **OpenAI API** (Embedding Generation & Direct Fallback LLM)
3. **Anthropic API** (Direct Fallback LLM)
4. **Google Calendar API** (OAuth 2.0 & Appointment Scheduling)
5. **Stripe API** (Customer Billing & Subscription Webhooks)
6. **Object Storage: MinIO / S3** (Business Document Storage)
7. **Transactional Email: Resend / MailHog** (System Notifications & Invites)

---

## 2. Integration Deep-Dives

### 2.1 OpenRouter API (Primary LLM Gateway)
* **Provider:** OpenRouter (`openrouter.ai`)
* **Purpose:** Serves as the primary unified API gateway for conversational inference, multi-turn chat, and tool execution across diverse model architectures (`openai/gpt-4o-mini`, `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.1-8b-instruct`).
* **Why it is needed:** Prevents single-vendor lock-in, unifies LLM credit billing into a single corporate account, and dynamically routes between models based on tenant requirements and cost tiers.
* **Data Sent:** Dynamic system prompt (with injected RAG context), conversation message history, function schemas (`create_lead`, `check_availability`, `book_appointment`), and generation hyperparameters (`temperature`, `max_tokens`).
* **Data Received:** Server-Sent Event (SSE) chunks containing token deltas and tool call arguments (`delta.content`, `delta.tool_calls`), total token usage metrics (`prompt_tokens`, `completion_tokens`).
* **Authentication Method:** HTTP Bearer Token in `Authorization` header.
* **Required Credentials:** `OPENROUTER_API_KEY`.
* **API Endpoints:** `POST https://openrouter.ai/api/v1/chat/completions`.
* **Webhooks:** None.
* **Rate Limits:** Defined by OpenRouter account tier and underlying model provider quotas.
* **Error Handling & Retry Strategy:** Exponential backoff on HTTP 429 and 503 (1s, 2s, 4s). On 3 consecutive failures or latency >8,000ms, trigger circuit breaker to fallback LLM.
* **Timeout Strategy:** 30-second connect and read timeout via `httpx.AsyncClient`.
* **Idempotency:** Ephemeral stateless completion requests.
* **Security & Privacy:** TLS 1.3 encryption in transit; headers include `HTTP-Referer` and `X-Title` for attribution. No confidential tenant keys transmitted.
* **Environment Variables:** `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_DEFAULT_MODEL`, `OPENROUTER_FALLBACK_MODEL`.
* **Sandbox / Test Environment:** Test API keys or mock HTTP fixtures in Pytest (`pytest-httpx`).
* **Failure & Fallback Behavior:** Circuit breaker activates Direct OpenAI or Direct Anthropic adapter seamlessly.
* **Cost Implications:** Pay-per-token pricing with zero upfront commitment.
* **Lock-in Risk:** Extremely low due to the underlying `LLMProvider` abstraction interface.

---

### 2.2 OpenAI API (Embeddings & Direct Fallback)
* **Provider:** OpenAI (`api.openai.com`)
* **Purpose:** Generates 1536-dimensional semantic vector embeddings for knowledge base chunks (`text-embedding-3-small`) and acts as direct failover for chat completions.
* **Why it is needed:** Industry-standard embedding model offering supreme semantic fidelity and low cost ($0.02 / 1M tokens).
* **Data Sent:** Plain text chunks (max 8191 input tokens per batch) for embedding; conversation history for fallback completions.
* **Data Received:** Float arrays `list[float]` of length 1536; chat completion deltas.
* **Authentication Method:** HTTP Bearer Token.
* **Required Credentials:** `OPENAI_API_KEY`.
* **API Endpoints:** `POST https://api.openai.com/v1/embeddings`, `POST https://api.openai.com/v1/chat/completions`.
* **Error Handling & Retry Strategy:** Automated retries with jitter for rate limits (HTTP 429).
* **Timeout Strategy:** 15-second timeout for embeddings, 30s for chat.
* **Environment Variables:** `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`.
* **Cost Implications:** ~$0.00002 per 1,000 tokens for embeddings.

---

### 2.3 Google Calendar API (OAuth 2.0 & Scheduling)
* **Provider:** Google Cloud Platform (Google Workspace / Calendar)
* **Purpose:** Discovers operator calendar availability and books appointments directly during visitor conversations.
* **Why it is needed:** Enables autonomous conversational conversion without forcing users to navigate to external Calendly links.
* **Data Sent:** OAuth 2.0 authorization codes and refresh tokens; calendar free/busy query windows (`timeMin`, `timeMax`); event creation payloads (summary, start time, end time, attendee email, description).
* **Data Received:** Busy intervals `list[{start, end}]`; created event ID, HTML link, and meeting metadata.
* **Authentication Method:** OAuth 2.0 Authorization Code flow with offline access (refresh token rotation).
* **Required Credentials:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
* **API Endpoints:**
  - `POST https://oauth2.googleapis.com/token`
  - `POST https://www.googleapis.com/calendar/v3/freeBusy`
  - `POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`
* **Error Handling & Token Refresh:** Refresh access tokens 5 minutes prior to expiry using the securely vaulted refresh token. If authorization is revoked, flag the calendar integration as `NEEDS_RECONNECT` and fallback gracefully to in-chat email capture.
* **Security & Privacy:** Scopes restricted to `https://www.googleapis.com/auth/calendar.events` and `https://www.googleapis.com/auth/calendar.freebusy`. Tokens stored AES-256-GCM encrypted in the database.
* **Environment Variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

---

### 2.4 Stripe API (Billing & Subscriptions)
* **Provider:** Stripe (`stripe.com`)
* **Purpose:** Handles credit card payments, tiered SaaS subscription lifecycles, checkout sessions, and customer billing portals.
* **Why it is needed:** PCI-compliant monetization and automated tier quota enforcement.
* **Data Sent:** Customer metadata (organization ID, tenant email), price IDs, checkout success/cancel URLs.
* **Data Received:** Subscription status updates (`active`, `past_due`, `canceled`), invoice PDFs, customer portal session URLs.
* **Authentication Method:** API Secret Key via HTTP Basic/Bearer auth.
* **Required Credentials:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
* **API Endpoints:**
  - `POST https://api.stripe.com/v1/checkout/sessions`
  - `POST https://api.stripe.com/v1/billing_portal/sessions`
  - `GET https://api.stripe.com/v1/subscriptions/{id}`
* **Webhooks:**
  - Inbound webhook endpoint: `POST /api/v1/billing/webhook`
  - Events handled: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
* **Security & Idempotency:**
  - Every inbound webhook validated using `stripe.Webhook.construct_event` and `STRIPE_WEBHOOK_SECRET`.
  - Atomic distributed lock in Redis + database unique ledger `processed_webhook_events(event_id)` ensures at-most-once processing.
* **Environment Variables:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`.

---

### 2.5 Object Storage: MinIO / S3
* **Provider:** MinIO (Local/Dev) / AWS S3 or Cloudflare R2 (Production)
* **Purpose:** Encrypted object storage for tenant business knowledge files (PDFs, Word documents, images, avatars).
* **Data Sent:** Raw document binary streams, tenant folder prefix (`{org_id}/documents/{source_id}.pdf`).
* **Authentication Method:** S3 Signature v4 (Access Key + Secret Key).
* **Required Credentials:** `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET_NAME`.
* **Security:** Buckets configured as completely private; client downloads use time-limited presigned URLs (15-minute TTL).

---

### 2.6 Transactional Email: Resend / MailHog
* **Provider:** MailHog (Local Dev SMTP) / Resend (Production REST API)
* **Purpose:** Sends user registration verification links, password reset emails, organization invitations, and lead alert notifications.
* **Authentication Method:** API Key via HTTP Bearer token (Resend) or standard SMTP (MailHog).
* **Required Credentials:** `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `SMTP_HOST`, `SMTP_PORT`.
* **Error Handling:** Celery background worker with exponential retries for transient delivery failures.
