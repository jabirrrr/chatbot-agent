import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.conversation import ConversationRead, MessageRead
from app.schemas.appointment import HandoffRequest, TakeoverRequest
from app.services.handoff_service import HandoffService, ws_manager
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(tags=["Human Handoff & Real-Time Live Chat"])


class OperatorReplyRequest(BaseModel):
    content: str


@router.post(
    "/conversations/{conversation_id}/handoff",
    response_model=ConversationRead,
    summary="Request human operator handoff (REQ-AI-05)"
)
async def request_handoff(
    conversation_id: uuid.UUID,
    data: HandoffRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Transitions conversation status to 'waiting_handoff' and dispatches real-time alert to operators.
    """
    conv = await HandoffService.request_handoff(
        db=db,
        organization_id=org.id,
        conversation_id=conversation_id,
        reason=data.reason
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return ConversationRead.model_validate(conv)


@router.post(
    "/conversations/{conversation_id}/takeover",
    response_model=ConversationRead,
    summary="Operator takeover conversation (REQ-AI-05)"
)
async def takeover_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Operator takes manual control of the conversation, pausing AI auto-replies.
    """
    conv = await HandoffService.takeover_conversation(
        db=db,
        organization_id=org.id,
        conversation_id=conversation_id,
        operator=current_user
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return ConversationRead.model_validate(conv)


@router.post(
    "/conversations/{conversation_id}/reply",
    response_model=MessageRead,
    summary="Operator send live reply message"
)
async def operator_reply(
    conversation_id: uuid.UUID,
    data: OperatorReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    """
    Operator dispatches a message into the conversation thread, streaming to the visitor.
    """
    msg = await HandoffService.send_operator_reply(
        db=db,
        organization_id=org.id,
        conversation_id=conversation_id,
        operator=current_user,
        content=data.content
    )
    return MessageRead.model_validate(msg)


@router.websocket("/ws/conversations")
async def websocket_conversations_endpoint(
    websocket: WebSocket,
    org_id: str = Query(..., description="Organization ID for tenant isolation")
):
    """
    Real-time WebSocket connection for operators to receive live conversation events.
    Fulfills REQ-CONV-03.
    """
    try:
        tenant_uuid = uuid.UUID(org_id)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(tenant_uuid, websocket)
    try:
        while True:
            # Keep socket alive and accept client pings/messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(tenant_uuid, websocket)
    except Exception:
        ws_manager.disconnect(tenant_uuid, websocket)
