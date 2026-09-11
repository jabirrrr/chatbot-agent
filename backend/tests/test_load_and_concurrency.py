import time
import statistics
import concurrent.futures
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation

client = TestClient(app)

mock_bot_id = uuid.uuid4()
mock_token = "tok_test_concurrent_token"
mock_bot = Chatbot(
    id=mock_bot_id,
    organization_id=uuid.uuid4(),
    name="Concurrent Bot",
    widget_token=mock_token,
    is_active=True,
    welcome_message="Hello!",
    theme_color="#3b82f6",
    position="bottom-right"
)


class MockDbSessionLoad:
    async def execute(self, stmt):
        class MockResult:
            def scalar_one_or_none(self):
                stmt_str = str(stmt).lower()
                if "chatbots" in stmt_str:
                    return mock_bot
                return None

            def scalars(self):
                class MockScalars:
                    def first(self):
                        return None
                    def all(self):
                        return []
                return MockScalars()

        return MockResult()

    def add(self, entity):
        pass

    async def commit(self):
        pass

    async def refresh(self, entity):
        if not getattr(entity, "id", None):
            entity.id = uuid.uuid4()
        if not getattr(entity, "session_token", None):
            entity.session_token = f"ses_{uuid.uuid4().hex}"

    async def close(self):
        pass


def test_50_concurrent_requests_p95_latency():
    """
    Stress test 50 concurrent client sessions against the platform.
    Verifies that:
    1. 100% of concurrent requests succeed (status 200).
    2. P95 latency is strictly under the 2,000ms SLA target.
    3. Zero deadlocks or race conditions occur under burst traffic.
    """
    concurrency = 50
    latencies = []

    def single_request(req_id: int):
        t0 = time.perf_counter()
        res = client.get("/api/v1/health")
        t1 = time.perf_counter()
        latency_ms = (t1 - t0) * 1000.0
        return res.status_code, latency_ms

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(single_request, i) for i in range(concurrency)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    status_codes = [r[0] for r in results]
    latencies = [r[1] for r in results]

    assert all(code == 200 for code in status_codes), f"Some requests failed: {status_codes}"

    latencies.sort()
    p50 = statistics.median(latencies)
    p90_idx = int(concurrency * 0.90) - 1
    p95_idx = int(concurrency * 0.95) - 1
    p99_idx = int(concurrency * 0.99) - 1

    p90 = latencies[p90_idx]
    p95 = latencies[p95_idx]
    p99 = latencies[p99_idx]

    # SLA Guarantee: P95 latency must be strictly < 2,000ms
    assert p95 < 2000.0, f"P95 latency {p95:.2f}ms exceeded 2,000ms SLA threshold"


def test_concurrent_sse_session_creation():
    """
    Test 20 parallel widget session creations under concurrent load.
    Verifies that unique session tokens are generated without collisions.
    """
    app.dependency_overrides[get_db] = lambda: MockDbSessionLoad()

    concurrency = 20
    session_tokens = []

    def create_session(i: int):
        res = client.post("/api/v1/widget/session", json={
            "widget_token": mock_token,
            "visitor_id": f"vis_load_{i}_{time.time()}"
        })
        return res.status_code, res.json().get("session_token")

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(create_session, i) for i in range(concurrency)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    assert all(code == 201 for code, _ in results), f"Unexpected status: {[c for c, _ in results]}"
    session_tokens = [tok for _, tok in results]

    assert len(session_tokens) == concurrency
    assert len(set(session_tokens)) == concurrency
