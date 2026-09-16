import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User
from app.models.organization import Organization
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation, Message
from app.services.conversation_service import ConversationService

client = TestClient(app)

# Organizations
org_1_id = uuid.uuid4()
org_2_id = uuid.uuid4()

org_1 = Organization(id=org_1_id, name="Acme Primary Corp", slug="acme-primary")
org_2 = Organization(id=org_2_id, name="Beta Secondary Corp", slug="beta-secondary")

# Users
user_org_1 = User(
    id=uuid.uuid4(),
    email="admin@acme.com",
    hashed_password="argon2id_mock_hash",
    full_name="Acme Admin",
    is_active=True,
    is_verified=True
)

# Chatbots
# Chatbot A and Chatbot B in Org 1
bot_a_id = uuid.uuid4()
bot_a_token = "wgt_bot_alpha_token_111"
bot_a = Chatbot(
    id=bot_a_id,
    organization_id=org_1_id,
    name="Support Bot Alpha",
    welcome_message="Welcome to Support Bot Alpha!",
    theme_color="#3b82f6",
    position="bottom-right",
    is_active=True,
    widget_token=bot_a_token,
    system_prompt="You are Alpha.",
    fallback_message="Alpha cannot answer that."
)

bot_b_id = uuid.uuid4()
bot_b_token = "wgt_bot_beta_token_222"
bot_b = Chatbot(
    id=bot_b_id,
    organization_id=org_1_id,
    name="Sales Bot Beta",
    welcome_message="Welcome to Sales Bot Beta!",
    theme_color="#10b981",
    position="bottom-left",
    is_active=True,
    widget_token=bot_b_token,
    system_prompt="You are Beta.",
    fallback_message="Beta cannot answer that."
)

# Chatbot C in Org 2
bot_c_id = uuid.uuid4()
bot_c_token = "wgt_bot_gamma_token_333"
bot_c = Chatbot(
    id=bot_c_id,
    organization_id=org_2_id,
    name="Org2 Bot Gamma",
    welcome_message="Welcome to Gamma in Org2!",
    theme_color="#ef4444",
    position="bottom-right",
    is_active=True,
    widget_token=bot_c_token,
    system_prompt="You are Gamma.",
    fallback_message="Gamma cannot answer that."
)


class InMemoryIsolationDB:
    """In-memory DB mock specifically tracking entities and relationships for isolation tests."""
    def __init__(self):
        self.chatbots = {
            bot_a.id: bot_a,
            bot_b.id: bot_b,
            bot_c.id: bot_c,
        }
        self.tokens = {
            bot_a_token: bot_a,
            bot_b_token: bot_b,
            bot_c_token: bot_c,
        }
        self.conversations = {}
        self.messages = {}

    def add(self, entity):
        if isinstance(entity, Conversation):
            if not entity.id:
                entity.id = uuid.uuid4()
            if not entity.session_token:
                entity.session_token = f"ses_{uuid.uuid4().hex}"
            if not entity.created_at:
                entity.created_at = datetime.now(timezone.utc)
            if not entity.updated_at:
                entity.updated_at = datetime.now(timezone.utc)
            self.conversations[entity.id] = entity
        elif isinstance(entity, Message):
            if not entity.id:
                entity.id = uuid.uuid4()
            if not entity.created_at:
                entity.created_at = datetime.now(timezone.utc)
            self.messages[entity.id] = entity

    async def commit(self):
        pass

    async def refresh(self, entity):
        pass

    async def execute(self, stmt):
        stmt_str = str(stmt).lower()
        try:
            params = stmt.compile().params
        except Exception:
            params = {}

        # Universal result wrapper
        class UniversalResult:
            def __init__(self, item=None, items=None):
                self._item = item
                self._items = items if items is not None else ([item] if item is not None else [])

            def scalar_one_or_none(self):
                return self._item

            def scalar(self):
                return self._item

            def scalars(self):
                items = self._items
                class UniversalScalars:
                    def all(self):
                        return items
                    def first(self):
                        return items[0] if items else None
                return UniversalScalars()

        # 1. Widget token lookup
        for k, v in params.items():
            if "widget_token" in k and v in self.tokens:
                return UniversalResult(item=self.tokens[v])

        # 2. Conversation query (lookup by session_token or chatbot_id/visitor_id)
        if "conversations" in stmt_str:
            # By session_token
            for k, v in params.items():
                if "session_token" in k:
                    found = next((c for c in self.conversations.values() if c.session_token == v), None)
                    return UniversalResult(item=found)

            # By chatbot_id & visitor_id
            target_bot_id = None
            target_visitor_id = None
            for k, v in params.items():
                if "chatbot_id" in k:
                    target_bot_id = v
                if "visitor_id" in k:
                    target_visitor_id = v

            matched_conv = next(
                (c for c in self.conversations.values()
                 if (target_bot_id is None or c.chatbot_id == target_bot_id)
                 and (target_visitor_id is None or c.visitor_id == target_visitor_id)
                 and c.status == "active"),
                None
            )
            return UniversalResult(item=matched_conv)

        # 3. Chatbot lookup by id
        if "chatbots" in stmt_str:
            for k, v in params.items():
                if v in self.chatbots:
                    return UniversalResult(item=self.chatbots[v])

        # 4. Messages lookup by conversation_id
        if "messages" in stmt_str:
            conv_id_target = None
            for k, v in params.items():
                if "conversation_id" in k:
                    conv_id_target = v
            matched_msgs = [m for m in self.messages.values() if m.conversation_id == conv_id_target]
            return UniversalResult(items=matched_msgs)

        return UniversalResult()


