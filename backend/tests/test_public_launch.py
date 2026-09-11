import pytest
import uuid
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from decimal import Decimal

from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.onboarding import OnboardingChecklist
from app.models.subscription import Subscription
from app.models.ai_usage import AIUsageRecord
from app.services.analytics_service import AnalyticsService
from app.services.email_service import EmailService
from app.services.onboarding_service import OnboardingService
from app.core.sentry import capture_exception, get_captured_errors, is_sentry_active

client = TestClient(app)


class MockLaunchDb:
    def __init__(self, checklist=None, subscriptions=None, ai_cost=15.25):
        self.checklist = checklist
        self.subscriptions = subscriptions or []
        self.ai_cost = Decimal(str(ai_cost))
        self.added = []

    async def execute(self, stmt):
        stmt_str = str(stmt).lower()

        class Result:
            def __init__(self, val):
                self._val = val

            def scalar(self):
                return self._val

            def scalar_one_or_none(self):
                return self._val

            def scalars(self):
                class Scal:
                    def __init__(self, items):
                        self._items = items if isinstance(items, list) else ([items] if items else [])
                    def all(self):
                        return self._items
                return Scal(self._val)

        if "select 1" in stmt_str:
            return Result(1)
        elif "onboarding_checklists" in stmt_str:
            return Result(self.checklist)
        elif "subscriptions" in stmt_str:
            return Result(self.subscriptions)

        elif "ai_usage" in stmt_str:
            return Result(self.ai_cost)
        elif "chatbots" in stmt_str:
            return Result(uuid.uuid4())
        elif "knowledge_sources" in stmt_str:
            return Result(uuid.uuid4())
        elif "conversations" in stmt_str:
            return Result(uuid.uuid4())
        return Result(None)

    def add(self, entity):
        self.added.append(entity)
        if isinstance(entity, OnboardingChecklist):
            self.checklist = entity

    async def commit(self):
        pass

    async def refresh(self, entity):
        if not getattr(entity, "id", None):
            entity.id = uuid.uuid4()
        if not getattr(entity, "created_at", None):
            entity.created_at = datetime.now(timezone.utc)


@pytest.fixture
def mock_context():
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    mock_org = Organization(id=org_id, name="Northstar Marketing Agency", slug="northstar-agency")
    mock_user = User(id=user_id, email="alex@northstarstudio.io", full_name="Alex Mercer", is_active=True)
    mock_db = MockLaunchDb()

    app.dependency_overrides[get_current_organization] = lambda: mock_org
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    yield mock_org, mock_user, mock_db

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_financial_metrics_calculation():
    """
    Verifies computation of MRR, churn rate (<5% target), and AI gross margins (>65% target).
    Fulfills Phase 4 / Milestone M9 Deliverable 4.
    """
    org_id = uuid.uuid4()
    # Mock subscriptions: 10 Starter ($49), 4 Pro ($149), 1 cancelled
    subs = [
        Subscription(organization_id=org_id, plan_tier="starter", status="active")
        for _ in range(10)
    ] + [
        Subscription(organization_id=org_id, plan_tier="professional", status="active")
        for _ in range(4)
    ]
    # MRR = 10*49 + 4*149 = 490 + 596 = 1086. AI Cost = 25.0. Profit = 1061. Margin = 97.7% > 65%
    mock_db = MockLaunchDb(subscriptions=subs, ai_cost=25.0)

    metrics = await AnalyticsService.get_financial_metrics(mock_db, org_id)
    assert metrics is not None
    assert metrics.mrr_usd == 1086.0
    assert metrics.arr_usd == round(1086.0 * 12.0, 2)
    assert metrics.churn_rate_pct < 5.0
    assert metrics.churn_target_met is True
    assert metrics.gross_margin_pct >= 65.0
    assert metrics.gross_margin_target_met is True
    assert len(metrics.tier_breakdown) >= 3


