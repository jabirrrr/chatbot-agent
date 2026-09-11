# Milestone 02: Knowledge Ingestion Engine, Document Parsing & Vector Storage

**Platform:** `chatbot-agent`  
**Phase:** Phase 1 (Core Product)  
**Milestone ID:** `M2`  
**Status:** Defined / Pending M1  

---

## 1. Milestone Goal
Build the end-to-end knowledge ingestion pipeline: upload documents (PDF, DOCX, TXT), store raw files in MinIO/S3, extract and chunk text recursively, generate vector embeddings via OpenAI, and store them in PostgreSQL with `pgvector` HNSW indexing.

---

## 2. Requirements Covered
- **REQ-BOT-01:** Create Chatbot & Generate Widget Token
- **REQ-BOT-02:** Edit Chatbot Configuration & Prompt Instructions
- **REQ-BOT-03:** Enable / Disable Chatbot Switch
- **REQ-KB-01:** Structured Business Info Entry (FAQs, Hours, Location)
- **REQ-KB-02:** Document Upload (PDF, DOCX, TXT) & Ingestion
- **REQ-KB-03:** Text Knowledge Article Management
- **REQ-KB-04:** Knowledge Source Status & Re-indexing
- **REQ-KB-05:** Text Chunking, Embeddings & Vector Storage (`pgvector`)

---

## 3. Implementation Tasks
1. **Document Storage Adapter (`app/adapters/storage/`):**
   - MinIO / S3 client uploading files into tenant-scoped prefixes (`{org_id}/sources/{source_id}`).
2. **Background Worker Task (`app/workers/knowledge_tasks.py`):**
   - Celery worker triggered upon file upload.
   - Text extraction using `pypdf`, `python-docx`, and plain text parsers.
   - Recursive character chunking (512 tokens / 50 overlap).
   - Batch embedding generation via OpenAI `text-embedding-3-small`.
   - Insertion into `knowledge_chunks` with `vector(1536)` embeddings.
3. **API Endpoints (`app/api/v1/knowledge/`):**
   - `POST /sources/upload` (multipart file upload).
   - `POST /sources/text` (direct text article).
   - `GET /sources` (source list with processing status: `processing`, `ready`, `failed`).
   - `POST /sources/{id}/reindex`.
