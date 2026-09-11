# Milestone 04 Test Plan & Verification Matrix

**Milestone:** `M4 - Operator Dashboard, Inbox, Leads CRM & Analytics`  
**Status:** Executed & Validated (All Tests PASSED)  
**Execution Timestamp:** 2026-09-12 00:26:06 UTC  

---

## 1. Requirement-Level Verification Register

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-CONV-001` | REQ-CONV-01 | Conversation list search & filter | Conversations in DB | Call `GET /api/v1/conversations/?search=pricing&status=active` | Returns matching conversations with total count and paging metadata | **PASSED** |
| `TEST-CONV-002` | REQ-CONV-02 | Thread detail viewing | Active conversation | Call `GET /api/v1/conversations/{id}` | Returns thread with chronological message objects, tokens, and timestamps | **PASSED** |
| `TEST-LEAD-001` | REQ-LEAD-01 | Lead profile detail | Lead captured | Call `GET /api/v1/leads/{id}` | Returns lead contact details, status, and linked conversation ID | **PASSED** |
| `TEST-LEAD-002` | REQ-LEAD-02 | Lead pipeline list & search | Leads exist | Call `GET /api/v1/leads/?status=qualified&search=Jane` | Returns filtered lead items matching criteria | **PASSED** |
| `TEST-LEAD-003` | REQ-LEAD-03 | Lead CSV export | Leads exist | Call `GET /api/v1/leads/export` | Returns HTTP 200 with `text/csv` header and RFC 4180 formatted CSV data | **PASSED** |
| `TEST-ANA-001` | REQ-ANALYTICS-01 | Executive overview metrics | Conversations & leads in DB | Call `GET /api/v1/analytics/overview` | Returns total conversations, leads, conversion %, tokens, and cost | **PASSED** |
| `TEST-ANA-005` | REQ-ANALYTICS-05 | AI token cost calculation & accounting | AI usage records in DB | Call `GET /api/v1/analytics/usage` | Returns model breakdown (prompt, completion, cost) and daily trend | **PASSED** |

---

## 2. Automated Test Execution Evidence

```
rootdir: E:\webverse files\antigravity\chat-agent
collected 47 items

backend/tests/test_analytics_api.py::test_analytics_overview_unauthorized PASSED [  2%]
backend/tests/test_analytics_api.py::test_analytics_overview_with_metrics PASSED [  4%]
backend/tests/test_analytics_api.py::test_ai_usage_breakdown_endpoint PASSED [  6%]
backend/tests/test_analytics_api.py::test_record_ai_usage_service PASSED [  8%]
backend/tests/test_api_endpoints.py::test_health_check_endpoint PASSED   [ 10%]
backend/tests/test_api_endpoints.py::test_api_v1_health_endpoint PASSED  [ 12%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_protected_route PASSED [ 14%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_chatbots_route PASSED [ 17%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_knowledge_sources PASSED [ 19%]
backend/tests/test_api_endpoints.py::test_public_widget_config_not_found PASSED [ 21%]
backend/tests/test_api_endpoints.py::test_invalid_bearer_token PASSED    [ 23%]
backend/tests/test_chatbots.py::test_chatbot_model_instantiation PASSED  [ 25%]
backend/tests/test_chatbots.py::test_public_widget_config_schema PASSED  [ 27%]
backend/tests/test_chatbots.py::test_chatbot_update_schema PASSED        [ 29%]
backend/tests/test_chunking.py::test_clean_text_formatting PASSED        [ 31%]
backend/tests/test_chunking.py::test_short_text_single_chunk PASSED      [ 34%]
backend/tests/test_chunking.py::test_long_text_recursive_splitting_with_overlap PASSED [ 36%]
backend/tests/test_chunking.py::test_empty_and_whitespace_chunking PASSED [ 38%]
backend/tests/test_conversations_api.py::test_list_conversations_unauthorized PASSED [ 40%]
backend/tests/test_conversations_api.py::test_list_conversations_with_mock_db PASSED [ 42%]
backend/tests/test_conversations_api.py::test_get_conversation_thread_with_messages PASSED [ 44%]
backend/tests/test_conversations_api.py::test_update_conversation_status PASSED [ 46%]
backend/tests/test_embedding_and_search.py::test_embedding_vector_dimensions PASSED [ 48%]
backend/tests/test_embedding_and_search.py::test_cosine_similarity_identical_and_different PASSED [ 51%]
backend/tests/test_embedding_and_search.py::test_semantic_ranking PASSED [ 53%]
backend/tests/test_knowledge_pipeline.py::test_business_info_faq_creation PASSED [ 55%]
backend/tests/test_knowledge_pipeline.py::test_text_extraction_from_plain_text PASSED [ 57%]
backend/tests/test_knowledge_pipeline.py::test_knowledge_source_read_schema PASSED [ 59%]
backend/tests/test_leads_api.py::test_list_leads_unauthorized PASSED     [ 61%]
backend/tests/test_leads_api.py::test_list_leads_with_filter PASSED      [ 63%]
backend/tests/test_leads_api.py::test_get_single_lead PASSED             [ 65%]
backend/tests/test_leads_api.py::test_update_lead_status_and_notes PASSED [ 68%]
backend/tests/test_leads_api.py::test_export_leads_csv_streaming PASSED  [ 70%]
backend/tests/test_rag_and_llm.py::test_mock_llm_provider_streaming_deltas PASSED [ 72%]
backend/tests/test_rag_and_llm.py::test_mock_llm_lead_capture_tool_call PASSED [ 74%]
backend/tests/test_rag_and_llm.py::test_mock_llm_honest_fallback PASSED  [ 76%]
backend/tests/test_rag_and_llm.py::test_rag_system_prompt_builder PASSED [ 78%]
backend/tests/test_security.py::test_argon2id_password_hashing PASSED    [ 80%]
backend/tests/test_security.py::test_jwt_access_token_creation_and_claims PASSED [ 82%]
backend/tests/test_security.py::test_jwt_refresh_token_creation PASSED   [ 85%]
backend/tests/test_security.py::test_invalid_or_tampered_jwt_token PASSED [ 87%]
backend/tests/test_tenant_isolation.py::test_rbac_require_role_owner_allowed PASSED [ 89%]
backend/tests/test_tenant_isolation.py::test_rbac_require_role_viewer_denied PASSED [ 91%]
backend/tests/test_tenant_isolation.py::test_tenant_data_isolation_filter PASSED [ 93%]
backend/tests/test_widget_api.py::test_widget_config_endpoint_success PASSED [ 95%]
backend/tests/test_widget_api.py::test_widget_session_endpoint_success PASSED [ 97%]
backend/tests/test_widget_api.py::test_widget_message_streaming_sse PASSED [100%]

======================= 47 passed, 3 warnings in 3.53s ========================
```
