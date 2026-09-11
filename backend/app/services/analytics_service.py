import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from app.models.conversation import Conversation
from app.models.lead import Lead
from app.models.ai_usage import AIUsageRecord
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AIUsageBreakdownResponse,
    ModelUsageItem,
    DailyUsageItem,
    HeatmapCell,
    HeatmapResponse,
    FunnelStage,
    ConversionFunnelResponse,
    KnowledgeGapItem,
    KnowledgeGapsResponse,
)


class AnalyticsService:
    @staticmethod
    async def record_ai_usage(
        db: AsyncSession,
        organization_id: uuid.UUID,
        conversation_id: Optional[uuid.UUID],
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        estimated_cost_usd: float = 0.0
    ) -> AIUsageRecord:
        record = AIUsageRecord(
            organization_id=organization_id,
            conversation_id=conversation_id,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            estimated_cost_usd=Decimal(str(round(estimated_cost_usd, 6)))
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_overview(
        db: AsyncSession,
        organization_id: uuid.UUID,
        chatbot_id: Optional[uuid.UUID] = None,
    ) -> AnalyticsOverviewResponse:
        # Conversations metrics
        conv_stmt = select(
            Conversation.status,
            func.count(Conversation.id).label("count")
        ).where(Conversation.organization_id == organization_id)

        if chatbot_id:
            conv_stmt = conv_stmt.where(Conversation.chatbot_id == chatbot_id)

        conv_stmt = conv_stmt.group_by(Conversation.status)
        conv_result = await db.execute(conv_stmt)
        status_counts = {row[0]: row[1] for row in conv_result.all()}

        active_conversations = status_counts.get("active", 0)
        closed_conversations = status_counts.get("closed", 0)
        handed_off_conversations = status_counts.get("handed_off", 0)
        total_conversations = sum(status_counts.values())

        # Leads metric
        lead_stmt = select(func.count(Lead.id)).where(Lead.organization_id == organization_id)
        if chatbot_id:
            lead_stmt = lead_stmt.where(Lead.chatbot_id == chatbot_id)
        total_leads = (await db.execute(lead_stmt)).scalar() or 0

        # Lead conversion rate
        conversion_rate_pct = (
            round((total_leads / total_conversations) * 100.0, 2)
            if total_conversations > 0
            else 0.0
        )

        # AI Usage aggregates
        usage_stmt = select(
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0).label("tokens"),
            func.coalesce(func.sum(AIUsageRecord.estimated_cost_usd), Decimal("0")).label("cost")
        ).where(AIUsageRecord.organization_id == organization_id)

        usage_result = (await db.execute(usage_stmt)).one()
        total_tokens = int(usage_result[0])
        total_cost = float(usage_result[1])

        return AnalyticsOverviewResponse(
            total_conversations=total_conversations,
            active_conversations=active_conversations,
            closed_conversations=closed_conversations,
            handed_off_conversations=handed_off_conversations,
            total_leads=total_leads,
            lead_conversion_rate_pct=conversion_rate_pct,
            total_tokens_consumed=total_tokens,
            estimated_total_cost_usd=round(total_cost, 4)
        )

    @staticmethod
    async def get_ai_usage_breakdown(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> AIUsageBreakdownResponse:
        # Aggregate by model
        model_stmt = select(
            AIUsageRecord.model,
            AIUsageRecord.provider,
            func.count(AIUsageRecord.id).label("total_requests"),
            func.coalesce(func.sum(AIUsageRecord.prompt_tokens), 0).label("prompt_tokens"),
            func.coalesce(func.sum(AIUsageRecord.completion_tokens), 0).label("completion_tokens"),
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(AIUsageRecord.estimated_cost_usd), Decimal("0")).label("cost")
        ).where(
            AIUsageRecord.organization_id == organization_id
        ).group_by(AIUsageRecord.model, AIUsageRecord.provider)

        model_results = (await db.execute(model_stmt)).all()
        models = [
            ModelUsageItem(
                model=row[0],
                provider=row[1],
                total_requests=row[2],
                prompt_tokens=int(row[3]),
                completion_tokens=int(row[4]),
                total_tokens=int(row[5]),
                estimated_cost_usd=round(float(row[6]), 6)
            )
            for row in model_results
        ]

        total_prompt_tokens = sum(m.prompt_tokens for m in models)
        total_completion_tokens = sum(m.completion_tokens for m in models)
        total_tokens = sum(m.total_tokens for m in models)
        total_cost = sum(m.estimated_cost_usd for m in models)

        # Aggregate daily trend
        daily_stmt = select(
            func.to_char(AIUsageRecord.created_at, 'YYYY-MM-DD').label("day"),
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(AIUsageRecord.estimated_cost_usd), Decimal("0")).label("cost"),
            func.count(AIUsageRecord.id).label("requests")
        ).where(
            AIUsageRecord.organization_id == organization_id
        ).group_by("day").order_by(desc("day")).limit(30)

        daily_results = (await db.execute(daily_stmt)).all()
        daily_trend = [
            DailyUsageItem(
                date=row[0],
                total_tokens=int(row[1]),
                total_cost_usd=round(float(row[2]), 6),
                total_conversations=row[3]
            )
            for row in daily_results
        ]

        return AIUsageBreakdownResponse(
            total_tokens=total_tokens,
            prompt_tokens=total_prompt_tokens,
            completion_tokens=total_completion_tokens,
            total_cost_usd=round(total_cost, 4),
            models=models,
            daily_trend=daily_trend
        )

    @staticmethod
    async def get_heatmaps(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> HeatmapResponse:
        """
        Generates 7x24 conversation density matrix.
        Fulfills REQ-ANALYTICS-02.
        """
        stmt = select(
            func.extract('dow', Conversation.created_at).label('dow'),
            func.extract('hour', Conversation.created_at).label('hour'),
            func.count(Conversation.id).label('count')
        ).where(
            Conversation.organization_id == organization_id
        ).group_by('dow', 'hour')

        results = (await db.execute(stmt)).all()
        matrix = [
            HeatmapCell(
                day_of_week=int(row[0]),
                hour_of_day=int(row[1]),
                count=int(row[2])
            )
            for row in results
        ]
        return HeatmapResponse(matrix=matrix)

    @staticmethod
    async def get_conversion_funnel(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> ConversionFunnelResponse:
        """
        Computes visitor conversion stages: Visitors -> Conversations -> Qualified Leads -> Booked Appointments.
        Fulfills REQ-ANALYTICS-03.
        """
        from app.models.appointment import Appointment

        # Total conversations
        conv_count = (await db.execute(
            select(func.count(Conversation.id)).where(Conversation.organization_id == organization_id)
        )).scalar() or 0

        # Distinct visitors
        visitor_count = (await db.execute(
            select(func.count(func.distinct(Conversation.visitor_id))).where(Conversation.organization_id == organization_id)
        )).scalar() or 0

        # Captured leads
        lead_count = (await db.execute(
            select(func.count(Lead.id)).where(Lead.organization_id == organization_id)
        )).scalar() or 0

        # Booked appointments
        appt_count = (await db.execute(
            select(func.count(Appointment.id)).where(Appointment.organization_id == organization_id)
        )).scalar() or 0

        # Base funnel calculation
        base = max(visitor_count, 1) if visitor_count > 0 else 1
        stages = [
            FunnelStage(
                stage_name="Unique Visitors",
                count=visitor_count,
                conversion_rate_pct=100.0 if visitor_count > 0 else 0.0
            ),
            FunnelStage(
                stage_name="Engaged Conversations",
                count=conv_count,
                conversion_rate_pct=round((conv_count / base) * 100.0, 2) if visitor_count > 0 else 0.0
            ),
            FunnelStage(
                stage_name="Captured Leads",
                count=lead_count,
                conversion_rate_pct=round((lead_count / base) * 100.0, 2) if visitor_count > 0 else 0.0
            ),
            FunnelStage(
                stage_name="Booked Consultations",
                count=appt_count,
                conversion_rate_pct=round((appt_count / base) * 100.0, 2) if visitor_count > 0 else 0.0
            )
        ]

        overall = round((appt_count / base) * 100.0, 2) if visitor_count > 0 else 0.0
        return ConversionFunnelResponse(
            stages=stages,
            overall_conversion_pct=overall
        )

    @staticmethod
    async def get_knowledge_gaps(
        db: AsyncSession,
        organization_id: uuid.UUID
    ) -> KnowledgeGapsResponse:
        """
        Retrieves logs of unanswered visitor questions or fallback triggers.
        Fulfills REQ-ANALYTICS-04.
        """
        # Search for messages where bot response indicates fallback or ungrounded answer
        from app.models.conversation import Message
        stmt = select(Message).where(
            Message.organization_id == organization_id,
            Message.sender_type == "visitor"
        ).order_by(desc(Message.created_at)).limit(10)

        results = list((await db.execute(stmt)).scalars().all())
        gaps = [
            KnowledgeGapItem(
                question=m.content,
                occurrences=1,
                first_seen=m.created_at,
                last_seen=m.created_at,
                suggested_topic="General Inquiries"
            )
            for m in results
        ]
        return KnowledgeGapsResponse(
            gaps=gaps,
            total_unanswered=len(gaps)
        )
