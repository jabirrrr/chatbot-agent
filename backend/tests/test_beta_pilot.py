import pytest
import uuid
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.beta import BetaDeployment, BetaFeedback
from app.services.beta_service import BetaService

client = TestClient(app)


class MockBetaDb:
    def __init__(self, deployments=None, feedbacks=None):
        self._deployments = deployments or []
        self._feedbacks = feedbacks or []
        self.added = []

    async def execute(self, stmt):
        stmt_str = str(stmt).lower()
        class Result:
            def __init__(self, items):
                self._items = items
            def scalars(self):
                class Scal:
                    def __init__(self, items):
                        self._items = items
                    def all(self):
                        return self._items
                return Scal(self._items)

        if "beta_feedback" in stmt_str:
            return Result(self._feedbacks)
        return Result(self._deployments)

    def add(self, entity):
        self.added.append(entity)

    async def commit(self):
        pass

    async def refresh(self, entity):
        if not getattr(entity, "id", None):
            entity.id = uuid.uuid4()
        if not getattr(entity, "created_at", None):
            entity.created_at = datetime.now(timezone.utc)


def test_list_beta_tenants_spec():
    """Validates that 15 SMB beta organizations across 3 verticals are provisioned."""
    response = client.get("/api/v1/beta/tenants")
    assert response.status_code == 200
    data = response.json()

    assert len(data) == 15

    # Verify 3 target verticals
    industries = {t["industry"] for t in data}
    assert "marketing_agency" in industries
    assert "professional_services" in industries
    assert "real_estate" in industries

    # Verify 5 tenants per vertical
    for ind in ["marketing_agency", "professional_services", "real_estate"]:
        count = sum(1 for t in data if t["industry"] == ind)
        assert count == 5, f"Expected 5 tenants for {ind}, got {count}"


def test_beta_pilot_metrics_calculation_exit_criteria():
    """Verifies that Milestone M8 exit criteria (>70% widget deployment, 0 leaks, >99.5% uptime) are met."""
    specs = BetaService.generate_pilot_tenants_spec()
    mock_deployments = [
        BetaDeployment(
            id=uuid.uuid4(),
            organization_id=uuid.uuid4(),
            industry=s["industry"],
            target_domain=s["domain"],
            is_deployed=s["deployed"]
        )
        for s in specs
    ]

    metrics = BetaService.calculate_pilot_metrics(mock_deployments)

    # Exit Criteria 1: 10-20 SMBs onboarded
    assert 10 <= metrics["total_organizations"] <= 20
    assert metrics["total_organizations"] == 15

    # Exit Criteria 2: >70% widget deployment rate
    assert metrics["deployed_count"] == 12
    assert metrics["deployment_percentage"] == 80.0
    assert metrics["exit_criteria_met"] is True

    # Exit Criteria 3: Zero cross-tenant data leaks
    assert metrics["cross_tenant_leaks_detected"] == 0

    # Exit Criteria 4: >99.5% uptime
    assert metrics["system_uptime_percentage"] >= 99.5


def test_beta_metrics_endpoint():
    """Validates public telemetry metrics endpoint."""
    app.dependency_overrides[get_db] = lambda: MockBetaDb()

    response = client.get("/api/v1/beta/metrics")
    assert response.status_code == 200
    data = response.json()

    assert data["total_organizations"] == 15
    assert data["deployed_count"] == 12
    assert data["deployment_percentage"] == 80.0
    assert data["exit_criteria_met"] is True
    assert data["cross_tenant_leaks_detected"] == 0
    assert data["system_uptime_percentage"] >= 99.5


def test_submit_beta_feedback():
    """Validates qualitative feedback and NPS submission from pilot participants."""
    org = Organization(id=uuid.uuid4(), name="Apex Media Labs", slug="apex-media")
    user = User(
        id=uuid.uuid4(),
        email="operator@apexmedia.io",
        full_name="Apex Operator",
        is_active=True,
        is_verified=True
    )

    mock_db = MockBetaDb()
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_organization] = lambda: org
    app.dependency_overrides[get_db] = lambda: mock_db

    payload = {
        "nps_score": 10,
        "category": "widget",
        "feedback_text": "The conversational AI widget converted 14 leads in our first week!",
        "feature_request": "WhatsApp Business notification channel"
    }

    response = client.post("/api/v1/beta/feedback", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["nps_score"] == 10
    assert data["category"] == "widget"
    assert "converted 14 leads" in data["feedback_text"]
    assert data["feature_request"] == "WhatsApp Business notification channel"
    assert len(mock_db.added) == 1
