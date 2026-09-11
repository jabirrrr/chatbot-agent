import uuid
import json
from typing import Dict, List, Optional
from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.conversation import Conversation, Message
from app.models.user import User


class ConnectionManager:
    """
    Manages active WebSocket connections from dashboard operators, partitioned by organization_id.
    Fulfills REQ-CONV-03 (Real-Time Conversation Updates).
    """
    def __init__(self):
        # Maps organization_id -> List[WebSocket]
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, org_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        if org_id not in self.active_connections:
            self.active_connections[org_id] = []
        self.active_connections[org_id].append(websocket)

    def disconnect(self, org_id: uuid.UUID, websocket: WebSocket):
        if org_id in self.active_connections:
            if websocket in self.active_connections[org_id]:
                self.active_connections[org_id].remove(websocket)
            if not self.active_connections[org_id]:
                del self.active_connections[org_id]

    async def broadcast_to_org(self, org_id: uuid.UUID, data: dict):
        if org_id in self.active_connections:
            message_text = json.dumps(data)
            disconnected = []
            for connection in self.active_connections[org_id]:
                try:
                    await connection.send_text(message_text)
                except Exception:
                    disconnected.append(connection)
            for dead_conn in disconnected:
                self.disconnect(org_id, dead_conn)


ws_manager = ConnectionManager()


class HandoffService:
    """
    Orchestrates human operator handoff protocol and live bi-directional messaging.
    Fulfills REQ-AI-05 and REQ-CONV-03.
    """

    @staticmethod
    async def request_handoff(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: uuid.UUID,
        reason: Optional[str] = "Visitor requested human assistance"
    ) -> Optional[Conversation]:
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.organization_id == organization_id
        )
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if not conv:
            return None

        # Transition status to waiting_handoff
        conv.status = "waiting_handoff"
        meta = conv.metadata_json or {}
        meta["handoff_reason"] = reason
        conv.metadata_json = meta

        # Record system notice in conversation thread
        system_msg = Message(
            organization_id=organization_id,
            conversation_id=conversation_id,
            sender_type="system",
            content=f"Human operator requested: {reason}"
        )
        db.add(system_msg)
        await db.commit()
        await db.refresh(conv)

        # Broadcast live alert to connected operators
        await ws_manager.broadcast_to_org(
            org_id=organization_id,
            data={
                "event": "handoff_requested",
                "conversation_id": str(conversation_id),
                "visitor_id": conv.visitor_id,
                "reason": reason
            }
        )

        return conv

    @staticmethod
    async def takeover_conversation(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: uuid.UUID,
        operator: User
    ) -> Optional[Conversation]:
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.organization_id == organization_id
        )
        result = await db.execute(stmt)
        conv = result.scalar_one_or_none()
        if not conv:
            return None

        conv.status = "active"
        meta = conv.metadata_json or {}
        meta["assigned_operator_id"] = str(operator.id)
        meta["assigned_operator_name"] = operator.full_name or operator.email
        conv.metadata_json = meta

        system_msg = Message(
            organization_id=organization_id,
            conversation_id=conversation_id,
            sender_type="system",
            content=f"Operator {operator.full_name or operator.email} joined the conversation"
        )
        db.add(system_msg)
        await db.commit()
        await db.refresh(conv)

        await ws_manager.broadcast_to_org(
            org_id=organization_id,
            data={
                "event": "operator_takeover",
                "conversation_id": str(conversation_id),
                "operator_name": operator.full_name or operator.email
            }
        )

        return conv

    @staticmethod
    async def send_operator_reply(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: uuid.UUID,
        operator: User,
        content: str
    ) -> Message:
        msg = Message(
            organization_id=organization_id,
            conversation_id=conversation_id,
            sender_type="agent",
            content=content
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)

        await ws_manager.broadcast_to_org(
            org_id=organization_id,
            data={
                "event": "new_message",
                "conversation_id": str(conversation_id),
                "sender_type": "agent",
                "content": content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
        )

        return msg
