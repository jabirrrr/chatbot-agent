import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.conversation import (
    ConversationRead,
    ConversationReadDetail,
    ConversationUpdate,
    MessageRead
)
from app.services.conversation_service import ConversationService
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/conversations", tags=["Conversations"])


class ConversationListResponse(BaseModel):
    items: List[ConversationRead]
    total: int


@router.get(
    "/",
    response_model=ConversationListResponse,
    summary="List conversations with filters & search (REQ-CONV-01)"
)
async def list_conversations(
    chatbot_id: Optional[uuid.UUID] = Query(None, description="Filter by chatbot"),
    status: Optional[str] = Query(None, description="Filter by status: 'active', 'closed', 'handed_off'"),
    search: Optional[str] = Query(None, description="Search by visitor ID or summary"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Returns a paged list of customer conversations for the current tenant.
    """
    items, total = await ConversationService.list_conversations(
        db=db,
        organization_id=org.id,
        chatbot_id=chatbot_id,
        status=status,
        search=search,
        limit=limit,
        offset=offset
    )
    return ConversationListResponse(
        items=[ConversationRead.model_validate(c) for c in items],
        total=total
    )


@router.get(
    "/{conversation_id}",
    response_model=ConversationReadDetail,
    summary="Get conversation detail thread (REQ-CONV-02)"
)
async def get_conversation_thread(
    conversation_id: uuid.UUID,
    chatbot_id: Optional[uuid.UUID] = Query(None, description="Verify conversation belongs to this chatbot"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Retrieves full conversation context and all chronological messages in the thread.
    """
    res = await ConversationService.get_conversation_with_messages(
        db=db,
        organization_id=org.id,
        conversation_id=conversation_id,
        chatbot_id=chatbot_id
    )
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    conv, messages = res
    read_detail = ConversationReadDetail.model_validate(conv)
    read_detail.messages = [MessageRead.model_validate(m) for m in messages]
    return read_detail


@router.patch(
    "/{conversation_id}",
    response_model=ConversationRead,
    summary="Update conversation status or summary"
)
async def update_conversation(
    conversation_id: uuid.UUID,
    update_data: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Updates conversation status (e.g. resolve/close, archive, notes).
    """
    conv = await ConversationService.update_conversation(
        db=db,
        organization_id=org.id,
        conversation_id=conversation_id,
        update_data=update_data
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return ConversationRead.model_validate(conv)
