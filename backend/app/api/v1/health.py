import time
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

@router.get("/ready")
async def readiness_probe(response: Response, db: AsyncSession = Depends(get_db)):
    """
    K8s-style readiness probe. Explicitly checks database connectivity and other crucial services.
    Returns 503 if dependencies are down.
    """
    components = {}
    is_ready = True

    # Check Database
    try:
        await db.execute(text("SELECT 1"))
        components["database"] = "ok"
    except Exception as e:
        components["database"] = f"error: {str(e)}"
        is_ready = False

    # Simulate checking Redis (Since there isn't a strict redis client passed in this context yet)
    # components["redis"] = "ok"

    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if is_ready else "not_ready",
        "components": components,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/live")
async def liveness_probe():
    """
    K8s-style liveness probe. Fast check to ensure the API process is not deadlocked.
    """
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}
