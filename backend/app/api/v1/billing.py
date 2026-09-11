from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict

from app.core.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.subscription import Subscription, ProcessedWebhookEvent
from app.adapters.billing.stripe import StripeBillingAdapter
from app.api.deps import get_current_user, get_current_organization

router = APIRouter(prefix="/billing", tags=["Billing & Subscriptions"])

stripe_adapter = StripeBillingAdapter()


class SubscriptionResponse(BaseModel):
    plan_tier: str
    status: str
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False

    model_config = ConfigDict(from_attributes=True)


class CheckoutRequest(BaseModel):
    plan_tier: str
    success_url: str = "https://app.heliochat.com/dashboard/billing?status=success"
    cancel_url: str = "https://app.heliochat.com/dashboard/billing?status=cancelled"


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


@router.get(
    "/subscription",
    response_model=SubscriptionResponse,
    summary="Get current organization subscription plan (REQ-BILLING-01)"
)
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    stmt = select(Subscription).where(Subscription.organization_id == org.id)
    result = await db.execute(stmt)
    sub = result.scalar_one_or_none()
    if not sub:
        # Default to free tier
        return SubscriptionResponse(
            plan_tier="free",
            status="active",
            cancel_at_period_end=False
        )
    return SubscriptionResponse.model_validate(sub)


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    summary="Create Stripe checkout session for plan upgrade (REQ-BILLING-02)"
)
async def create_checkout(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    try:
        url = stripe_adapter.create_checkout_session(
            org_id=str(org.id),
            plan_tier=data.plan_tier,
            customer_email=current_user.email,
            success_url=data.success_url,
            cancel_url=data.cancel_url
        )
        return CheckoutResponse(checkout_url=url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/portal",
    response_model=PortalResponse,
    summary="Create Stripe customer portal session (REQ-BILLING-04)"
)
async def create_portal(
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_organization),
):
    url = stripe_adapter.create_customer_portal_session(
        customer_id=f"cus_{str(org.id)[:12]}",
        return_url="https://app.heliochat.com/dashboard/billing"
    )
    return PortalResponse(portal_url=url)


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Idempotent Stripe webhook receiver (REQ-BILLING-03)"
)
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    try:
        event = stripe_adapter.verify_webhook_signature(
            payload=payload,
            sig_header=stripe_signature or ""
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Webhook error: {str(e)}")

    event_id = event.get("id")
    event_type = event.get("type", "unknown")

    # Idempotency check
    stmt = select(ProcessedWebhookEvent).where(ProcessedWebhookEvent.event_id == event_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        return {"status": "already_processed", "event_id": event_id}

    # Record event
    record = ProcessedWebhookEvent(event_id=event_id, event_type=event_type)
    db.add(record)
    await db.commit()

    return {"status": "processed", "event_id": event_id, "type": event_type}
