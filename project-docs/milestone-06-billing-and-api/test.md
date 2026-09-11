# Milestone 06 Test Plan & Verification Matrix

**Milestone:** `M6 - Billing, Webhooks & Public REST API`  
**Phase:** Phase 2 (Full Platform)  
**Status:** ✅ Passed (100% Pass Rate)  
**Test Runner:** `pytest 8.3.4` (Python 3.12 / 3.14)  
**Execution Timestamp:** September 2026  

---

## 1. Traceability Test Register

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-BIL-001` | REQ-BILLING-01 | Create Stripe Checkout Session | Org on Free plan | Call `POST /api/v1/billing/checkout` for Starter plan | Returns Stripe Checkout URL; session contains `organization_id` metadata | **PASSED** |
| `TEST-BIL-002` | REQ-BILLING-02 | Payment Gateway Abstraction | Mock Stripe Adapter | Test checkout session & customer portal creation | Clean URL generation without external network blocking | **PASSED** |
| `TEST-BIL-003` | REQ-BILLING-03 | Idempotent webhook processing | Stripe webhook configured | Send duplicate `customer.subscription.created` mock webhooks | First call updates tenant plan to `starter`; second call returns `already_processed` with zero duplicate mutations | **PASSED** |
| `TEST-BIL-004` | REQ-BILLING-04 | Billing Portal & Invoicing | Active subscription | Call `POST /api/v1/billing/portal` | Generates valid Stripe portal session URL | **PASSED** |
| `TEST-INT-002` | REQ-INT-02 | Outbound HMAC webhook delivery | Tenant webhook configured | Trigger lead creation / HMAC computation | Payload includes HMAC-SHA256 signature matching secret | **PASSED** |
| `TEST-INT-003` | REQ-INT-03 | Public REST API key auth & query | API key generated | Call `GET /api/v1/public/leads` with `X-API-Key: cba_live_...` | Returns HTTP 200 with tenant lead records; invalid key returns HTTP 401 | **PASSED** |
| `TEST-ANA-002` | REQ-ANALYTICS-02 | Conversation Volume & Heatmaps | Tenant authenticated | Call `GET /api/v1/analytics/heatmaps` | Returns 7x24 weekday/hour distribution matrix | **PASSED** |
| `TEST-ANA-003` | REQ-ANALYTICS-03 | Lead Conversion Funnels | Tenant authenticated | Call `GET /api/v1/analytics/funnel` | Returns visitor-to-lead-to-appointment conversion rates | **PASSED** |
| `TEST-ANA-004` | REQ-ANALYTICS-04 | Unanswered Question Logs & Gaps | Tenant authenticated | Call `GET /api/v1/analytics/gaps` | Returns categorized list of unanswered inquiries with frequency counts | **PASSED** |

---

## 2. Test Execution Log (74/74 Passed)

```
collected 74 items

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
backend/tests/test_tenant_isolation.py::test_rbac_require_role_owner_allowed PASSED
backend/tests/test_tenant_isolation.py::test_rbac_require_role_viewer_denied PASSED
backend/tests/test_tenant_isolation.py::test_tenant_data_isolation_filter PASSED
backend/tests/test_vault.py::test_vault_encrypt_and_decrypt PASSED
backend/tests/test_vault.py::test_vault_tampered_payload_rejection PASSED
backend/tests/test_vault.py::test_vault_custom_key_support PASSED
backend/tests/test_widget_api.py::test_widget_config_endpoint_success PASSED
backend/tests/test_widget_api.py::test_widget_session_endpoint_success PASSED
backend/tests/test_widget_api.py::test_widget_message_streaming_sse PASSED

======================= 74 passed, 3 warnings in 3.82s ========================
```
