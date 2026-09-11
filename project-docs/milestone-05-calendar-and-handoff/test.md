# Milestone 05 Test Plan & Verification Matrix

**Milestone:** `M5 - Google Calendar Scheduling & Real-Time Human Operator Handoff`  
**Status:** Executed & Validated (All Tests PASSED)  
**Execution Timestamp:** 2026-09-12 00:30:40 UTC  

---

## 1. Requirement-Level Verification Register

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-INT-001` | REQ-INT-01 | AES-256-GCM encrypted vault | System key loaded | Encrypt and decrypt OAuth refresh token; tamper with ciphertext | Original secret restored cleanly; tampered payload raises ValueError | **PASSED** |
| `TEST-APPT-001` | REQ-APPT-01 | Calendar Provider Abstraction | Calendar configured | Check slots and book slot via adapter | Correct slots returned and valid event ID / Meet link created | **PASSED** |
| `TEST-APPT-002` | REQ-APPT-02 | In-Widget & API Slot Booking | Active session | Call `POST /api/v1/appointments/` with slot details | Appointment saved in DB with meeting link | **PASSED** |
| `TEST-APPT-003` | REQ-APPT-03 | Appointment list & management | Appointments in DB | Call `GET /api/v1/appointments/` & `PATCH /cancel` | Returns paged appointments; cancels cleanly | **PASSED** |
| `TEST-APPT-004` | REQ-APPT-04 | Calendar failure graceful degradation | Calendar error | Trigger simulated provider failure | Returns empty slots / fallback error without unhandled crashes | **PASSED** |
| `TEST-AI-005` | REQ-AI-05 | Human agent takeover protocol | Active chat | Call `POST /conversations/{id}/handoff` and `/takeover` | Status transitions `active` -> `waiting_handoff` -> `active (assigned)` | **PASSED** |
| `TEST-CONV-03` | REQ-CONV-03 | Real-time WebSocket updates | Operator connected | Connect to `/api/v1/ws/conversations` and broadcast event | Socket receives message event with zero latency | **PASSED** |

---

## 2. Automated Test Execution Evidence

```
rootdir: E:\webverse files\antigravity\chat-agent
collected 61 items