def test_financial_metrics_endpoint(mock_context):
    """
    Verifies GET /api/v1/analytics/financials endpoint returns 200 with financial scaling telemetry.
    """
    resp = client.get("/api/v1/analytics/financials")
    assert resp.status_code == 200
    data = resp.json()
    assert "mrr_usd" in data
    assert "churn_rate_pct" in data
    assert "gross_margin_pct" in data
    assert data["churn_target_met"] is True
    assert data["gross_margin_target_met"] is True


def test_system_status_endpoint():
    """
    Verifies public GET /api/v1/status endpoint reports infrastructure operational health and 99.98% SLA.
    Fulfills Phase 4 / Milestone M9 Deliverable 3.
    """
    mock_db = MockLaunchDb()
    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        resp = client.get("/api/v1/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["overall_status"] in ("all_systems_operational", "partially_degraded")
        assert data["uptime_percentage_90d"] >= 99.50
        assert len(data["components"]) >= 5
        component_names = [c["name"] for c in data["components"]]
        assert any("Database" in n for n in component_names)
        assert any("API Core" in n for n in component_names)
        assert any("OpenRouter" in n for n in component_names)
        assert any("Stripe" in n for n in component_names)
        assert len(data["past_incidents"]) >= 1
    finally:
        app.dependency_overrides.clear()



def test_onboarding_checklist_lifecycle(mock_context):
    """
    Verifies GET and POST on /api/v1/onboarding/checklist.
    Fulfills Phase 4 / Milestone M9 Deliverable 2.
    """
    # 1. Fetch initial checklist
    resp = client.get("/api/v1/onboarding/checklist")
    assert resp.status_code == 200
    checklist = resp.json()
    assert checklist["account_created"] is True
    assert checklist["total_steps"] == 7
    assert 0.0 <= checklist["completion_percentage"] <= 100.0

    # 2. Advance a step
    update_resp = client.post(
        "/api/v1/onboarding/checklist/step",
        json={"step_key": "appearance_customized", "completed": True}
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["appearance_customized"] is True
    assert updated["completed_steps"] >= 1


def test_transactional_email_sequences(mock_context):
    """
    Verifies automated transactional email sequence dispatches (Day 0, Day 1, Day 3, Day 7).
    Fulfills Phase 4 / Milestone M9 Deliverable 2.
    """
    EmailService.clear_dispatches()

    # Day 0 Welcome
    resp0 = client.post(
        "/api/v1/onboarding/emails/trigger",
        json={"sequence_type": "day_0_welcome", "recipient_email": "founder@brandagency.com"}
    )
    assert resp0.status_code == 200

    # Day 1 Knowledge
    resp1 = client.post(
        "/api/v1/onboarding/emails/trigger",
        json={"sequence_type": "day_1_knowledge", "recipient_email": "founder@brandagency.com"}
    )
    assert resp1.status_code == 200

    # Day 3 Widget Embed
    resp3 = client.post(
        "/api/v1/onboarding/emails/trigger",
        json={"sequence_type": "day_3_install", "recipient_email": "founder@brandagency.com"}
    )
    assert resp3.status_code == 200

    # Day 7 Lead Captured
    resp7 = client.post(
        "/api/v1/onboarding/emails/trigger",
        json={"sequence_type": "day_7_lead", "recipient_email": "founder@brandagency.com"}
    )
    assert resp7.status_code == 200

    dispatches = EmailService.get_dispatches()
    assert len(dispatches) == 4
    seq_types = [d["sequence_type"] for d in dispatches]
    assert "day_0_welcome" in seq_types
    assert "day_1_knowledge" in seq_types
    assert "day_3_install" in seq_types
    assert "day_7_lead" in seq_types


def test_sentry_error_capture():
    """
    Verifies Sentry monitoring setup and error capture function.
    Fulfills Phase 4 / Milestone M9 Deliverable 3.
    """
    assert is_sentry_active() is True
    test_exc = ValueError("Test simulated unhandled error for Sentry capture")
    err_id = capture_exception(test_exc, tags={"environment": "test", "route": "/api/v1/test"})
    assert err_id.startswith("err_")

    errors = get_captured_errors()
    assert any("Test simulated unhandled error" in e["message"] for e in errors)
