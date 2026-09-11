import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.conversation import Message

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="analyst@deepanalytics.com",
    hashed_password="fakehash_argon2id",
    full_name="Alex Analyst",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Deep Analytics Org",
    slug="deep-analytics-org"
)

mock_gap_message = Message(
    id=uuid.uuid4(),
    organization_id=mock_org_id,
    conversation_id=uuid.uuid4(),
    sender_type="visitor",
    content="Do you provide on-premise air-gapped deployment for HIPAA compliance?",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)


class MockDbSessionDeepAnalytics:
    async def execute(self, stmt):
        stmt_str = str(stmt).lower()

        class MockResult:
            def all(self):
                if "dow" in stmt_str and "hour" in stmt_str:
                    # dow, hour, count
                    return [
                        (1, 10, 14),
                        (1, 14, 22),
                        (2, 11, 18),
                        (3, 15, 25),
                        (4, 9, 12)
                    ]
                return []

            def scalar(self):
                # Funnel stage counts: visitors, conversations, leads, appointments
                if "distinct" in stmt_str:
                    return 500  # Visitors
                elif "conversations" in stmt_str:
                    return 250  # Engaged Conversations
                elif "leads" in stmt_str:
                    return 75   # Captured Leads
                elif "appointments" in stmt_str:
                    return 25   # Booked Consultations
                return 10

            def scalars(self):
                class MockScalars:
                    def all(self):
                        return [mock_gap_message]
                return MockScalars()

        return MockResult()


def test_analytics_heatmaps_matrix():
    async def override_get_db():
        yield MockDbSessionDeepAnalytics()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/analytics/heatmaps")
    assert response.status_code == 200
    data = response.json()
    assert "matrix" in data
    assert len(data["matrix"]) == 5
    assert data["matrix"][0]["day_of_week"] == 1
    assert data["matrix"][0]["hour_of_day"] == 10
    assert data["matrix"][0]["count"] == 14


def test_analytics_conversion_funnel():
    async def override_get_db():
        yield MockDbSessionDeepAnalytics()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/analytics/funnel")
    assert response.status_code == 200
    data = response.json()
    assert "stages" in data
    assert len(data["stages"]) == 4
    assert data["stages"][0]["stage_name"] == "Unique Visitors"
    assert data["stages"][0]["count"] == 500
    assert data["stages"][1]["stage_name"] == "Engaged Conversations"
    assert data["stages"][2]["stage_name"] == "Captured Leads"
    assert data["stages"][3]["stage_name"] == "Booked Consultations"


def test_analytics_knowledge_gaps():
    async def override_get_db():
        yield MockDbSessionDeepAnalytics()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/analytics/gaps")
    assert response.status_code == 200
    data = response.json()
    assert "gaps" in data
    assert len(data["gaps"]) == 1
    assert "HIPAA" in data["gaps"][0]["question"]
