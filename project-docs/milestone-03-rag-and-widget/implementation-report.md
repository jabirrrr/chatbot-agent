# Milestone 03 Implementation Report

**Milestone:** `M3 - OpenRouter Conversational RAG Engine & Universal Embeddable Widget`  
**Status:** Completed & Validated (Green Gate PASSED)  
**Executed At:** 2026-09-12 00:20:00 UTC  

---

## 1. Summary of Work Delivered

### Backend Conversational Engine & Storage
- **Conversation & Message Models (`backend/app/models/conversation.py`):**
  - `Conversation`: Tracks visitor sessions with `session_token`, status (`active`, `closed`, `handed_off`), sentiment, user-agent, visitor IP, and tenant-scoped `organization_id` & `chatbot_id`.
  - `Message`: Records role (`user`, `assistant`, `system`, `tool`), content, token count, latency, and tool-call payload JSON.
- **Lead Model (`backend/app/models/lead.py`):**
  - `Lead`: Captures first name, last name, email, phone, custom notes, status (`new`, `contacted`, `qualified`, `converted`), and foreign key to `conversation_id`.
- **Pydantic Schemas (`backend/app/schemas/conversation.py`, `backend/app/schemas/lead.py`):**
  - Validation schemas for conversation sessions, messages, and structured lead capture.
- **Database Migration (`backend/alembic/versions/003_conversations_and_leads.py`):**
  - Migration script defining PostgreSQL schemas for `conversations`, `messages`, and `leads`.

### LLM Abstraction & OpenRouter Gateway
- **LLM Provider Interface & Implementations (`backend/app/adapters/llm/provider.py`):**
  - `LLMProvider` abstract base class defining `stream_chat(...)` returning an asynchronous generator of `StreamDelta`.
  - `OpenRouterProvider`: Full integration with OpenRouter API (`/api/v1/chat/completions`) supporting OpenAI-compatible SSE streaming, function/tool calling for `create_lead`, and custom fallback headers (`HTTP-Referer`, `X-Title`).
  - `MockLLMProvider`: Deterministic offline provider for CI/CD and air-gapped testing. Accurately simulates RAG synthesis, tool calls for lead qualification, and honest fallback when context is absent.

### RAG Pipeline & Anti-Hallucination Guardrails
- **Conversational RAG Service (`backend/app/services/rag_service.py`):**
  - Dynamic system prompt construction embedding:
    1. Chatbot system instructions and persona.
    2. Tenant business profile and structured FAQ knowledge.
    3. Top-$K$ semantic vector chunks retrieved from `DocumentChunk`.
    4. Anti-hallucination guardrail rule: If no supporting context is found, instruct the model to state honest ignorance and fall back to `chatbot.fallback_message`.
  - Function calling dispatcher: Parses LLM `create_lead` tool invocations, persists lead data to PostgreSQL, and notifies the client stream.
  - Multi-turn conversation memory with recent message context injection.

### Public Widget REST & SSE API
- **Widget API Endpoints (`backend/app/api/v1/widget.py`):**
  - `GET /api/v1/widget/config?token={widget_token}`: Public config retrieval for theme, colors, bot name, and greeting.
  - `POST /api/v1/widget/session`: Initializes or resumes an ephemeral visitor session, returning a cryptographic `session_token`.
  - `POST /api/v1/widget/message`: Accepts visitor messages, streams assistant tokens and tool call confirmations via SSE (`text/event-stream`).
  - Mounted on global API router (`backend/app/api/v1/router.py`).

### Universal Embeddable Widget
- **Standalone Embed Widget (`public/widget.js`):**
  - Vanilla JavaScript (<30 KB uncompressed) running inside an isolated **Shadow DOM** (`mode: 'open'`) preventing any CSS collisions with the host page.
  - Floating launcher bubble with badge counter and responsive desktop/mobile modal styling.
  - Robust SSE stream reader handling token deltas and real-time typing indicators.
  - Inline lead capture badge rendered dynamically upon successful `create_lead` execution.
  - Automatic error handling with retry banner and reconnection states.

---

## 2. Verification Summary
- **Backend Tests:** 34 tests passing (100% pass rate) in 3.36s.
- **Frontend Build:** Next.js 16 compiled with 0 errors in 1.95s.
- **Traceability:** Requirements `REQ-BOT-04`, `REQ-BOT-05`, `REQ-AI-01`, `REQ-AI-02`, `REQ-AI-03`, `REQ-AI-04`, `REQ-AI-06`, `REQ-AI-07`, `REQ-AI-08`, and `REQ-WIDGET-01..06` validated and passed.
