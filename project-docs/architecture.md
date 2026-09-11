# System Architecture Specification & Engineering Design

**Platform:** `chatbot-agent` (Multi-Tenant Conversational AI SaaS)  
**Classification:** Core System Architecture Specification  
**Version:** 1.0.0  

---

## 1. High-Level Architecture Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT PLATFORMS                                 │
│                                                                                 │
│   ┌─────────────────────────────────────┐   ┌───────────────────────────────┐   │
│   │ Next.js 14 Web Dashboard (Admin/Org)│   │  Embeddable Widget (Client)   │   │
│   │ TypeScript · Tailwind · shadcn/ui   │   │  Vanilla TS · Shadow DOM · SSE│   │
│   └──────────────────┬──────────────────┘   └───────────────┬───────────────┘   │
└──────────────────────┼──────────────────────────────────────┼───────────────────┘
                       │                                      │
               HTTPS / WebSockets                         HTTPS / SSE
                       │                                      │
                       ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      REVERSE PROXY & INGRESS (NGINX / CDN)                      │
│        TLS Termination · Global Rate Limiting · Static Asset Caching · CORS     │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI APPLICATION ENGINE                               │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ AUTH & TENANT MIDDLEWARE                                                │   │
│   │ JWT Bearer Auth · Argon2id · RBAC Guards · Tenant Context Injection     │   │
│   └────────────────────────────────────┬────────────────────────────────────┘   │
│                                        │                                        │
│   ┌────────────────────────────────────▼────────────────────────────────────┐   │
│   │ CONTROLLERS / API ROUTES                                                │   │
│   │ /api/v1/auth          /api/v1/chatbots      /api/v1/conversations       │   │
│   │ /api/v1/knowledge     /api/v1/leads         /api/v1/appointments        │   │
│   │ /api/v1/analytics     /api/v1/billing       /api/widget/* (Public)      │   │
│   └────────────────────────────────────┬────────────────────────────────────┘   │
│                                        │                                        │
│   ┌────────────────────────────────────▼────────────────────────────────────┐   │
│   │ TENANT-ISOLATED DOMAIN SERVICES                                         │   │
│   │ ChatbotService    · KnowledgeService · ConversationService              │   │
│   │ LeadService       · AppointmentService· BillingService                  │   │
│   │ AnalyticsService  · RAGEngine        · NotificationService              │   │
│   └────────────────────────────────────┬────────────────────────────────────┘   │
│                                        │                                        │
│   ┌────────────────────────────────────▼────────────────────────────────────┐   │
│   │ INFRASTRUCTURE & EXTERNAL ADAPTERS                                      │   │
│   │ LLMAdapter (OpenRouter/OpenAI/Anthropic) · VectorStore (pgvector)       │   │
│   │ CalendarAdapter (Google OAuth/API)      · BillingAdapter (Stripe)       │   │
│   │ StorageAdapter (S3/MinIO)               · EmailAdapter (Resend/SMTP)    │   │
│   └──────┬──────────────────┬─────────────────┬───────────────────┬─────────┘   │
└──────────┼──────────────────┼─────────────────┼───────────────────┼─────────────┘
           │                  │                 │                   │
           ▼                  ▼                 ▼                   ▼
┌──────────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐
│  POSTGRESQL 15+  │  │    REDIS 7    │  │CELERY WORKERS │  │    EXTERNAL APIS    │
│  Relational Data │  │ Rate Limiting │  │ Async Parsing │  │ OpenRouter / OpenAI │
│  pgvector (HNSW) │  │ Task Queue    │  │ Chunk / Embed │  │ Stripe Payments     │
│  Row-Level Sec.  │  │ Session Cache │  │ Scheduled Cron│  │ Google Calendar     │
└──────────────────┘  └───────────────┘  └───────────────┘  └─────────────────────┘
```

---

## 2. Multi-Tenant Relational Entity Model (ERD)

Every tenant entity contains a non-nullable, indexed foreign key `organization_id: UUID`.

```mermaid
erDiagram
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : has
    USER ||--o{ ORGANIZATION_MEMBER : joins
    ORGANIZATION ||--o{ CHATBOT : owns
    ORGANIZATION ||--o{ KNOWLEDGE_SOURCE : possesses
    KNOWLEDGE_SOURCE ||--o{ KNOWLEDGE_CHUNK : split_into
    ORGANIZATION ||--o{ CONVERSATION : tracks
    CHATBOT ||--o{ CONVERSATION : generates
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION ||--o{ LEAD : produces
    LEAD ||--o{ APPOINTMENT : books
    ORGANIZATION ||--o{ SUBSCRIPTION : maintains
    ORGANIZATION ||--o{ AI_USAGE_RECORD : logs
    ORGANIZATION ||--o{ WEBHOOK : configures

    ORGANIZATION {
        uuid id PK
        string name
        string slug UK
        string industry
        string timezone
        string subscription_status
        timestamp created_at
    }

    USER {
        uuid id PK
        string email UK
        string hashed_password
        boolean is_email_verified
        string full_name
        timestamp created_at
    }

    ORGANIZATION_MEMBER {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string role "owner | admin | member"
        timestamp joined_at
    }

    CHATBOT {
        uuid id PK
        uuid organization_id FK
        string name
        string widget_token UK
        string status "active | inactive"
        jsonb configuration
        jsonb appearance
        timestamp created_at
    }

    KNOWLEDGE_SOURCE {
        uuid id PK
        uuid organization_id FK
        uuid chatbot_id FK
        string name
        string source_type "document | text | faq | business_info"
        string status "processing | ready | failed"
        string storage_path
        jsonb metadata
        timestamp created_at
    }

    KNOWLEDGE_CHUNK {
        uuid id PK
        uuid organization_id FK
        uuid source_id FK
        text content
        vector embedding "1536 dim vector"
        integer chunk_index
        jsonb metadata
    }

    CONVERSATION {
        uuid id PK
        uuid organization_id FK
        uuid chatbot_id FK
        uuid session_id
        string status "active | waiting_handoff | resolved | abandoned"
        uuid assigned_to FK
        jsonb visitor_metadata
        text ai_summary
        timestamp started_at
        timestamp updated_at
    }

    MESSAGE {
        uuid id PK
        uuid organization_id FK
        uuid conversation_id FK
        string role "user | assistant | system | tool"
        text content
        jsonb tool_calls
        jsonb token_usage
        integer latency_ms
        timestamp created_at
    }

    LEAD {
        uuid id PK
        uuid organization_id FK
        uuid conversation_id FK
        string first_name
        string last_name
        string email
        string phone
        string company
        text requirements
        jsonb custom_fields
        string status "new | contacted | qualified | converted"
        timestamp created_at
    }

    APPOINTMENT {
        uuid id PK
        uuid organization_id FK
        uuid lead_id FK
        uuid conversation_id FK
        string provider_event_id
        timestamptz scheduled_at
        integer duration_minutes
        string status "scheduled | completed | cancelled"
        timestamp created_at
    }

    SUBSCRIPTION {
        uuid id PK
        uuid organization_id FK
        string provider "stripe"
        string provider_subscription_id
        string plan_tier "free | starter | professional"
        string status "active | trialing | past_due | cancelled"
        timestamp current_period_end
    }

    AI_USAGE_RECORD {
        uuid id PK
        uuid organization_id FK
        uuid conversation_id FK
        string provider "openrouter | openai | anthropic"
        string model
        integer prompt_tokens
        integer completion_tokens
        decimal estimated_cost_usd
        timestamp recorded_at
    }
```

---

## 3. Row-Level Security (RLS) & Isolation Defense-in-Depth

### 3.1 Layer 1: Application Repository Enforcing
Every data access repository method requires `org_id: UUID` as an explicit parameter. No query without an explicit tenant scope can pass code review or automated static analysis.

### 3.2 Layer 2: PostgreSQL Engine Row-Level Security
At the start of every authenticated request transaction, the database connection executes:
```sql
SET LOCAL app.current_org_id = 'c4b8b6c0-6f91-4e2b-9877-1234567890ab';
```
PostgreSQL RLS policies unconditionally restrict read, insert, update, and delete access:
```sql
CREATE POLICY tenant_isolation_conversations ON conversations
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);
```

---

## 4. Two-Token Protocol & Widget Security

1. **Public Widget Token (`widget_token`):**
   - Safe to embed in public HTML: `<script src="https://cdn.example.com/widget.js" data-token="wgt_live_abc123"></script>`.
   - Grants read-only access to `/api/widget/config` (bot name, brand color, launcher icon, welcome message).
   - Allows calling `POST /api/widget/session` to initiate an anonymous visitor session.
2. **Ephemeral Session Token (`session_token`):**
   - Signed JWT containing `session_id`, `conversation_id`, and `organization_id`.
   - Emitted by `POST /api/widget/session` and retained in widget memory / `sessionStorage`.
   - Expiry: 60 minutes with rolling refresh.
   - Required for `POST /api/widget/message` and `POST /api/widget/lead`. Scoped exclusively to that session.

---

## 5. Embeddable Widget Architecture (Shadow DOM)

- **Standalone Bundle:** Compiled using Vite into a single minified IIFE bundle (`widget.js`), targeting under 40 KB gzipped.
- **Shadow DOM Mount:** Mounts into `document.createElement('div').attachShadow({ mode: 'open' })`.
- **CSS Isolation:** Internal styles are injected directly into the shadow root. External host styles (e.g., reset stylesheets or theme overrides) cannot alter button sizes, font sizes, or layout alignments.
- **Streaming Transport:** Employs Server-Sent Events (`EventSource` / `fetch` streaming) over HTTP/2 for token-by-token text streaming.
