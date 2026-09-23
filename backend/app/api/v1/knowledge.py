import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.knowledge import KnowledgeSource, BusinessInfo
from app.schemas.knowledge import (
    KnowledgeSourceRead,
    KnowledgeSourceCreateText,
    BusinessInfoCreate,
    BusinessInfoRead,
    SemanticSearchRequest,
    SemanticSearchResult,
    KnowledgeSourceCreateUrl
)
from app.services.knowledge_service import KnowledgeService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])


@router.get(
    "/sources",
    response_model=List[KnowledgeSourceRead],
    summary="List organization knowledge sources"
)
async def list_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Returns all ingested knowledge sources for the active organization.
    """
    stmt = (
        select(KnowledgeSource)
        .where(KnowledgeSource.organization_id == org.id)
        .order_by(KnowledgeSource.created_at.desc())
    )
    result = await db.execute(stmt)
    sources = list(result.scalars().all())
    return [KnowledgeSourceRead.model_validate(s) for s in sources]


@router.post(
    "/sources/text",
    response_model=KnowledgeSourceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add text knowledge article"
)
async def create_text_source(
    data: KnowledgeSourceCreateText,
    chatbot_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Ingests text content, splits into recursive chunks, computes embeddings, and stores in pgvector.
    """
    source = await KnowledgeService.create_text_source(
        db=db,
        org_id=org.id,
        data=data,
        chatbot_id=chatbot_id
    )
    return KnowledgeSourceRead.model_validate(source)


@router.post(
    "/sources/url",
    response_model=KnowledgeSourceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Scrape and add website URL"
)
async def create_url_source(
    data: KnowledgeSourceCreateUrl,
    chatbot_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Crawls a URL, extracts plain text, chunks, and creates vector embeddings.
    """
    source = await KnowledgeService.create_url_source(
        db=db,
        org_id=org.id,
        url=data.url,
        chatbot_id=chatbot_id
    )
    return KnowledgeSourceRead.model_validate(source)


@router.post(
    "/sources/upload",
    response_model=KnowledgeSourceRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest document (PDF, TXT, DOCX)"
)
async def upload_document_source(
    file: UploadFile = File(...),
    chatbot_id: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Uploads document to tenant-isolated storage, extracts plain text, chunks, and creates vector embeddings.
    """
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    source = await KnowledgeService.create_file_source(
        db=db,
        org_id=org.id,
        filename=file.filename or "uploaded_document.txt",
        file_bytes=file_bytes,
        mime_type=file.content_type,
        chatbot_id=chatbot_id
    )
    return KnowledgeSourceRead.model_validate(source)


@router.get(
    "/sources/{source_id}",
    response_model=KnowledgeSourceRead,
    summary="Get knowledge source status"
)
async def get_source(
    source_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Retrieves source ingestion status ('pending', 'processing', 'ready', 'failed') and chunk statistics.
    """
    stmt = select(KnowledgeSource).where(
        KnowledgeSource.id == source_id,
        KnowledgeSource.organization_id == org.id
    )
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found.")
    return KnowledgeSourceRead.model_validate(source)


@router.delete(
    "/sources/{source_id}",
    summary="Delete knowledge source and all vector chunks"
)
async def delete_source(
    source_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Deletes knowledge source and cascades deletion to all document chunks.
    """
    stmt = select(KnowledgeSource).where(
        KnowledgeSource.id == source_id,
        KnowledgeSource.organization_id == org.id
    )
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found.")

    await db.delete(source)
    await db.commit()
    return {"message": "Knowledge source and associated vector chunks successfully deleted."}


@router.post(
    "/sources/{source_id}/reindex",
    response_model=KnowledgeSourceRead,
    summary="Re-chunk and re-embed knowledge source"
)
async def reindex_source(
    source_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Invalidates existing chunks and re-processes source document to refresh embeddings.
    """
    source = await KnowledgeService.reindex_source(
        db=db,
        org_id=org.id,
        source_id=source_id
    )
    return KnowledgeSourceRead.model_validate(source)


@router.get(
    "/business-info",
    response_model=List[BusinessInfoRead],
    summary="List business FAQs and structured info"
)
async def list_business_info(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Lists structured business intelligence (FAQs, business hours, contact details).
    """
    stmt = select(BusinessInfo).where(BusinessInfo.organization_id == org.id)
    if category:
        stmt = stmt.where(BusinessInfo.category == category)
    stmt = stmt.order_by(BusinessInfo.created_at.desc())

    result = await db.execute(stmt)
    items = list(result.scalars().all())
    return [BusinessInfoRead.model_validate(i) for i in items]


@router.post(
    "/business-info",
    response_model=BusinessInfoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create business FAQ or structured info item"
)
async def create_business_info(
    data: BusinessInfoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Creates a business FAQ or knowledge record and auto-indexes it for chatbot quick answers.
    """
    info = BusinessInfo(
        organization_id=org.id,
        category=data.category,
        question=data.question,
        answer=data.answer,
        content=data.content,
        is_active=data.is_active
    )
    db.add(info)
    await db.commit()
    await db.refresh(info)
    return BusinessInfoRead.model_validate(info)


@router.post(
    "/search",
    response_model=List[SemanticSearchResult],
    summary="Semantic vector retrieval query"
)
async def semantic_search(
    req: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization)
):
    """
    Executes a vector cosine similarity search across tenant-scoped document chunks.
    """
    results = await KnowledgeService.semantic_search(
        db=db,
        org_id=org.id,
        query=req.query,
        top_k=req.top_k,
        chatbot_id=req.chatbot_id
    )
    return [
        SemanticSearchResult(
            chunk_id=r["chunk_id"],
            source_id=r["source_id"],
            content=r["content"],
            similarity_score=r["similarity_score"]
        )
        for r in results
    ]
