# Milestone 03 Issues & Technical Debt

**Milestone:** `M3 - OpenRouter Conversational RAG Engine & Embeddable Widget`  
**Status:** Clean (0 Open Issues / 0 Blockers)  
**Last Audited:** 2026-09-12 00:20:00 UTC  

---

## 1. Resolved Issues During Implementation

| Issue ID | Category | Description | Resolution | Status |
| :--- | :--- | :--- | :--- | :---: |
| `ISSUE-M3-001` | Testing | `app.dependency_overrides` bleed between test modules | Introduced `autouse=True` fixture in `conftest.py` ensuring teardown cleanup via `app.dependency_overrides.clear()` | **RESOLVED** |
| `ISSUE-M3-002` | RAG Guardrail | Avoiding hallucinations when vector search yields empty chunks | Explicit prompt rule instructing LLM to respond with `chatbot.fallback_message` when confidence/knowledge is zero | **RESOLVED** |
| `ISSUE-M3-003` | Widget CSS Isolation | Host site styles bleeding into widget inputs | Wrapped entire widget DOM inside an open Shadow DOM root (`element.attachShadow({ mode: 'open' })`) | **RESOLVED** |

---

## 2. Technical Debt Register
- None. Zero technical debt items accumulated in Milestone 03.
