import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.schemas.admin_health import (
    AdminComponentHealth,
    AdminErrorLog,
    AdminHealthResponse,
    ComponentStatus,
    OverallStatus
)


def _sanitize_error_message(msg: str) -> str:
    """Removes sensitive credentials, URLs with passwords, and tokens from error messages."""
    if not msg:
        return ""
    # Strip postgresql://user:pass@host/db or redis://:pass@host/db
    sanitized = re.sub(r'(postgresql|postgres|redis|rediss):\/\/[^@\s]+@', r'\1://***@', str(msg))
    # Strip bearer tokens or passwords
    sanitized = re.sub(r'(bearer\s+|password\s*=\s*|secret\s*=\s*)[^\s,;]+', r'\1***', sanitized, flags=re.IGNORECASE)
    return sanitized


async def check_api_application() -> AdminComponentHealth:
    """
    Measures application response and event loop latency for the FastAPI process.
    Note: Measures application processing health, not external edge gateway latency.
    """
    now = datetime.now(timezone.utc)
    t0 = time.perf_counter()
    await asyncio.sleep(0.0001)
    latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    
    return AdminComponentHealth(
        name="API / Application",
        status="healthy",
        latency_ms=latency_ms,
        uptime="No historical data",
        details=f"FastAPI application runtime responsive on {settings.ENVIRONMENT} environment.",
        checked_at=now
    )


async def check_database(db: Optional[AsyncSession] = None) -> AdminComponentHealth:
    """
    Executes a real SELECT 1 query on PostgreSQL and measures monotonic latency.
    Guaranteed to never raise an unhandled exception or crash the health endpoint.
    If database fails or times out, returns status="down" with sanitized error.
    """
    now = datetime.now(timezone.utc)
    t0 = time.perf_counter()
    try:
        if db is not None:
            async def _run_session():
                return await db.execute(text("SELECT 1"))
            await asyncio.wait_for(_run_session(), timeout=3.5)
        else:
            from app.core.database import engine
            async def _run_engine():
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
            await asyncio.wait_for(_run_engine(), timeout=3.5)

        latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        return AdminComponentHealth(
            name="Main Database (PostgreSQL)",
            status="healthy",
            latency_ms=latency_ms,
            uptime="No historical data",
            details="PostgreSQL active connection ping (SELECT 1).",
            checked_at=now
        )
    except Exception as exc:
        if db is not None:
            try:
                await db.rollback()
            except Exception:
                pass
        sanitized_msg = _sanitize_error_message(str(exc))
        return AdminComponentHealth(
            name="Main Database (PostgreSQL)",
            status="down",
            latency_ms=None,
            uptime="No historical data",
            details=f"Database query failed: {sanitized_msg}",
            checked_at=now
        )


async def check_redis() -> AdminComponentHealth:
    """
    Checks Redis connectivity via real PING if configured.
    Accurately reports NOT CONFIGURED or DEGRADED without fabricating uptime.
    Guaranteed to never raise an unhandled exception or crash the health endpoint.
    """
    import os
    now = datetime.now(timezone.utc)
    redis_url = getattr(settings, "REDIS_URL", None)
    is_serverless = bool(os.environ.get("VERCEL")) or settings.ENVIRONMENT == "production"
    
    # Check if Redis is missing, empty, disabled, or default localhost in serverless/production
    if (
        not redis_url 
        or redis_url in ("", "none", "disabled") 
        or (("localhost" in redis_url or "127.0.0.1" in redis_url) and is_serverless)
    ):
        return AdminComponentHealth(
            name="Redis Cache",
            status="not_configured",
            latency_ms=None,
            uptime="No historical data",
            details="Redis cache is not configured for this deployment.",
            checked_at=now
        )

    client = None
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(
            redis_url,
            socket_connect_timeout=1.5,
            socket_timeout=1.5
        )
        t0 = time.perf_counter()
        await asyncio.wait_for(client.ping(), timeout=2.0)
        latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        
        return AdminComponentHealth(
            name="Redis Cache",
            status="healthy",
            latency_ms=latency_ms,
            uptime="No historical data",
            details="Redis cache responsive to PING.",
            checked_at=now
        )
    except Exception as exc:
        sanitized = _sanitize_error_message(str(exc))
        return AdminComponentHealth(
            name="Redis Cache",
            status="degraded",
            latency_ms=None,
            uptime="No historical data",
            details=f"Redis check: {sanitized}",
            checked_at=now
        )
    finally:
        if client is not None:
            try:
                await client.aclose()
            except Exception:
                pass


def check_background_workers() -> AdminComponentHealth:
    """
    Accurately reports background worker status for the serverless/Vercel deployment.
    Never fabricates fake workers, uptime, or queue statistics.
    """
    now = datetime.now(timezone.utc)
    return AdminComponentHealth(
        name="Background Workers",
        status="not_configured",
        latency_ms=None,
        uptime="No historical data",
        details="No persistent background worker is configured for this deployment.",
        checked_at=now
    )


def calculate_overall_status(components: Dict[str, AdminComponentHealth]) -> OverallStatus:
    """
    Calculates overall system status strictly based on real component health:
    - Required components: API / Application and PostgreSQL
    - If required component is down -> down
    - If any component is degraded (or optional Redis is down) -> degraded
    - If required components are healthy and optional components are healthy or not_configured -> healthy
    """
    db_status = components.get("database")
    api_status = components.get("api")
    
    # Required component outages produce overall down
    if db_status and db_status.status == "down":
        return "down"
    if api_status and api_status.status == "down":
        return "down"
        
    # Any degraded component produces overall degraded
    if db_status and db_status.status == "degraded":
        return "degraded"
    if api_status and api_status.status == "degraded":
        return "degraded"

    redis_status = components.get("redis")
    if redis_status and (redis_status.status in ("degraded", "down")):
        return "degraded"

    if (api_status and api_status.status == "healthy") and (db_status and db_status.status == "healthy"):
        return "healthy"

    return "unknown"


async def get_admin_health_telemetry(db: AsyncSession) -> AdminHealthResponse:
    """Collects and aggregates real infrastructure health data across all monitored components."""
    now = datetime.now(timezone.utc)

    # Run component checks
    api_health = await check_api_application()
    db_health = await check_database(db)
    redis_health = await check_redis()
    worker_health = check_background_workers()

    components = {
        "api": api_health,
        "database": db_health,
        "redis": redis_health,
        "workers": worker_health
    }

    overall = calculate_overall_status(components)

    # In serverless/Vercel environments, in-memory process buffers do not constitute
    # persistent production telemetry. There is no dedicated error table or Sentry Issue query client.
    # Therefore, truthfully report that no persistent error telemetry provider is configured.
    return AdminHealthResponse(
        overall_status=overall,
        checked_at=now,
        components=components,
        recent_errors=[],
        has_persistent_error_telemetry=False,
        environment=settings.ENVIRONMENT
    )
