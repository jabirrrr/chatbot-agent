# Requirements Traceability Matrix (RTM)

**Platform:** `chatbot-agent`  
**Classification:** Engineering Quality Assurance & Traceability  
**Version:** 1.0.0  

---

## 1. Traceability Methodology

Every PRD requirement is explicitly tracked through its complete lifecycle:
$$\text{Requirement ID} \longrightarrow \text{Milestone} \longrightarrow \text{Implementation Task} \longrightarrow \text{Code Component} \longrightarrow \text{Test ID} \longrightarrow \text{Validation Result}$$

No requirement may be modified, deprecated, or removed without an approved entry in [decisions.md](file:///e:/webverse%20files/antigravity/chat-agent/project-docs/decisions.md) or [changelog.md](file:///e:/webverse%20files/antigravity/chat-agent/project-docs/changelog.md).

---

## 2. Complete Traceability Register

| Requirement ID | Requirement Title | Priority | Milestone | Code / Module Component | Test ID | Validation Status |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **REQ-AUTH-01** | User Registration (Email/Password) | P0 | M1 | `app.api.v1.auth`, `app.services.auth_service` | `TEST-AUTH-001` | **PASSED** |
| **REQ-AUTH-02** | Login & Refresh Token Rotation | P0 | M1 | `app.core.security`, `app.api.v1.auth` | `TEST-AUTH-002` | **PASSED** |
| **REQ-AUTH-03** | Password Reset via Email | P0 | M1 | `app.services.email_service`, `app.api.v1.auth` | `TEST-AUTH-003` | **PASSED** |
| **REQ-AUTH-04** | Google OAuth 2.0 Social Login | P1 | M1 | `app.adapters.oauth.google`, `app.api.v1.auth` | `TEST-AUTH-004` | DEFERRED (M5) |
| **REQ-AUTH-05** | Email Verification Flow | P0 | M1 | `app.services.auth_service`, MailHog/Resend | `TEST-AUTH-005` | **PASSED** |
| **REQ-ORG-01** | Organization / Workspace Creation | P0 | M1 | `app.api.v1.organizations`, `app.models.org` | `TEST-ORG-001` | **PASSED** |
| **REQ-ORG-02** | Role-Based Access Control (Owner/Admin/Member) | P0 | M1 | `app.core.security.rbac`, `app.api.deps` | `TEST-ORG-002` | **PASSED** |
| **REQ-ORG-03** | Team Member Invitations & Token Flow | P0 | M1 | `app.services.invitation_service` | `TEST-ORG-003` | **PASSED** |
| **REQ-ORG-04** | Strict PostgreSQL Row-Level Security (RLS) | P0 | M1 | `app.core.database`, PostgreSQL RLS Policies | `TEST-RLS-001` | **PASSED** |
| **REQ-BOT-01** | Create Chatbot & Generate Widget Token | P0 | M2 | `app.api.v1.chatbots`, `app.services.chatbot_service` | `TEST-BOT-001` | **PASSED** |
| **REQ-BOT-02** | Edit Chatbot Config & Prompt Instructions | P0 | M2 | `app.api.v1.chatbots`, `app.models.chatbot` | `TEST-BOT-002` | **PASSED** |
| **REQ-BOT-03** | Enable / Disable Chatbot Switch | P0 | M2 | `app.api.v1.chatbots` | `TEST-BOT-003` | **PASSED** |
| **REQ-BOT-04** | Appearance Customization & Theme Config | P0 | M3 | `app.api.widget.config`, `public/widget.js` | `TEST-BOT-004` | **PASSED** |
| **REQ-BOT-05** | JavaScript Embed Snippet Generation | P0 | M3 | `public/widget.js`, `app.api.v1.widget` | `TEST-BOT-005` | **PASSED** |
| **REQ-KB-01** | Structured Business Info Entry (FAQs, Hours) | P0 | M2 | `app.api.v1.knowledge`, `app.models.knowledge`| `TEST-KB-001` | **PASSED** |
| **REQ-KB-02** | Document Upload (PDF, DOCX, TXT) Ingestion | P0 | M2 | `app.adapters.storage`, `app.services.knowledge_service`| `TEST-KB-002` | **PASSED** |
| **REQ-KB-03** | Text Knowledge Article CRUD | P0 | M2 | `app.api.v1.knowledge` | `TEST-KB-003` | **PASSED** |
| **REQ-KB-04** | Knowledge Source Status & Re-indexing | P0 | M2 | `app.services.knowledge_service` | `TEST-KB-004` | **PASSED** |
| **REQ-KB-05** | Text Chunking, Embeddings & Vector Storage | P0 | M2 | `app.services.chunking_service`, `pgvector` HNSW | `TEST-KB-005` | **PASSED** |
| **REQ-AI-01** | Natural Language Understanding & Streaming | P0 | M3 | `app.adapters.llm`, SSE Endpoint `widget/message` | `TEST-AI-001` | **PASSED** |
| **REQ-AI-02** | Retrieval-Augmented Generation (RAG) | P0 | M3 | `app.services.rag_service`, Vector Search | `TEST-AI-002` | **PASSED** |
| **REQ-AI-03** | Conversational Lead Qualification & Capture | P0 | M3 | `app.services.rag_service`, `create_lead` Tool | `TEST-AI-003` | **PASSED** |
| **REQ-AI-04** | Function / Tool Calling Infrastructure | P0 | M3 | `app.adapters.llm`, Tool Call Dispatcher | `TEST-AI-004` | **PASSED** |
| **REQ-AI-05** | Human Agent Handoff Protocol | P0 | M5 | `app.services.handoff_service`, WebSockets | `TEST-AI-005` | NOT RUN |
| **REQ-AI-06** | Honest Fallback Behavior (No Hallucination)| P0 | M3 | `app.services.rag_service`, System Prompt Guard | `TEST-AI-006` | **PASSED** |
| **REQ-AI-07** | LLM Abstraction (OpenRouter / OpenAI / Anthropic)| P0 | M3 | `app.adapters.llm.provider`, `MockLLMProvider` | `TEST-AI-007` | **PASSED** |
| **REQ-AI-08** | Conversation Session Memory | P0 | M3 | `app.models.conversation`, `app.models.message` | `TEST-AI-008` | **PASSED** |
| **REQ-WIDGET-01**| Widget Initialization & Config Fetching | P0 | M3 | `public/widget.js`, `GET /api/v1/widget/config` | `TEST-WGT-001` | **PASSED** |
| **REQ-WIDGET-02**| Mobile & Desktop Responsive Design | P0 | M3 | `public/widget.js` CSS & Media Queries | `TEST-WGT-002` | **PASSED** |
| **REQ-WIDGET-03**| Messaging Interface & Typing Indicator | P0 | M3 | `public/widget.js` UI & SSE Stream Reader | `TEST-WGT-003` | **PASSED** |
| **REQ-WIDGET-04**| Inline Lead Capture Confirmation UI | P0 | M3 | `public/widget.js` Tool Call Badge Renderer | `TEST-WGT-004` | **PASSED** |
| **REQ-WIDGET-05**| Accessibility Standards (WCAG 2.1 AA) | P0 | M3 | Shadow DOM ARIA attributes & keyboard nav | `TEST-WGT-005` | **PASSED** |
| **REQ-WIDGET-06**| Error Handling & Auto-Reconnect | P0 | M3 | `public/widget.js` Error State & Retry Handler | `TEST-WGT-006` | **PASSED** |
| **REQ-CONV-01** | Conversation List with Filters & Search | P0 | M4 | `frontend/src/app/dashboard/conversations` | `TEST-CONV-001` | NOT RUN |
| **REQ-CONV-02** | Conversation Detail Thread & Context View | P0 | M4 | `frontend/src/components/chat-thread.tsx` | `TEST-CONV-002` | NOT RUN |
| **REQ-CONV-03** | Real-Time Conversation Updates | P1 | M5 | WebSocket Hook, Redis Pub/Sub | `TEST-CONV-003` | NOT RUN |
| **REQ-LEAD-01** | Lead Profile & Detail Sidebar | P0 | M4 | `frontend/src/components/lead-sidebar.tsx` | `TEST-LEAD-001` | NOT RUN |
| **REQ-LEAD-02** | Lead Pipeline Table & Search | P0 | M4 | `frontend/src/app/dashboard/leads` | `TEST-LEAD-002` | NOT RUN |
| **REQ-LEAD-03** | Lead Export to CSV | P0 | M4 | `app.api.v1.leads.export` | `TEST-LEAD-003` | NOT RUN |
| **REQ-APPT-01** | Calendar Provider Abstraction & Google OAuth | P0 | M5 | `app.adapters.calendar.google` | `TEST-APPT-001` | NOT RUN |
| **REQ-APPT-02** | In-Widget Slot Selection & Booking | P0 | M5 | `widget/src/ui/calendar-picker.ts` | `TEST-APPT-002` | NOT RUN |
| **REQ-APPT-03** | Appointment List in Dashboard | P0 | M5 | `frontend/src/app/dashboard/appointments` | `TEST-APPT-003` | NOT RUN |
| **REQ-APPT-04** | Calendar Failure Graceful Degradation | P0 | M5 | `app.services.appointment_service` | `TEST-APPT-004` | NOT RUN |
| **REQ-ANALYTICS-01**| Executive Overview Dashboard | P0 | M4 | `frontend/src/app/dashboard/overview` | `TEST-ANA-001` | NOT RUN |
| **REQ-ANALYTICS-02**| Conversation Volume & Heatmaps | P1 | M6 | `frontend/src/components/charts/heatmap` | `TEST-ANA-002` | NOT RUN |
| **REQ-ANALYTICS-03**| Lead Conversion Funnels | P1 | M6 | `frontend/src/components/charts/funnel` | `TEST-ANA-003` | NOT RUN |
| **REQ-ANALYTICS-04**| Unanswered Question Logs & Gaps | P2 | M6 | `app.api.v1.analytics.gaps` | `TEST-ANA-004` | NOT RUN |
| **REQ-ANALYTICS-05**| AI Usage & Per-Tenant Token Accounting | P0 | M4 | `app.models.ai_usage`, Redis counters | `TEST-ANA-005` | NOT RUN |
| **REQ-BILLING-01**| Tiered Subscription Plans | P0 | M6 | `app.models.subscription`, Stripe Products | `TEST-BIL-001` | NOT RUN |
| **REQ-BILLING-02**| Stripe Payment Gateway Abstraction | P0 | M6 | `app.adapters.billing.stripe` | `TEST-BIL-002` | NOT RUN |
| **REQ-BILLING-03**| Subscription Webhook Lifecycle Sync | P0 | M6 | `app.api.v1.billing.webhook` | `TEST-BIL-003` | NOT RUN |
| **REQ-BILLING-04**| Billing Portal & Invoicing | P0 | M6 | `frontend/src/app/dashboard/billing` | `TEST-BIL-004` | NOT RUN |
| **REQ-INT-01** | Integration Framework & Encrypted Vault | P0 | M5 | `app.core.security.vault` (AES-256-GCM) | `TEST-INT-001` | NOT RUN |
| **REQ-INT-02** | Outbound Webhooks with HMAC Verification | P1 | M6 | `app.workers.webhook_tasks` | `TEST-INT-002` | NOT RUN |
| **REQ-INT-03** | Public REST API with Scoped API Keys | P1 | M6 | `app.api.v1.public`, API Key Middleware | `TEST-INT-003` | NOT RUN |
