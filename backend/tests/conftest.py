import pytest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set testing environment variables
os.environ["ENVIRONMENT"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-min-32-chars-long-for-jwt-signing"


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    from app.main import app
    from app.core.rate_limit import limiter
    limiter.reset()
    app.dependency_overrides.clear()
    yield
    limiter.reset()
    app.dependency_overrides.clear()

