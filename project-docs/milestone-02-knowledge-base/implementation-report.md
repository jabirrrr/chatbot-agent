# Milestone 02 Implementation Report

**Milestone:** `M2 - Knowledge Ingestion Engine, Document Parsing & Vector Storage`  
**Status:** Completed & Validated (Green Gate PASSED)  
**Executed At:** 2026-09-11 23:57:00 UTC  

---

## 1. Summary of Work Delivered
- **Chatbot Management & Embed Infrastructure:**
  - `backend/app/models/chatbot.py`: `Chatbot` model with prompt configuration, temperature, active switch, and auto-generated secure embed token (`wgt_...`).
  - `backend/app/schemas/chatbot.py`: Complete Pydantic v2 schemas (`ChatbotCreate`, `ChatbotUpdate`, `ChatbotRead`, `PublicWidgetConfig`).
  - `backend/app/services/chatbot_service.py`: Service handling CRUD, embed token regeneration, and public config retrieval.
  - `backend/app/api/v1/chatbots.py`: Full REST API with tenant isolation, plus `/public/widget/{token}` public endpoint.
- **Knowledge Models & pgvector Integration:**
  - `backend/app/models/knowledge.py`:
    - `KnowledgeSource`: Document upload and article tracker with processing status (`pending`, `processing`, `ready`, `failed`).
    - `DocumentChunk`: Text chunk with `Vector(1536)` embedding matching OpenAI `text-embedding-3-small`.
    - `BusinessInfo`: Structured FAQs and operational metadata.
- **Multi-Tenant Storage Adapter:**
  - `backend/app/adapters/storage.py`: Storage adapter for document file management with tenant path scoping (`storage_uploads/{org_id}/...`).
- **Recursive Character Chunking Engine:**
  - `backend/app/services/chunking_service.py`: Recursive character chunking splitting on `\n\n`, `\n`, sentence and word boundaries, with sliding overlap (default 800 chars / 150 overlap) to preserve context continuity.
- **1536-Dimensional Vector Embedding & Search:**
  - `backend/app/services/embedding_service.py`: Normalization and cosine similarity calculations with deterministic offline fallback for continuous validation.
  - `backend/app/services/knowledge_service.py`: Text parsing (`pypdf` for PDF, UTF-8 for TXT/MD/CSV), chunking, batch vector embedding, and semantic vector retrieval.
- **REST Endpoints:**
  - `backend/app/api/v1/knowledge.py`:
    - `GET /sources`: List knowledge sources.
    - `POST /sources/text`: Add text articles.
    - `POST /sources/upload`: Multipart document upload.
    - `GET /sources/{id}` & `DELETE /sources/{id}`.
    - `POST /sources/{id}/reindex`: Re-chunking and re-embedding.
    - `GET /business-info` & `POST /business-info`: Structured FAQs.
    - `POST /search`: Semantic cosine similarity vector search.
- **Database Migrations:**
  - `backend/alembic/versions/002_knowledge_and_chatbots.py`: Adds tables for `chatbots`, `knowledge_sources`, `document_chunks`, and `business_info`.
- **Automated Test Suite:**
  - 23 unit and integration tests passing in 1.64s (100% pass rate).
