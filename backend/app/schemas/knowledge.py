import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class KnowledgeSourceBase(BaseModel):
    title: str
    source_type: str = "text"


class KnowledgeSourceCreateText(BaseModel):
    title: str
    content: str


class KnowledgeSourceCreateUrl(BaseModel):
    url: str


class KnowledgeSourceRead(KnowledgeSourceBase):
    id: uuid.UUID
    organization_id: uuid.UUID
    status: str
    error_message: Optional[str] = None
    char_count: int
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkRead(BaseModel):
    id: uuid.UUID
    source_id: uuid.UUID
    chunk_index: int
    content: str
    token_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BusinessInfoCreate(BaseModel):
    category: str = "faq"  # 'faq', 'hours', 'contact', 'policy'
    question: Optional[str] = None
    answer: Optional[str] = None
    content: Optional[str] = None
    is_active: bool = True


class BusinessInfoRead(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    category: str
    question: Optional[str] = None
    answer: Optional[str] = None
    content: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 4
    chatbot_id: Optional[uuid.UUID] = None


class SemanticSearchResult(BaseModel):
    chunk_id: uuid.UUID
    source_id: uuid.UUID
    content: str
    similarity_score: float
