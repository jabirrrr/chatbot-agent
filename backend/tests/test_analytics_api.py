import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.ai_usage import AIUsageRecord
from app.services.analytics_service import AnalyticsService

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="analyst@example.com",
    hashed_password="fakehash_argon2id",
    full_name="Bob Analyst",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Acme Analytics",
    slug="acme-analytics"
)


class MockDbSessionAnalytics:
    async def execute(self, stmt):
        stmt_str = str(stmt).lower()

        class MockResult:
            def all(self):
                if "to_char" in stmt_str:
                    # Daily usage trend: day, total_tokens, cost, requests
                    return [("2026-09-12", 8300, Decimal("0.032400"), 15)]
                elif "ai_usage_records" in stmt_str and "group by" in stmt_str:
                    # Model usage items: model, provider, count, prompt, completion, total, cost
                    return [
                        ("anthropic/claude-sonnet-5", "openrouter", 10, 4500, 1200, 5700, Decimal("0.028500")),
                        ("openai/gpt-4o-mini", "openrouter", 5, 2000, 600, 2600, Decimal("0.003900"))
                    ]
                elif "conversations" in stmt_str:
                    # Conversation status group counts
                    return [("active", 4), ("closed", 6)]
                return []

            def one(self):
                # Usage aggregates sum(total_tokens), sum(cost)
                return (8300, Decimal("0.032400"))

            def scalar(self):
                # Total leads count
                return 5

        return MockResult()

    def add(self, entity):
        pass

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_analytics_overview_unauthorized():
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 401


def test_analytics_overview_with_metrics():
    async def override_get_db():
        yield MockDbSessionAnalytics()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_conversations"] == 10
    assert data["active_conversations"] == 4
    assert data["closed_conversations"] == 6
    assert data["total_leads"] == 5
    assert data["lead_conversion_rate_pct"] == 50.0
    assert data["total_tokens_consumed"] == 8300
    assert data["estimated_total_cost_usd"] == 0.0324


def test_ai_usage_breakdown_endpoint():
    async def override_get_db():
        yield MockDbSessionAnalytics()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/analytics/usage")
    assert response.status_code == 200
    data = response.json()
    assert data["total_tokens"] == 8300
    assert len(data["models"]) == 2
    assert data["models"][0]["model"] == "anthropic/claude-sonnet-5"
    assert data["models"][0]["total_tokens"] == 5700
    assert data["models"][1]["model"] == "openai/gpt-4o-mini"


@pytest.mark.asyncio
async def test_record_ai_usage_service():
    session = MockDbSessionAnalytics()
    record = await AnalyticsService.record_ai_usage(
        db=session,
        organization_id=mock_org_id,
        conversation_id=uuid.uuid4(),
        provider="openrouter",
        model="anthropic/claude-sonnet-5",
        prompt_tokens=500,
        completion_tokens=150,
        estimated_cost_usd=0.00325
    )
    assert record.prompt_tokens == 500
    assert record.completion_tokens == 150
    assert record.total_tokens == 650
    assert record.provider == "openrouter"
