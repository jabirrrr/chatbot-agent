# Milestone 07 Test Plan & Verification Matrix

**Milestone:** `M7 - Security Audit, RLS Penetration Testing & Load Testing`  
**Phase:** Phase 3 (Beta Hardening & Validation)  
**Status:** ✅ Passed (100% Pass Rate)  
**Test Suite:** 85/85 Passing Tests  
**Execution Timestamp:** September 2026  

---

## 1. Test Verification Register

| Test ID | Area | Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TEST-SEC-001` | Headers | HTTP Security Headers injection on API endpoints | Injects CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | **PASSED** |
| `TEST-SEC-002` | Headers | Widget endpoints iframe embedding allowance | CSP specifies `frame-ancestors *` and `X-Frame-Options: ALLOWALL` | **PASSED** |
| `TEST-SEC-003` | Rate Limiting | Sliding window rate limiting on auth endpoints | Requests past 15/min threshold return HTTP 429 with `Retry-After` header | **PASSED** |
| `TEST-SEC-004` | IDOR | Tenant context spoofing via `X-Organization-Id` | Forged header returns HTTP 403 Forbidden with unprivileged access error | **PASSED** |
| `TEST-SEC-005` | IDOR | Cross-tenant chatbot entity query | Querying another organization's chatbot returns HTTP 404 Not Found | **PASSED** |
| `TEST-SEC-006` | IDOR | Cross-tenant lead entity query | Querying another organization's lead returns HTTP 404 Not Found | **PASSED** |
| `TEST-SEC-007` | Public API | Tenant isolation under API key authentication | Querying public leads endpoint returns strictly records owned by key's tenant | **PASSED** |
| `TEST-SEC-008` | SQL Injection | Resilience against search query SQLi payloads | Query parameters properly parameterized; returns clean empty list, zero 500s | **PASSED** |
| `TEST-SEC-009` | JWT | Forged secret and tampered claim rejection | Tokens with untrusted signatures or invalid structure return HTTP 401 | **PASSED** |
| `TEST-LOAD-001` | Concurrency | 50 concurrent client requests P95 latency SLA | 100% requests succeed with HTTP 200; P95 latency strictly < 2,000ms SLA | **PASSED** |
| `TEST-LOAD-002` | Concurrency | 20 parallel widget session creations | All 20 sessions generated with unique, non-colliding UUID session tokens | **PASSED** |

---

## 2. Test Execution Summary (85/85 Passed)

```
collected 85 items

