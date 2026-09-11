# Milestone 02 Test Plan & Verification Matrix

**Milestone:** `M2 - Knowledge Ingestion Engine, Document Parsing & Vector Storage`  
**Status:** Executed & Verified (100% Pass Rate)  
**Executed At:** 2026-09-11 23:58:00 UTC  

---

## 1. Test Cases Register

| Test ID | Requirement ID | Description | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TEST-BOT-001` | REQ-BOT-01 | Chatbot creation & unique widget token | Authenticated org | Instantiate Chatbot model / API | Token generated with `wgt_` prefix; default system prompt and temperature configured | **PASSED** |
| `TEST-BOT-002` | REQ-BOT-02 | Edit chatbot prompt instructions | Existing chatbot | Apply partial `ChatbotUpdate` payload | Prompt and parameters updated without overwriting unset values | **PASSED** |
| `TEST-BOT-003` | REQ-BOT-03 | Enable / disable chatbot switch | Existing chatbot | Set `is_active = False` | Chatbot deactivated; public config reflects status | **PASSED** |
| `TEST-KB-001` | REQ-KB-01 | Create business info FAQ | Authenticated org | Create BusinessInfo model / API | Record persisted with `faq` category and verified content | **PASSED** |
| `TEST-KB-002` | REQ-KB-02 | Ingest document text parsing | Storage adapter ready | Parse plain text / markdown bytes | Content extracted cleanly with zero data loss | **PASSED** |
| `TEST-KB-003` | REQ-KB-05 | Verify chunk count & token boundaries | Text ingested | Run recursive chunking with 120-char chunk size | Text split cleanly into multiple chunks with overlap | **PASSED** |
| `TEST-KB-004` | REQ-KB-05 | Vector cosine similarity query recall | Chunks indexed | Compute cosine similarity between query and relevant vs irrelevant docs | Relevant document yields higher cosine similarity score | **PASSED** |
| `TEST-KB-005` | REQ-KB-04 | Re-indexing knowledge source | Existing source | Call reindex service method | Old chunks removed; new chunks re-chunked and re-embedded | **PASSED** |

---

## 2. Automated Test Suite Output
```text
tests/test_api_endpoints.py::test_health_check_endpoint PASSED           [  4%]
tests/test_api_endpoints.py::test_api_v1_health_endpoint PASSED          [  8%]
tests/test_api_endpoints.py::test_unauthorized_access_to_protected_route PASSED [ 13%]
tests/test_api_endpoints.py::test_invalid_bearer_token PASSED            [ 17%]
tests/test_chatbots.py::test_chatbot_model_instantiation PASSED          [ 21%]
tests/test_chatbots.py::test_public_widget_config_schema PASSED          [ 26%]
tests/test_chatbots.py::test_chatbot_update_schema PASSED                [ 30%]
tests/test_chunking.py::test_clean_text_formatting PASSED                [ 34%]
tests/test_chunking.py::test_short_text_single_chunk PASSED              [ 39%]
tests/test_chunking.py::test_long_text_recursive_splitting_with_overlap PASSED [ 43%]
tests/test_embedding_and_search.py::test_embedding_vector_dimensions PASSED [ 47%]
tests/test_embedding_and_search.py::test_cosine_similarity_identical_and_different PASSED [ 52%]
tests/test_embedding_and_search.py::test_semantic_ranking PASSED         [ 56%]
tests/test_knowledge_pipeline.py::test_business_info_faq_creation PASSED [ 60%]
tests/test_knowledge_pipeline.py::test_text_extraction_from_plain_text PASSED [ 65%]
tests/test_knowledge_pipeline.py::test_knowledge_source_read_schema PASSED [ 69%]
tests/test_security.py::test_argon2id_password_hashing PASSED            [ 73%]
tests/test_security.py::test_jwt_access_token_creation_and_claims PASSED [ 78%]
tests/test_security.py::test_jwt_refresh_token_creation PASSED           [ 82%]
tests/test_security.py::test_invalid_or_tampered_jwt_token PASSED        [ 86%]
tests/test_tenant_isolation.py::test_rbac_require_role_owner_allowed PASSED [ 91%]
tests/test_tenant_isolation.py::test_rbac_require_role_viewer_denied PASSED [ 95%]
tests/test_tenant_isolation.py::test_tenant_data_isolation_filter PASSED [100%]

======================= 23 passed, 3 warnings in 1.64s ========================
```
