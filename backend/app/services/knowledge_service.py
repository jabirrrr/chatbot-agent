import io
import uuid
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException, status
from pypdf import PdfReader

from app.models.knowledge import KnowledgeSource, DocumentChunk, BusinessInfo
from app.schemas.knowledge import KnowledgeSourceCreateText, BusinessInfoCreate
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.adapters.storage import storage_adapter


class KnowledgeService:
    """
    Orchestrates knowledge ingestion, document parsing, chunking,
    vector embedding, and semantic similarity retrieval.
    """

    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extracts plain text from PDF document using pypdf."""
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    @staticmethod
    def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
        """Parses file bytes according to file extension."""
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            return KnowledgeService.extract_text_from_pdf(file_bytes)
        elif ext in ["txt", "md", "csv", "json"]:
            return file_bytes.decode("utf-8", errors="replace")
        else:
            # Attempt utf-8 decoding
            return file_bytes.decode("utf-8", errors="replace")

    @classmethod
    async def create_text_source(
        cls,
        db: AsyncSession,
        org_id: uuid.UUID,
        data: KnowledgeSourceCreateText,
        chatbot_id: Optional[uuid.UUID] = None
    ) -> KnowledgeSource:
        """
        Creates a text article knowledge source, generates chunks and vector embeddings.
        """
        # 1. Create KnowledgeSource record
        source = KnowledgeSource(
            organization_id=org_id,
            title=data.title,
            source_type="text",
            status="processing",
            char_count=len(data.content)
        )
        db.add(source)
        await db.flush()

        try:
            # 2. Chunk text
            chunks_data = ChunkingService.split_text(data.content)
            source.chunk_count = len(chunks_data)

            # 3. Generate embeddings & create DocumentChunk records
            texts = [c["content"] for c in chunks_data]
            embeddings = await EmbeddingService.batch_generate_embeddings(texts)

            for chunk_meta, emb in zip(chunks_data, embeddings):
                chunk = DocumentChunk(
                    organization_id=org_id,
                    source_id=source.id,
                    chatbot_id=chatbot_id,
                    content=chunk_meta["content"],
                    chunk_index=chunk_meta["chunk_index"],
                    token_count=chunk_meta["token_count"],
                    embedding=emb
                )
                db.add(chunk)

            source.status = "ready"
            await db.commit()
            await db.refresh(source)
            return source

        except Exception as e:
            await db.rollback()
            source.status = "failed"
            source.error_message = str(e)
            db.add(source)
            await db.commit()
            await db.refresh(source)
            raise e

    @classmethod
    async def create_file_source(
        cls,
        db: AsyncSession,
        org_id: uuid.UUID,
        filename: str,
        file_bytes: bytes,
        mime_type: Optional[str] = None,
        chatbot_id: Optional[uuid.UUID] = None
    ) -> KnowledgeSource:
        """
        Uploads document to storage adapter, parses text, chunks, and indexes embeddings.
        """
        # Save file to multi-tenant storage
        stored_path = storage_adapter.upload_file(org_id, filename, file_bytes, mime_type)

        source = KnowledgeSource(
            organization_id=org_id,
            title=filename,
            source_type="file",
            status="processing",
            file_path=stored_path,
            file_size_bytes=len(file_bytes),
            mime_type=mime_type
        )
        db.add(source)
        await db.flush()

        try:
            # Extract text
            raw_text = cls.extract_text_from_file(file_bytes, filename)
            source.char_count = len(raw_text)

            # Split into semantic chunks
            chunks_data = ChunkingService.split_text(raw_text)
            source.chunk_count = len(chunks_data)

            # Batch compute vector embeddings
            texts = [c["content"] for c in chunks_data]
            embeddings = await EmbeddingService.batch_generate_embeddings(texts)

            for chunk_meta, emb in zip(chunks_data, embeddings):
                chunk = DocumentChunk(
                    organization_id=org_id,
                    source_id=source.id,
                    chatbot_id=chatbot_id,
                    content=chunk_meta["content"],
                    chunk_index=chunk_meta["chunk_index"],
                    token_count=chunk_meta["token_count"],
                    embedding=emb
                )
                db.add(chunk)

            source.status = "ready"
            await db.commit()
            await db.refresh(source)
            return source

        except Exception as e:
            await db.rollback()
            source.status = "failed"
            source.error_message = str(e)
            db.add(source)
            await db.commit()
            await db.refresh(source)
            raise e

    @classmethod
    async def reindex_source(
        cls,
        db: AsyncSession,
        org_id: uuid.UUID,
        source_id: uuid.UUID
    ) -> KnowledgeSource:
        """
        Deletes old chunks and re-processes source file or text.
        """
        stmt = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == org_id
        )
        result = await db.execute(stmt)
        source = result.scalar_one_or_none()
        if not source:
            raise HTTPException(status_code=404, detail="Knowledge source not found.")

        # Delete existing chunks
        del_stmt = delete(DocumentChunk).where(DocumentChunk.source_id == source.id)
        await db.execute(del_stmt)

        # Re-read content
        if source.source_type == "file" and source.file_path:
            file_bytes = storage_adapter.read_file(source.file_path)
            raw_text = cls.extract_text_from_file(file_bytes, source.title)
        else:
            raw_text = source.title  # Fallback

        chunks_data = ChunkingService.split_text(raw_text)
        source.chunk_count = len(chunks_data)

        texts = [c["content"] for c in chunks_data]
        embeddings = await EmbeddingService.batch_generate_embeddings(texts)

        for chunk_meta, emb in zip(chunks_data, embeddings):
            chunk = DocumentChunk(
                organization_id=org_id,
                source_id=source.id,
                content=chunk_meta["content"],
                chunk_index=chunk_meta["chunk_index"],
                token_count=chunk_meta["token_count"],
                embedding=emb
            )
            db.add(chunk)

        source.status = "ready"
        await db.commit()
        await db.refresh(source)
        return source

    @classmethod
    async def semantic_search(
        cls,
        db: AsyncSession,
        org_id: uuid.UUID,
        query: str,
        top_k: int = 4,
        chatbot_id: Optional[uuid.UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic cosine similarity search across tenant-scoped document chunks.
        """
        query_embedding = await EmbeddingService.generate_embedding(query)

        # Retrieve tenant chunks
        stmt = select(DocumentChunk).where(DocumentChunk.organization_id == org_id)
        if chatbot_id:
            stmt = stmt.where(
                (DocumentChunk.chatbot_id == chatbot_id) | (DocumentChunk.chatbot_id.is_(None))
            )

        result = await db.execute(stmt)
        chunks = list(result.scalars().all())

        scored_chunks: List[Tuple[float, DocumentChunk]] = []
        for chunk in chunks:
            if chunk.embedding is not None:
                # Convert chunk.embedding if pgvector Vector type to list of floats
                chunk_vec = list(chunk.embedding)
                sim = EmbeddingService.cosine_similarity(query_embedding, chunk_vec)
                scored_chunks.append((sim, chunk))

        # Sort descending by similarity
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        top_results = []
        for sim, chunk in scored_chunks[:top_k]:
            top_results.append({
                "chunk_id": chunk.id,
                "source_id": chunk.source_id,
                "content": chunk.content,
                "similarity_score": round(float(sim), 4)
            })

        return top_results
