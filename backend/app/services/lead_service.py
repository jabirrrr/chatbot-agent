import io
import csv
import uuid
from typing import Optional, List, Tuple, Generator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from app.models.lead import Lead
from app.schemas.lead import LeadUpdate, LeadCreate


class LeadService:
    @staticmethod
    async def list_leads(
        db: AsyncSession,
        organization_id: uuid.UUID,
        chatbot_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Lead], int]:
        stmt = select(Lead).where(Lead.organization_id == organization_id)

        if chatbot_id:
            stmt = stmt.where(Lead.chatbot_id == chatbot_id)
        if status:
            stmt = stmt.where(Lead.status == status)
        if search:
            search_term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Lead.name.ilike(search_term),
                    Lead.email.ilike(search_term),
                    Lead.phone.ilike(search_term),
                    Lead.notes.ilike(search_term)
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(desc(Lead.created_at)).limit(limit).offset(offset)
        result = await db.execute(stmt)
        leads = list(result.scalars().all())

        return leads, total

    @staticmethod
    async def get_lead(
        db: AsyncSession,
        organization_id: uuid.UUID,
        lead_id: uuid.UUID
    ) -> Optional[Lead]:
        stmt = select(Lead).where(
            Lead.id == lead_id,
            Lead.organization_id == organization_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_lead(
        db: AsyncSession,
        organization_id: uuid.UUID,
        lead_id: uuid.UUID,
        update_data: LeadUpdate
    ) -> Optional[Lead]:
        lead = await LeadService.get_lead(db, organization_id, lead_id)
        if not lead:
            return None

        if update_data.name is not None:
            lead.name = update_data.name
        if update_data.email is not None:
            lead.email = str(update_data.email)
        if update_data.phone is not None:
            lead.phone = update_data.phone
        if update_data.status is not None:
            lead.status = update_data.status
        if update_data.notes is not None:
            lead.notes = update_data.notes

        await db.commit()
        await db.refresh(lead)
        return lead

    @staticmethod
    async def export_leads_csv(
        db: AsyncSession,
        organization_id: uuid.UUID,
        chatbot_id: Optional[uuid.UUID] = None,
    ) -> str:
        """
        Generates RFC 4180 compliant CSV text of all leads for the organization.
        Fulfills REQ-LEAD-03.
        """
        stmt = select(Lead).where(Lead.organization_id == organization_id)
        if chatbot_id:
            stmt = stmt.where(Lead.chatbot_id == chatbot_id)
        stmt = stmt.order_by(desc(Lead.created_at))

        result = await db.execute(stmt)
        leads = list(result.scalars().all())

        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "ID",
            "Created At",
            "Name",
            "Email",
            "Phone",
            "Status",
            "Notes",
            "Conversation ID",
            "Chatbot ID"
        ])

        for lead in leads:
            writer.writerow([
                str(lead.id),
                lead.created_at.isoformat() if lead.created_at else "",
                lead.name,
                lead.email or "",
                lead.phone or "",
                lead.status,
                lead.notes or "",
                str(lead.conversation_id) if lead.conversation_id else "",
                str(lead.chatbot_id) if lead.chatbot_id else ""
            ])

        return output.getvalue()
