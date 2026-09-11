import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin


class KnowledgeSource(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents an ingested knowledge item: document upload (PDF, DOCX, TXT),
    manually written article, or external web scrape.
    """
    __tablename__ = "knowledge_sources"

    title = Column(String(255), nullable=False)
    source_type = Column(String(50), default="text", nullable=False)  # 'file', 'text', 'faq', 'website'
    status = Column(String(50), default="pending", nullable=False)   # 'pending', 'processing', 'ready', 'failed'
    error_message = Column(Text, nullable=True)

    # Storage reference for uploaded documents
    file_path = Column(String(1024), nullable=True)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    mime_type = Column(String(100), nullable=True)

    # Content stats
    char_count = Column(Integer, default=0, nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)
    metadata_json = Column(JSON, nullable=True)


class DocumentChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Represents a chunk of text extracted from a knowledge source with its 1536-dimensional
    vector embedding for semantic RAG search via pgvector.
    """
    __tablename__ = "document_chunks"

    source_id = Column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    chatbot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chatbots.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)

    # 1536 dimensions matching OpenAI text-embedding-3-small
    embedding = Column(Vector(1536), nullable=True)


class BusinessInfo(Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantMixin):
    """
    Structured SMB business intelligence: hours, location, contact, and high-priority FAQs.
    """
    __tablename__ = "business_info"

    category = Column(String(50), default="faq", nullable=False)  # 'faq', 'hours', 'contact', 'policy'
    question = Column(String(512), nullable=True)
    answer = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
