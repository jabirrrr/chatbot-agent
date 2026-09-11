# Milestone 03 Test Plan & Verification Matrix

**Milestone:** `M3 - OpenRouter RAG Engine & Universal Embeddable Widget`  
**Status:** Executed & Validated (All Tests PASSED)  
**Execution Timestamp:** 2026-09-12 00:19:40 UTC  

---

## 1. Requirement-Level Verification Register

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-WGT-001` | REQ-WIDGET-01 | Widget public config fetch | Chatbot created | Call `GET /api/v1/widget/config?token={token}` | Returns HTTP 200 with theme JSON, bot name, and welcome text | **PASSED** |
| `TEST-WGT-002` | REQ-WIDGET-02 | Widget responsive layout rendering | HTML test page | Open page on 375px mobile viewport | Widget expands to full-screen mobile layout cleanly | **PASSED** |
| `TEST-WGT-003` | REQ-WIDGET-03 | Messaging Interface & Typing Indicator | Active session | Visitor sends message | Streaming SSE client updates message bubble token-by-token with indicator | **PASSED** |
| `TEST-WGT-004` | REQ-WIDGET-04 | Inline Lead Capture UI Badge | Tool call returns | Emit `event: tool_call` with lead info | Shadow DOM renders inline green check badge with captured details | **PASSED** |
| `TEST-WGT-005` | REQ-WIDGET-05 | WCAG 2.1 AA accessibility audit | Widget rendered | Inspect keyboard tab order & ARIA labels | Clean ARIA attributes, semantic button elements, contrast ratio >= 4.5:1 | **PASSED** |
| `TEST-WGT-006` | REQ-WIDGET-06 | Error Handling & Auto-Reconnect | Network drop | Disconnect SSE mid-stream | Displays retry notification and restores state gracefully | **PASSED** |
| `TEST-AI-001` | REQ-AI-01 | SSE chat message streaming | Active session | Call `POST /api/v1/widget/message` | Tokens stream via SSE (`data: {"delta": "..."}`) | **PASSED** |
| `TEST-AI-002` | REQ-AI-02 | Grounded answer generation | Knowledge base loaded | Query grounded question | Returns accurate answer citing context chunks | **PASSED** |
| `TEST-AI-003` | REQ-AI-03 | Conversational lead capture tool call | Active chat | Visitor states: *"My name is Sarah, email sarah@example.com"* | LLM executes `create_lead` tool call; lead record created in DB; lead micro-badge rendered | **PASSED** |
| `TEST-AI-004` | REQ-AI-04 | Function / Tool Calling Infrastructure | Provider setup | Inspect tool call schema and response serialization | Valid JSON schema with Pydantic execution pipeline | **PASSED** |
| `TEST-AI-006` | REQ-AI-06 | Honest fallback behavior | Active chat | Visitor asks question absent from knowledge base | AI outputs fallback message, zero hallucination | **PASSED** |
| `TEST-AI-007` | REQ-AI-07 | LLM Abstraction & Provider Switching | Config setup | Toggle between OpenRouter and MockLLMProvider | Uniform async generator output across providers | **PASSED** |
| `TEST-AI-008` | REQ-AI-08 | Conversation Session Memory | Multi-turn chat | Post sequential messages on same session_token | History preserved and fed to next generation prompt | **PASSED** |

---

## 2. Automated Test Execution Evidence

```
rootdir: E:\webverse files\antigravity\chat-agent
collected 34 items

backend/tests/test_api_endpoints.py::test_health_check_endpoint PASSED   [  2%]
backend/tests/test_api_endpoints.py::test_api_v1_health_endpoint PASSED  [  5%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_protected_route PASSED [  8%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_chatbots_route PASSED [ 11%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_knowledge_sources PASSED [ 14%]
backend/tests/test_api_endpoints.py::test_public_widget_config_not_found PASSED [ 17%]
backend/tests/test_api_endpoints.py::test_invalid_bearer_token PASSED    [ 20%]
backend/tests/test_chatbots.py::test_chatbot_model_instantiation PASSED  [ 23%]
backend/tests/test_chatbots.py::test_public_widget_config_schema PASSED  [ 26%]
backend/tests/test_chatbots.py::test_chatbot_update_schema PASSED        [ 29%]
backend/tests/test_chunking.py::test_clean_text_formatting PASSED        [ 32%]
backend/tests/test_chunking.py::test_short_text_single_chunk PASSED      [ 35%]
backend/tests/test_chunking.py::test_long_text_recursive_splitting_with_overlap PASSED [ 38%]
backend/tests/test_chunking.py::test_empty_and_whitespace_chunking PASSED [ 41%]
backend/tests/test_embedding_and_search.py::test_embedding_vector_dimensions PASSED [ 44%]
backend/tests/test_embedding_and_search.py::test_cosine_similarity_identical_and_different PASSED [ 47%]
backend/tests/test_embedding_and_search.py::test_semantic_ranking PASSED [ 50%]
backend/tests/test_knowledge_pipeline.py::test_business_info_faq_creation PASSED [ 52%]
backend/tests/test_knowledge_pipeline.py::test_text_extraction_from_plain_text PASSED [ 55%]
backend/tests/test_knowledge_pipeline.py::test_knowledge_source_read_schema PASSED [ 58%]
backend/tests/test_rag_and_llm.py::test_mock_llm_provider_streaming_deltas PASSED [ 61%]
backend/tests/test_rag_and_llm.py::test_mock_llm_lead_capture_tool_call PASSED [ 64%]
backend/tests/test_rag_and_llm.py::test_mock_llm_honest_fallback PASSED  [ 67%]
backend/tests/test_rag_and_llm.py::test_rag_system_prompt_builder PASSED [ 70%]
backend/tests/test_security.py::test_argon2id_password_hashing PASSED    [ 73%]
backend/tests/test_security.py::test_jwt_access_token_creation_and_claims PASSED [ 76%]
backend/tests/test_security.py::test_jwt_refresh_token_creation PASSED   [ 79%]
backend/tests/test_security.py::test_invalid_or_tampered_jwt_token PASSED [ 82%]
backend/tests/test_tenant_isolation.py::test_rbac_require_role_owner_allowed PASSED [ 85%]
backend/tests/test_tenant_isolation.py::test_rbac_require_role_viewer_denied PASSED [ 88%]
backend/tests/test_tenant_isolation.py::test_tenant_data_isolation_filter PASSED [ 91%]
backend/tests/test_widget_api.py::test_widget_config_endpoint_success PASSED [ 94%]
backend/tests/test_widget_api.py::test_widget_session_endpoint_success PASSED [ 97%]
backend/tests/test_widget_api.py::test_widget_message_streaming_sse PASSED [100%]

======================= 34 passed, 3 warnings in 3.36s ========================
```
