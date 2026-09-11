# Milestone 06 Test Plan & Verification Matrix

**Milestone:** `M6 - Billing, Webhooks & Public REST API`  
**Status:** Defined / Pending M5  

---

## 1. Test Cases

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-BIL-001` | REQ-BILLING-01 | Create Stripe Checkout Session | Org on Free plan | Call `POST /api/v1/billing/checkout` for Starter plan | Returns Stripe Checkout URL; session contains `organization_id` metadata | NOT RUN |
| `TEST-BIL-003` | REQ-BILLING-03 | Idempotent webhook processing | Stripe webhook configured | Send duplicate `customer.subscription.created` mock webhooks | First call updates tenant plan to `starter`; second call returns `already_processed` with zero duplicate mutations | NOT RUN |
| `TEST-INT-002` | REQ-INT-02 | Outbound HMAC webhook delivery | Tenant webhook configured | Trigger lead creation | Celery worker dispatches POST request with valid `X-Signature-SHA256` matching secret | NOT RUN |
| `TEST-INT-003` | REQ-INT-03 | Public REST API key auth & query | API key generated | Call `GET /api/v1/public/leads` with `X-API-Key: cba_live_...` | Returns HTTP 200 with tenant lead records; invalid key returns HTTP 401 | NOT RUN |