db_mock = InMemoryIsolationDB()


@pytest.fixture(autouse=True)
def setup_isolation_db_override():
    async def override_db():
        yield db_mock

    async def override_user():
        return user_org_1

    async def override_org():
        return org_1

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_current_organization] = override_org
    yield
    app.dependency_overrides.clear()


def test_independent_conversations_per_chatbot():
    """
    Scenario 1 & 2:
    - Visitor starts conversation on Chatbot A.
    - Visitor switches to Chatbot B.
    - Verify completely different conversation IDs and session tokens are issued.
    """
    visitor_id = "visitor_shared_browser_001"

    # Step 1: Start Chatbot A session
    res_a = client.post("/api/v1/widget/session", json={
        "widget_token": bot_a_token,
        "visitor_id": visitor_id
    })
    assert res_a.status_code == 201
    data_a = res_a.json()
    assert data_a["chatbot_name"] == "Support Bot Alpha"
    session_token_a = data_a["session_token"]
    conv_id_a = data_a["conversation_id"]

    # Add message to Chatbot A
    msg_a = Message(
        id=uuid.uuid4(),
        organization_id=org_1_id,
        conversation_id=uuid.UUID(conv_id_a),
        sender_type="visitor",
        content="Hi Alpha, I need support!"
    )
    db_mock.add(msg_a)

    # Step 2: Switch to Chatbot B (same visitor)
    res_b = client.post("/api/v1/widget/session", json={
        "widget_token": bot_b_token,
        "visitor_id": visitor_id
    })
    assert res_b.status_code == 201
    data_b = res_b.json()
    assert data_b["chatbot_name"] == "Sales Bot Beta"
    session_token_b = data_b["session_token"]
    conv_id_b = data_b["conversation_id"]

    # Step 3: Verify strict isolation
    assert conv_id_a != conv_id_b, "Chatbot B must have an independent conversation ID!"
    assert session_token_a != session_token_b, "Chatbot B must have an independent session token!"
    assert len(data_b["messages"]) == 0, "Chatbot B must NOT contain Chatbot A's messages!"


def test_cross_chatbot_message_injection_prevention():
    """
    Scenario 3 & 4:
    - Attempting to send a message targeting Chatbot B using Chatbot A's conversation session must fail with 403 Forbidden.
    """
    visitor_id = "visitor_cross_attack_002"

    # Create session for Chatbot A
    res_a = client.post("/api/v1/widget/session", json={
        "widget_token": bot_a_token,
        "visitor_id": visitor_id
    })
    session_token_a = res_a.json()["session_token"]

    # Attempt to post a message with session_token_a but asserting chatbot_id = bot_b_id
    res_malicious = client.post("/api/v1/widget/message", json={
        "session_token": session_token_a,
        "message": "Attempt cross-bot message bleed",
        "chatbot_id": str(bot_b_id)
    })
    assert res_malicious.status_code == 403
    assert "Conversation does not belong to the requested chatbot" in res_malicious.json()["detail"]


def test_session_restoration_is_chatbot_scoped():
    """
    Scenario 5:
    - When returning to Chatbot A, it restores Chatbot A's conversation, NOT Chatbot B's conversation.
    """
    visitor_id = "visitor_returning_003"

    # 1. Start Chatbot A
    res_a = client.post("/api/v1/widget/session", json={
        "widget_token": bot_a_token,
        "visitor_id": visitor_id
    })
    conv_id_a = res_a.json()["conversation_id"]

    # 2. Start Chatbot B
    res_b = client.post("/api/v1/widget/session", json={
        "widget_token": bot_b_token,
        "visitor_id": visitor_id
    })
    conv_id_b = res_b.json()["conversation_id"]

    # 3. Return to Chatbot A
    res_a_return = client.post("/api/v1/widget/session", json={
        "widget_token": bot_a_token,
        "visitor_id": visitor_id
    })
    conv_id_a_restored = res_a_return.json()["conversation_id"]

    # Must restore Chatbot A's conversation
    assert conv_id_a_restored == conv_id_a
    assert conv_id_a_restored != conv_id_b


