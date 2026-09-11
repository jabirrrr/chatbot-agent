# Milestone 06: Stripe Subscription Billing, Webhooks & Public REST API

**Platform:** `chatbot-agent`  
**Phase:** Phase 2 (Full Platform)  
**Milestone ID:** `M6`  
**Status:** Defined / Pending M5  

---

## 1. Milestone Goal
Implement commercial monetization via Stripe Billing, build an idempotent webhook processor, create outbound HMAC-signed webhooks, and expose a versioned Public REST API with hashed API key authentication.

---

## 2. Requirements Covered
- **REQ-BILLING-01:** Tiered Subscription Plans (Free, Starter $49, Professional $149)
- **REQ-BILLING-02:** Payment Gateway Abstraction (Stripe Checkout & Customer Portal)
- **REQ-BILLING-03:** Subscription Webhook Lifecycle Sync
- **REQ-BILLING-04:** Billing Portal & Invoicing
- **REQ-INT-02:** Outbound Webhooks with HMAC Verification
- **REQ-INT-03:** Public REST API with Scoped API Keys
- **REQ-ANALYTICS-02:** Conversation Volume & Heatmaps
- **REQ-ANALYTICS-03:** Lead Conversion Funnels
- **REQ-ANALYTICS-04:** Unanswered Question Logs & Gaps

---

## 3. Implementation Tasks
1. **Stripe Adapter (`app/adapters/billing/stripe.py`):**
   - Create Stripe Checkout sessions for plan upgrades.
   - Create Stripe Customer Portal sessions for payment method & invoice management.
2. **Idempotent Webhook Processor (`app/api/v1/billing/webhook.py`):**
   - Signature verification using `STRIPE_WEBHOOK_SECRET`.
   - Distributed locking via Redis + PostgreSQL `processed_webhook_events` table.
   - Handlers for `customer.subscription.*` and `invoice.payment_*`.
3. **Outbound Webhook Dispatcher (`app/workers/webhook_tasks.py`):**
   - Celery task dispatching events (`lead.created`, `conversation.completed`) to tenant endpoints with HMAC-SHA256 signatures in `X-Signature-SHA256` header.
4. **Public REST API (`app/api/v1/public/`):**
   - Authentication via SHA-256 hashed API keys (`cba_live_...`).
   - Endpoints: `GET /leads`, `POST /leads`, `GET /conversations`, `GET /analytics/summary`.
   - OpenAPI documentation accessible at `/api/docs`.