backend/tests/test_analytics_api.py::test_analytics_overview_unauthorized PASSED
backend/tests/test_analytics_api.py::test_analytics_overview_with_metrics PASSED
backend/tests/test_analytics_api.py::test_ai_usage_breakdown_endpoint PASSED
backend/tests/test_analytics_api.py::test_record_ai_usage_service PASSED
backend/tests/test_api_endpoints.py::test_health_check_endpoint PASSED
backend/tests/test_api_endpoints.py::test_api_v1_health_endpoint PASSED
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_protected_route PASSED
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_chatbots_route PASSED
backend/tests/test_api_endpoints.py::test_unauthorized_access_to_knowledge_sources PASSED
backend/tests/test_api_endpoints.py::test_public_widget_config_not_found PASSED
backend/tests/test_api_endpoints.py::test_invalid_bearer_token PASSED
backend/tests/test_appointments_api.py::test_list_appointments_unauthorized PASSED
backend/tests/test_appointments_api.py::test_list_appointments_with_mock_db PASSED
backend/tests/test_appointments_api.py::test_create_appointment_booking PASSED
backend/tests/test_appointments_api.py::test_cancel_appointment PASSED
backend/tests/test_billing_and_webhooks.py::test_get_subscription_defaults_to_free PASSED
backend/tests/test_billing_and_webhooks.py::test_create_checkout_session PASSED
backend/tests/test_billing_and_webhooks.py::test_create_portal_session PASSED
backend/tests/test_billing_and_webhooks.py::test_stripe_webhook_signature_and_idempotency PASSED
backend/tests/test_billing_and_webhooks.py::test_outbound_webhook_hmac_computation PASSED
backend/tests/test_calendar_adapter.py::test_mock_calendar_slots_generation PASSED
backend/tests/test_calendar_adapter.py::test_mock_calendar_successful_booking PASSED
backend/tests/test_calendar_adapter.py::test_mock_calendar_failure_and_graceful_degradation PASSED
backend/tests/test_chatbots.py::test_chatbot_model_instantiation PASSED
backend/tests/test_chatbots.py::test_public_widget_config_schema PASSED
backend/tests/test_chatbots.py::test_chatbot_update_schema PASSED
backend/tests/test_chunking.py::test_clean_text_formatting PASSED
backend/tests/test_chunking.py::test_short_text_single_chunk PASSED
backend/tests/test_chunking.py::test_long_text_recursive_splitting_with_overlap PASSED
backend/tests/test_chunking.py::test_empty_and_whitespace_chunking PASSED
backend/tests/test_conversations_api.py::test_list_conversations_unauthorized PASSED
backend/tests/test_conversations_api.py::test_list_conversations_with_mock_db PASSED
backend/tests/test_conversations_api.py::test_get_conversation_thread_with_messages PASSED
backend/tests/test_conversations_api.py::test_update_conversation_status PASSED
backend/tests/test_deep_analytics.py::test_analytics_heatmaps_matrix PASSED
backend/tests/test_deep_analytics.py::test_analytics_conversion_funnel PASSED
backend/tests/test_deep_analytics.py::test_analytics_knowledge_gaps PASSED
backend/tests/test_embedding_and_search.py::test_embedding_vector_dimensions PASSED
backend/tests/test_embedding_and_search.py::test_cosine_similarity_identical_and_different PASSED
backend/tests/test_embedding_and_search.py::test_semantic_ranking PASSED
backend/tests/test_handoff_and_ws.py::test_request_handoff_endpoint PASSED
backend/tests/test_handoff_and_ws.py::test_operator_takeover_endpoint PASSED
backend/tests/test_handoff_and_ws.py::test_operator_reply_endpoint PASSED
backend/tests/test_handoff_and_ws.py::test_websocket_connection_and_ping PASSED
backend/tests/test_knowledge_pipeline.py::test_business_info_faq_creation PASSED
backend/tests/test_knowledge_pipeline.py::test_text_extraction_from_plain_text PASSED
backend/tests/test_knowledge_pipeline.py::test_knowledge_source_read_schema PASSED
backend/tests/test_leads_api.py::test_list_leads_unauthorized PASSED
backend/tests/test_leads_api.py::test_list_leads_with_filter PASSED
backend/tests/test_leads_api.py::test_get_single_lead PASSED
backend/tests/test_leads_api.py::test_update_lead_status_and_notes PASSED
backend/tests/test_leads_api.py::test_export_leads_csv_streaming PASSED
backend/tests/test_load_and_concurrency.py::test_50_concurrent_requests_p95_latency PASSED
backend/tests/test_load_and_concurrency.py::test_concurrent_sse_session_creation PASSED
backend/tests/test_public_api.py::test_public_api_key_pair_generation PASSED
backend/tests/test_public_api.py::test_public_api_missing_key_header_unauthorized PASSED
backend/tests/test_public_api.py::test_public_api_list_leads_with_valid_key PASSED
backend/tests/test_public_api.py::test_public_api_create_lead_with_valid_key PASSED
backend/tests/test_public_api.py::test_public_api_list_conversations_with_valid_key PASSED
backend/tests/test_rag_and_llm.py::test_mock_llm_provider_streaming_deltas PASSED
backend/tests/test_rag_and_llm.py::test_mock_llm_lead_capture_tool_call PASSED
backend/tests/test_rag_and_llm.py::test_mock_llm_honest_fallback PASSED
backend/tests/test_rag_and_llm.py::test_rag_system_prompt_builder PASSED
backend/tests/test_security.py::test_argon2id_password_hashing PASSED
backend/tests/test_security.py::test_jwt_access_token_creation_and_claims PASSED
backend/tests/test_security.py::test_jwt_refresh_token_creation PASSED
backend/tests/test_security.py::test_invalid_or_tampered_jwt_token PASSED
backend/tests/test_security_pentest.py::test_security_headers_present PASSED
backend/tests/test_security_pentest.py::test_widget_security_headers_allow_embedding PASSED
backend/tests/test_security_pentest.py::test_rate_limiter_throttles_auth_endpoints PASSED
backend/tests/test_security_pentest.py::test_cross_tenant_header_spoofing_forbidden PASSED
backend/tests/test_security_pentest.py::test_cross_tenant_idor_chatbot_access PASSED
backend/tests/test_security_pentest.py::test_cross_tenant_idor_lead_access PASSED
backend/tests/test_security_pentest.py::test_cross_tenant_idor_public_api_isolation PASSED
backend/tests/test_security_pentest.py::test_sql_injection_resilience PASSED
backend/tests/test_security_pentest.py::test_forged_and_tampered_jwt_rejected PASSED
backend/tests/test_tenant_isolation.py::test_rbac_require_role_owner_allowed PASSED
backend/tests/test_tenant_isolation.py::test_rbac_require_role_viewer_denied PASSED
backend/tests/test_tenant_isolation.py::test_tenant_data_isolation_filter PASSED
backend/tests/test_vault.py::test_vault_encrypt_and_decrypt PASSED
backend/tests/test_vault.py::test_vault_tampered_payload_rejection PASSED
backend/tests/test_vault.py::test_vault_custom_key_support PASSED
backend/tests/test_widget_api.py::test_widget_config_endpoint_success PASSED
backend/tests/test_widget_api.py::test_widget_session_endpoint_success PASSED
backend/tests/test_widget_api.py::test_widget_message_streaming_sse PASSED

======================= 85 passed, 3 warnings in 4.23s ========================
```