@pytest.mark.asyncio
async def test_service_level_chatbot_isolation():
    """
    Validates ConversationService filtering:
    - get_conversation with matching chatbot_id succeeds.
    - get_conversation with mismatched chatbot_id returns None (preventing leak).
    """
    class MockAsyncServiceDB:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            try:
                params = stmt.compile().params
            except Exception:
                params = {}
            
            # Check chatbot_id parameter in where clause
            for k, v in params.items():
                if "chatbot_id" in k:
                    if v == bot_a_id:
                        class MatchResult:
                            def scalar_one_or_none(self_s):
                                return Conversation(
                                    id=uuid.uuid4(),
                                    organization_id=org_1_id,
                                    chatbot_id=bot_a_id,
                                    status="active"
                                )
                        return MatchResult()
                    else:
                        # Mismatched chatbot_id
                        class NoneResult:
                            def scalar_one_or_none(self_s):
                                return None
                        return NoneResult()

            class DefaultResult:
                def scalar_one_or_none(self_s):
                    return None
            return DefaultResult()

    service_db = MockAsyncServiceDB()
    test_conv_id = uuid.uuid4()

    # Query with correct chatbot_id
    matched = await ConversationService.get_conversation(
        db=service_db,
        organization_id=org_1_id,
        conversation_id=test_conv_id,
        chatbot_id=bot_a_id
    )
    assert matched is not None
    assert matched.chatbot_id == bot_a_id

    # Query with mismatched chatbot_id (Chatbot B)
    mismatched = await ConversationService.get_conversation(
        db=service_db,
        organization_id=org_1_id,
        conversation_id=test_conv_id,
        chatbot_id=bot_b_id
    )
    assert mismatched is None, "Service must deny conversation access when chatbot_id does not match!"


def test_conversation_thread_endpoint_chatbot_scoping():
    """
    Validates GET /api/v1/conversations/{id}?chatbot_id=...
    - When chatbot_id matches, returns the conversation thread (200).
    - When chatbot_id is for a different bot, returns 404 Not Found.
    """
    conv_id = uuid.uuid4()
    test_conv = Conversation(
        id=conv_id,
        organization_id=org_1_id,
        chatbot_id=bot_a_id,
        visitor_id="vis_thread_test_1",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    class MockThreadDB:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            try:
                params = stmt.compile().params
            except Exception:
                params = {}

            class ThreadResult:
                def scalar_one_or_none(self_s):
                    # Check if chatbot_id was filtered and matches bot_a
                    for k, v in params.items():
                        if "chatbot_id" in k and v != bot_a_id:
                            return None
                    return test_conv

                def scalars(self_s):
                    class ThreadScalars:
                        def all(self_ss):
                            return []
                        def first(self_ss):
                            return test_conv
                    return ThreadScalars()

            return ThreadResult()

    async def override_thread_db():
        yield MockThreadDB()

    app.dependency_overrides[get_db] = override_thread_db

    # 1. Access with correct chatbot_id
    res_correct = client.get(f"/api/v1/conversations/{conv_id}?chatbot_id={bot_a_id}")
    assert res_correct.status_code == 200
    assert res_correct.json()["chatbot_id"] == str(bot_a_id)

    # 2. Access with wrong chatbot_id (Chatbot B)
    res_wrong_bot = client.get(f"/api/v1/conversations/{conv_id}?chatbot_id={bot_b_id}")
    assert res_wrong_bot.status_code == 404
    assert res_wrong_bot.json()["detail"] == "Conversation not found"


def test_multi_tenant_conversation_isolation():
    """
    Validates that a user in Org 2 cannot view or access conversations in Org 1.
    """
    conv_id = uuid.uuid4()
    test_conv = Conversation(
        id=conv_id,
        organization_id=org_1_id,  # Belongs to Org 1
        chatbot_id=bot_a_id,
        visitor_id="vis_tenant_test",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    class MockTenantDB:
        async def execute(self, stmt):
            try:
                params = stmt.compile().params
            except Exception:
                params = {}

            class TenantResult:
                def scalar_one_or_none(self_s):
                    # Enforce organization_id match
                    for k, v in params.items():
                        if "organization_id" in k and v != test_conv.organization_id:
                            return None
                    return test_conv

                def scalars(self_s):
                    class TenantScalars:
                        def all(self_ss):
                            return []
                        def first(self_ss):
                            return None
                    return TenantScalars()

            return TenantResult()

    async def override_tenant_db():
        yield MockTenantDB()

    async def override_user_org2():
        return User(id=uuid.uuid4(), email="org2@beta.com", is_active=True)

    async def override_org2():
        return org_2  # Org 2 context

    app.dependency_overrides[get_db] = override_tenant_db
    app.dependency_overrides[get_current_user] = override_user_org2
    app.dependency_overrides[get_current_organization] = override_org2

    # Org 2 user tries to get conversation from Org 1
    res = client.get(f"/api/v1/conversations/{conv_id}")
    assert res.status_code == 404
    assert res.json()["detail"] == "Conversation not found"

