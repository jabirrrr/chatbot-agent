# Milestone 03: OpenRouter Conversational RAG Engine & Embeddable Widget

**Platform:** `chatbot-agent`  
**Phase:** Phase 1 (Core Product)  
**Milestone ID:** `M3`  
**Status:** Defined / Pending M2  

---

## 1. Milestone Goal
Deliver the core conversational AI pipeline: integrate OpenRouter API gateway with dynamic prompt assembly and RAG context injection, implement function calling for lead capture (`create_lead`), and compile a standalone vanilla TypeScript embeddable widget running in an isolated Shadow DOM over Server-Sent Events (SSE).

---

## 2. Requirements Covered
- **REQ-BOT-04:** Appearance Customization & Theme Picker
- **REQ-BOT-05:** JavaScript Embed Snippet Generation
- **REQ-AI-01:** Natural Language Understanding & SSE Streaming
- **REQ-AI-02:** Retrieval-Augmented Generation (RAG)
- **REQ-AI-03:** Conversational Lead Qualification & Capture
- **REQ-AI-04:** Function / Tool Calling Infrastructure
- **REQ-AI-06:** Honest Fallback Behavior (No Hallucination)
- **REQ-AI-07:** LLM Abstraction (OpenRouter / OpenAI / Anthropic)
- **REQ-AI-08:** Conversation Session Memory
- **REQ-WIDGET-01:** Widget Initialization & Config Fetching
- **REQ-WIDGET-02:** Mobile & Desktop Responsive Design
- **REQ-WIDGET-03:** Messaging Interface & Typing Indicator
- **REQ-WIDGET-04:** Inline Lead Capture Confirmation UI
- **REQ-WIDGET-05:** Accessibility Standards (WCAG 2.1 AA)
- **REQ-WIDGET-06:** Error Handling & Auto-Reconnect

---

## 3. Implementation Tasks
1. **OpenRouter Provider (`app/adapters/llm/`):**
   - Implement `LLMProvider` with OpenRouter streaming client.
   - Circuit breaker fallback to direct OpenAI SDK.
2. **Prompt Assembly & Tool Calling (`app/services/rag_service.py`):**
   - Inject retrieved chunks, tenant business info, and conversation history.
   - Define `create_lead(first_name, last_name, email, phone, requirements)` tool schema.
3. **Public Widget Endpoints (`app/api/widget/`):**
   - `GET /config?token={widget_token}` (returns theme, launcher position, welcome message).
   - `POST /session` (returns ephemeral `session_token`).
   - `POST /message` (initiates SSE text stream).
4. **Vanilla TypeScript Widget (`widget/`):**
   - Vite standalone IIFE compiler (<40 KB gzipped).
   - Shadow DOM mount and CSS isolation.
   - Streaming SSE client with auto-reconnection.
