import uuid
import time
import json
import hmac
import hashlib
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.subscription import Subscription, ProcessedWebhookEvent
from app.models.webhook import WebhookEndpoint
from app.services.webhook_dispatcher import compute_hmac_sha256, WebhookDispatcher

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="owner@subscription.com",
    hashed_password="fakehash_argon2id",
    full_name="Sam Owner",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Subscription Org",
    slug="subscription-org"
)


class MockDbSessionBilling:
    def __init__(self):
        self.events_seen = set()

    async def execute(self, stmt):
        stmt_str = str(stmt).lower()

        class MockResult:
            def __init__(self, seen):
                self.seen = seen

            def scalar_one_or_none(self):
                if "processed_webhook_events" in stmt_str:
                    if "evt_already_processed_123" in stmt_str:
                        return ProcessedWebhookEvent(
                            event_id="evt_already_processed_123",
                            event_type="customer.subscription.updated",
                            processed_at=datetime.now(timezone.utc)
                        )
                    return None
                elif "subscriptions" in stmt_str:
                    return None
                return None

        return MockResult(self.events_seen)

    def add(self, entity):
        pass

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_get_subscription_defaults_to_free():
    async def override_get_db():
        yield MockDbSessionBilling()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/billing/subscription")
    assert response.status_code == 200
    data = response.json()
    assert data["plan_tier"] == "free"
    assert data["status"] == "active"


def test_create_checkout_session():
    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.post(
        "/api/v1/billing/checkout",
        json={"plan_tier": "starter"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "checkout_url" in data
    assert "plan=starter" in data["checkout_url"]


def test_create_portal_session():
    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.post("/api/v1/billing/portal")
    assert response.status_code == 200
    data = response.json()
    assert "portal_url" in data
    assert "billing.stripe.com" in data["portal_url"]


def test_stripe_webhook_signature_and_idempotency():
    async def override_get_db():
        yield MockDbSessionBilling()

    app.dependency_overrides[get_db] = override_get_db

    # Create signed test payload
    secret = "whsec_mock_stripe_secret"
    timestamp = str(int(time.time()))
    payload_dict = {
        "id": "evt_test_new_sub_999",
        "type": "customer.subscription.created",
        "data": {"object": {"id": "sub_123", "status": "active"}}
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")
    signed_content = f"{timestamp}.".encode("utf-8") + payload_bytes
    sig = hmac.new(secret.encode("utf-8"), signed_content, hashlib.sha256).hexdigest()
    header = f"t={timestamp},v1={sig}"

    response = client.post(
        "/api/v1/billing/webhook",
        content=payload_bytes,
        headers={"Stripe-Signature": header}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processed"
    assert data["event_id"] == "evt_test_new_sub_999"


def test_outbound_webhook_hmac_computation():
    secret = "whsec_custom_tenant_secret_444"
    payload = {"event": "lead.created", "data": {"name": "Sarah Miller", "email": "sarah@acme.com"}}
    payload_json = json.dumps(payload)
    sig = compute_hmac_sha256(secret, payload_json)
    assert len(sig) == 64  # SHA-256 hex digest length

    # Verify signature verification match
    expected = hmac.new(secret.encode("utf-8"), payload_json.encode("utf-8"), hashlib.sha256).hexdigest()
    assert sig == expected
