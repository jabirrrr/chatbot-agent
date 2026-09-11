# Milestone 03 Test Plan & Verification Matrix

**Milestone:** `M3 - OpenRouter RAG Engine & Widget`  
**Status:** Defined / Pending M2  

---

## 1. Test Cases

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-WGT-001` | REQ-WIDGET-01 | Widget public config fetch | Chatbot created | Call `GET /api/widget/config?token={token}` | Returns HTTP 200 with theme JSON, bot name, and welcome text | NOT RUN |
| `TEST-WGT-002` | REQ-WIDGET-02 | Widget responsive layout rendering | HTML test page | Open page on 375px mobile viewport | Widget expands to full-screen mobile layout cleanly | NOT RUN |
| `TEST-AI-001` | REQ-AI-01 | SSE chat message streaming | Active session | Call `POST /api/widget/message` with user text | Chunks stream back token-by-token over HTTP/2 SSE | NOT RUN |
| `TEST-AI-002` | REQ-AI-02 | Grounded answer generation | Knowledge uploaded | Ask question answered specifically in uploaded PDF | AI answers accurately citing facts from PDF | NOT RUN |
| `TEST-AI-003` | REQ-AI-03 | Conversational lead capture tool call | Active chat | Visitor states: *"My name is Sarah, email sarah@example.com"* | LLM executes `create_lead` tool call; lead record created in DB; lead micro-badge rendered | NOT RUN |
| `TEST-AI-006` | REQ-AI-06 | Honest fallback behavior | Active chat | Visitor asks question completely absent from knowledge base | AI politely states lack of knowledge and offers human contact; zero hallucination | NOT RUN |
| `TEST-WGT-005` | REQ-WIDGET-05 | WCAG 2.1 AA accessibility audit | Widget rendered | Run axe-core accessibility audit on shadow DOM | Zero critical/serious WCAG violations; keyboard tab order intact | NOT RUN |
