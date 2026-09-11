# Technical Implementation Methods & Engineering Guide

**Platform:** AI-Powered Chatbot SaaS Platform (AdsZoo Agent)  
**Reference Document:** `PDR/AI_Chatbot_SaaS_Product_Requirements_Document_v1.1_OpenRouter.md`  
**Classification:** Internal Engineering Specification  
**Version:** 1.0  

---

## 1. Repository Architecture & Directory Structure

To maintain atomic commits, shared TypeScript/Pydantic schemas, and streamlined CI/CD, we utilize a structured **Monorepo** pattern:

```
adszoo-agent/
├── backend/                      # FastAPI Python Application
│   ├── alembic/                  # Database migration scripts
│   │   └── versions/
│   ├── app/
│   │   ├── api/                  # API Controllers
│   │   │   ├── v1/               # Authenticated SaaS endpoints
│   │   │   │   ├── auth.py
│   │   │   │   ├── organizations.py
│   │   │   │   ├── chatbots.py
│   │   │   │   ├── knowledge.py
│   │   │   │   ├── conversations.py
│   │   │   │   ├── leads.py
│   │   │   │   ├── appointments.py
│   │   │   │   ├── billing.py
│   │   │   │   └── analytics.py
│   │   │   └── widget/           # Public widget endpoints
│   │   │       ├── config.py
│   │   │       ├── session.py
│   │   │       └── message.py
│   │   ├── core/                 # App configuration, security, database
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── redis.py
│   │   ├── models/               # SQLAlchemy 2.0 Declarative Models
│   │   ├── schemas/              # Pydantic v2 validation contracts
│   │   ├── services/             # Pure domain logic (Tenant-scoped)
│   │   ├── adapters/             # Infrastructure provider abstractions
│   │   │   ├── llm/              # OpenRouter, OpenAI, Anthropic
│   │   │   ├── vector_store/     # pgvector adapter
│   │   │   ├── calendar/         # Google Calendar adapter
│   │   │   ├── billing/          # Stripe adapter
│   │   │   └── storage/          # S3 / MinIO adapter
│   │   └── workers/              # Celery task definitions
│   ├── tests/                    # Unit & integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                     # Next.js 14 App Router Dashboard
│   ├── src/
│   │   ├── app/                  # Routes (Dashboard, Onboarding, Auth)
│   │   ├── components/           # UI components (shadcn/ui primitives)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Axios clients, utils, validators
│   │   └── stores/               # Zustand UI stores
│   ├── public/                   # Static assets
│   ├── Dockerfile
│   └── package.json
├── widget/                       # Embeddable Chat Widget
│   ├── src/
│   │   ├── core/                 # Widget bootstrap, config loader
│   │   ├── ui/                   # Shadow DOM UI components, styles
│   │   ├── transport/            # SSE client, REST API client
│   │   └── index.ts              # Entry point
│   ├── vite.config.ts            # IIFE standalone bundler config
│   └── package.json
├── docker/                       # Docker Compose & deployment configs
│   ├── docker-compose.yml        # Local dev environment
│   └── nginx.conf                # Production reverse proxy
├── docs/                         # Engineering specifications & guides
└── README.md
```

---

## 2. Multi-Tenant Row-Level Security (RLS) Method

To enforce the non-negotiable requirement **REQ-ORG-04**, PostgreSQL Row-Level Security operates as a defense-in-depth barrier behind the service layer:

### 2.1 Database Migration (Alembic / SQL)
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable Row-Level Security on tenant-scoped tables
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies bound to transaction local variable
CREATE POLICY tenant_isolation_chatbots ON chatbots
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);

CREATE POLICY tenant_isolation_conversations ON conversations
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);

CREATE POLICY tenant_isolation_knowledge_chunks ON knowledge_chunks
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);
```

### 2.2 SQLAlchemy Session Middleware
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def get_tenant_db_session(org_id: str, session: AsyncSession):
    """Sets the PostgreSQL session variable for RLS enforcement within the transaction."""
    await session.execute(
        text("SET LOCAL app.current_org_id = :org_id"),
        {"org_id": org_id}
    )
    return session
```

---

## 3. OpenRouter API & LLM Provider Abstraction

### 3.1 Provider Interface Contract
```python
from abc import ABC, abstractmethod
from typing import AsyncIterator, Any
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # system, user, assistant, tool
    content: str
    tool_calls: list[dict[str, Any]] | None = None
    tool_call_id: str | None = None

class CompletionResult(BaseModel):
    content: str
    tool_calls: list[dict[str, Any]] | None = None
    prompt_tokens: int
    completion_tokens: int
    model: str
    provider: str

class LLMProvider(ABC):
    @abstractmethod
    async def complete(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
        model: str | None = None,
        temperature: float = 0.7,
    ) -> CompletionResult: ...

    @abstractmethod
    async def stream(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
        model: str | None = None,
        temperature: float = 0.7,
    ) -> AsyncIterator[str | dict[str, Any]]: ...

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]: ...
```

