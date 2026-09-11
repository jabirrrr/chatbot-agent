import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.appointment import Appointment

client = TestClient(app)

mock_user_id = uuid.uuid4()
mock_org_id = uuid.uuid4()
mock_appt_id = uuid.uuid4()

mock_user = User(
    id=mock_user_id,
    email="scheduler@example.com",
    hashed_password="fakehash_argon2id",
    full_name="Sam Scheduler",
    is_active=True,
    is_verified=True
)

mock_org = Organization(
    id=mock_org_id,
    name="Acme Health",
    slug="acme-health"
)

mock_appt = Appointment(
    id=mock_appt_id,
    organization_id=mock_org_id,
    attendee_name="Emily Davis",
    attendee_email="emily.davis@client.org",
    scheduled_at=datetime(2026, 9, 20, 15, 0, 0, tzinfo=timezone.utc),
    duration_minutes=30,
    status="scheduled",
    meeting_link="https://meet.google.com/abc-defg-hij",
    notes="Initial strategy consultation",
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc)
)


class MockDbSessionAppointments:
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                return mock_appt

            def scalar(self):
                return 1

            def scalars(self):
                class MockScalars:
                    def all(self):
                        return [mock_appt]
                    def first(self):
                        return mock_appt
                return MockScalars()

        return MockResult()

    def add(self, entity):
        entity.id = mock_appt_id
        entity.created_at = datetime.now(timezone.utc)

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass


def test_list_appointments_unauthorized():
    response = client.get("/api/v1/appointments/")
    assert response.status_code == 401


def test_list_appointments_with_mock_db():
    async def override_get_db():
        yield MockDbSessionAppointments()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.get("/api/v1/appointments/?status=scheduled")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] == 1
    assert data["items"][0]["attendee_name"] == "Emily Davis"
    assert data["items"][0]["status"] == "scheduled"


def test_create_appointment_booking():
    async def override_get_db():
        yield MockDbSessionAppointments()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    payload = {
        "attendee_name": "Emily Davis",
        "attendee_email": "emily.davis@client.org",
        "scheduled_at": "2026-09-20T15:00:00Z",
        "duration_minutes": 30,
        "notes": "Consultation booking"
    }
    response = client.post("/api/v1/appointments/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["attendee_name"] == "Emily Davis"
    assert data["status"] == "scheduled"
    assert data["meeting_link"] is not None


def test_cancel_appointment():
    async def override_get_db():
        yield MockDbSessionAppointments()

    async def override_user():
        return mock_user

    async def override_org():
        return mock_org

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org

    response = client.patch(f"/api/v1/appointments/{mock_appt_id}/cancel")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"