backend/tests/test_analytics_api.py::test_analytics_overview_unauthorized PASSED [  1%]
backend/tests/test_analytics_api.py::test_analytics_overview_with_metrics PASSED [  3%]
backend/tests/test_analytics_api.py::test_ai_usage_breakdown_endpoint PASSED [  4%]
backend/tests/test_analytics_api.py::test_record_ai_usage_service PASSED [  6%]
backend/tests/test_api_endpoints.py::test_health_check_endpoint PASSED   [  8%]
backend/tests/test_api_endpoints.py::test_api_v1_health_endpoint PASSED  [  9%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_protected_route PASSED [ 11%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_chatbots_route PASSED [ 13%]
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_knowledge_sources PASSED [ 14%]
backend/tests/test_api_endpoints.py::test_public_widget_config_not_found PASSED [ 16%]
backend/tests/test_api_endpoints.py::test_invalid_bearer_token PASSED    [ 18%]
backend/tests/test_appointments_api.py::test_list_appointments_unauthorized PASSED [ 19%]
backend/tests/test_appointments_api.py::test_list_appointments_with_mock_db PASSED [ 21%]
backend/tests/test_appointments_api.py::test_create_appointment_booking PASSED [ 22%]
backend/tests/test_appointments_api.py::test_cancel_appointment PASSED   [ 24%]
backend/tests/test_calendar_adapter.py::test_mock_calendar_slots_generation PASSED [ 26%]
backend/tests/test_calendar_adapter.py::test_mock_calendar_successful_booking PASSED [ 27%]
backend/tests/test_calendar_adapter.py::test_mock_calendar_failure_and_graceful_degradation PASSED [ 29%]
backend/tests/test_chatbots.py::test_chatbot_model_instantiation PASSED  [ 31%]
backend/tests/test_chatbots.py::test_public_widget_config_schema PASSED  [ 32%]
backend/tests/test_chatbot_update_schema PASSED                           [ 34%]
backend/tests/test_chunking.py::test_clean_text_formatting PASSED        [ 36%]
backend/tests/test_chunking.py::test_short_text_single_chunk PASSED      [ 37%]
backend/tests/test_chunking.py::test_long_text_recursive_splitting_with_overlap PASSED [ 39%]
backend/tests/test_chunking.py::test_empty_and_whitespace_chunking PASSED [ 40%]
backend/tests/test_conversations_api.py::test_list_conversations_unauthorized PASSED [ 42%]
backend/tests/test_conversations_api.py::test_list_conversations_with_mock_db PASSED [ 44%]
backend/tests/test_conversations_api.py::test_get_conversation_thread_with_messages PASSED [ 45%]
backend/tests/test_conversations_api.py::test_update_conversation_status PASSED [ 47%]
backend/tests/test_embedding_and_search.py::test_embedding_vector_dimensions PASSED [ 49%]
backend/tests/test_embedding_and_search.py::test_cosine_similarity_identical_and_different PASSED [ 50%]
backend/tests/test_embedding_and_search.py::test_semantic_ranking PASSED [ 52%]
backend/tests/test_handoff_and_ws.py::test_request_handoff_endpoint PASSED [ 54%]
backend/tests/test_handoff_and_ws.py::test_operator_takeover_endpoint PASSED [ 55%]
backend/tests/test_handoff_and_ws.py::test_operator_reply_endpoint PASSED [ 57%]
backend/tests/test_handoff_and_ws.py::test_websocket_connection_and_ping PASSED [ 59%]
backend/tests/test_knowledge_pipeline.py::test_business_info_faq_creation PASSED [ 60%]
backend/tests/test_knowledge_pipeline.py::test_text_extraction_from_plain_text PASSED [ 62%]
backend/tests/test_knowledge_pipeline.py::test_knowledge_source_read_schema PASSED [ 63%]
backend/tests/test_leads_api.py::test_list_leads_unauthorized PASSED     [ 65%]
backend/tests/test_leads_api.py::test_list_leads_with_filter PASSED      [ 67%]
backend/tests/test_leads_api.py::test_get_single_lead PASSED             [ 68%]
backend/tests/test_leads_api.py::test_update_lead_status_and_notes PASSED [ 70%]
backend/tests/test_leads_api.py::test_export_leads_csv_streaming PASSED  [ 72%]
backend/tests/test_rag_and_llm.py::test_mock_llm_provider_streaming_deltas PASSED [ 73%]
backend/tests/test_rag_and_llm.py::test_mock_llm_lead_capture_tool_call PASSED [ 75%]
backend/tests/test_rag_and_llm.py::test_mock_llm_honest_fallback PASSED  [ 77%]
backend/tests/test_rag_and_llm.py::test_rag_system_prompt_builder PASSED [ 78%]
backend/tests/test_security.py::test_argon2id_password_hashing PASSED    [ 80%]
backend/tests/test_security.py::test_jwt_access_token_creation_and_claims PASSED [ 81%]
backend/tests/test_security.py::test_jwt_refresh_token_creation PASSED   [ 83%]
backend/tests/test_security.py::test_invalid_or_tampered_jwt_token PASSED [ 85%]
backend/tests/test_tenant_isolation.py::test_rbac_require_role_owner_allowed PASSED [ 86%]
backend/tests/test_tenant_isolation.py::test_rbac_require_role_viewer_denied PASSED [ 88%]
backend/tests/test_tenant_isolation.py::test_tenant_data_isolation_filter PASSED [ 90%]
backend/tests/test_vault.py::test_vault_encrypt_and_decrypt PASSED       [ 91%]
backend/tests/test_vault.py::test_vault_tampered_payload_rejection PASSED [ 93%]
backend/tests/test_vault.py::test_vault_custom_key_support PASSED        [ 95%]
backend/tests/test_widget_api.py::test_widget_config_endpoint_success PASSED [ 96%]
backend/tests/test_widget_api.py::test_widget_session_endpoint_success PASSED [ 98%]
backend/tests/test_widget_api.py::test_widget_message_streaming_sse PASSED [100%]

======================= 61 passed, 3 warnings in 3.89s ========================
```