### 3.2 OpenRouter Concrete Implementation
```python
import httpx
import json
from typing import AsyncIterator, Any

class OpenRouterProvider(LLMProvider):
    def __init__(self, api_key: str, site_url: str = "https://adszoo.io", app_name: str = "AdsZoo Agent"):
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": site_url,
            "X-Title": app_name,
            "Content-Type": "application/json",
        }

    async def stream(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
        model: str | None = "openai/gpt-4o-mini",
        temperature: float = 0.7,
    ) -> AsyncIterator[str | dict[str, Any]]:
        payload = {
            "model": model,
            "messages": [m.model_dump(exclude_none=True) for m in messages],
            "temperature": temperature,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", f"{self.base_url}/chat/completions", headers=self.headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0]["delta"]
                        if "content" in delta and delta["content"]:
                            yield delta["content"]
                        if "tool_calls" in delta and delta["tool_calls"]:
                            yield {"tool_call": delta["tool_calls"]}
```

---

## 4. RAG Pipeline: Ingestion, Chunking & Vector Search

```
[Document Upload] ──> [MinIO / S3 Storage] ──> [Celery Task Enqueued]
                                                         │
                                                         ▼
[pgvector HNSW Index] <── [OpenAI Embeddings] <── [Recursive Chunking]
                                                    (512 tokens / 50 overlap)
```

### 4.1 Recursive Character Chunking Logic
```python
def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> list[str]:
    """Splits plain text into overlapping segments preserving paragraph boundaries."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""

    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) < chunk_size:
            current_chunk += ("\n\n" + paragraph if current_chunk else paragraph)
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # Retain overlap from end of previous chunk
            overlap_prefix = current_chunk[-overlap:] if len(current_chunk) >= overlap else current_chunk
            current_chunk = overlap_prefix + "\n\n" + paragraph

    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks
```

### 4.2 pgvector HNSW Vector Search Query
```python
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def search_relevant_chunks(
    session: AsyncSession,
    org_id: str,
    query_vector: list[float],
    top_k: int = 5
) -> list[dict]:
    query = text("""
        SELECT id, content, metadata, 1 - (embedding <=> :query_vec::vector) AS similarity
        FROM knowledge_chunks
        WHERE organization_id = :org_id
        ORDER BY embedding <=> :query_vec::vector
        LIMIT :top_k;
    """)
    result = await session.execute(
        query,
        {
            "org_id": org_id,
            "query_vec": str(query_vector),
            "top_k": top_k
        }
    )
    return [dict(row._mapping) for row in result.fetchall()]
```

---

## 5. Embeddable Widget: Shadow DOM & Two-Token Protocol

### 5.1 Standalone Bundling Configuration (`widget/vite.config.ts`)
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AdsZooChatWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    minify: 'terser',
  },
});
```

### 5.2 Shadow DOM Encapsulation Pattern (`widget/src/index.ts`)
```typescript
class AdsZooWidget {
  private container: HTMLElement;
  private shadow: ShadowRoot;
  private widgetToken: string;

  constructor(widgetToken: string) {
    this.widgetToken = widgetToken;
    this.container = document.createElement('div');
    this.container.id = 'adszoo-widget-host';
    document.body.appendChild(this.container);
    
    // Attach open Shadow Root for complete CSS isolation
    this.shadow = this.container.attachShadow({ mode: 'open' });
    this.init();
  }

  private async init() {
    // Inject isolated internal stylesheet
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .launcher-button { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; z-index: 2147483647; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .chat-window { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; border-radius: 16px; background: #ffffff; box-shadow: 0 8px 30px rgba(0,0,0,0.18); display: flex; flex-direction: column; overflow: hidden; z-index: 2147483647; }
      @media (max-width: 768px) { .chat-window { top: 0; left: 0; width: 100vw; height: 100vh; border-radius: 0; } }
    `;
    this.shadow.appendChild(style);

    // Fetch config using public widget token
    const config = await fetch(`/api/widget/config?token=${this.widgetToken}`).then(r => r.json());
    this.render(config);
  }
}
```

---

## 6. Stripe Billing Webhook Idempotency & Lifecycle

To satisfy **REQ-BILLING-03**, every Stripe webhook event is validated against HMAC signatures and recorded with an idempotency ledger to guarantee at-most-once processing:

```python
from fastapi import Request, HTTPException
import stripe

async def handle_stripe_webhook(request: Request, db_session: AsyncSession, webhook_secret: str):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event["id"]
    event_type = event["type"]

    # Check Idempotency Ledger
    existing = await db_session.execute(
        text("SELECT id FROM processed_webhook_events WHERE event_id = :id"),
        {"id": event_id}
    )
    if existing.scalar():
        return {"status": "already_processed"}

    # Process Events
    if event_type == "customer.subscription.created":
        await sync_subscription(db_session, event["data"]["object"], status="active")
    elif event_type == "customer.subscription.updated":
        await update_subscription_plan(db_session, event["data"]["object"])
    elif event_type == "customer.subscription.deleted":
        await cancel_subscription(db_session, event["data"]["object"])

    # Record in Idempotency Ledger
    await db_session.execute(
        text("INSERT INTO processed_webhook_events (event_id, event_type, processed_at) VALUES (:id, :type, NOW())"),
        {"id": event_id, "type": event_type}
    )
    await db_session.commit()
    return {"status": "success"}
```
