import hmac
import hashlib
import json
import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.webhook import WebhookEndpoint


def compute_hmac_sha256(secret: str, payload_json: str) -> str:
    """
    Computes HMAC-SHA256 signature for outbound webhook authentication.
    Fulfills REQ-INT-02.
    """
    return hmac.new(
        secret.encode("utf-8"),
        payload_json.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


class WebhookDispatcher:
    @staticmethod
    async def get_endpoints_for_event(
        db: AsyncSession,
        organization_id: uuid.UUID,
        event_type: str
    ) -> List[WebhookEndpoint]:
        stmt = select(WebhookEndpoint).where(
            WebhookEndpoint.organization_id == organization_id,
            WebhookEndpoint.is_active == True
        )
        result = await db.execute(stmt)
        all_endpoints = list(result.scalars().all())
        # Filter for endpoints listening to this event or "*"
        return [
            ep for ep in all_endpoints
            if "*" in (ep.events or []) or event_type in (ep.events or [])
        ]

    @staticmethod
    def prepare_webhook_request(
        endpoint: WebhookEndpoint,
        event_type: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prepares HTTP headers and signed body for outbound webhook delivery.
        """
        body = {
            "event": event_type,
            "data": payload
        }
        payload_json = json.dumps(body, default=str)
        signature = compute_hmac_sha256(endpoint.secret, payload_json)

        return {
            "url": endpoint.url,
            "headers": {
                "Content-Type": "application/json",
                "X-Signature-SHA256": signature,
                "X-Event-Type": event_type
            },
            "body": payload_json
        }
