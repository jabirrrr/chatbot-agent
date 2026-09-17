import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

def normalize_database_url_and_connect_args(raw_url: str) -> tuple[str, dict]:
    """
    Normalizes database URL and connection arguments for asyncpg:
    1. Converts postgres:// or postgresql:// to postgresql+asyncpg://
    2. Strips unsupported connection parameters from query string (e.g. sslmode)
       and properly configures connect_args['ssl'].
    3. Configures statement_cache_size=0 for transaction poolers (PgBouncer, Supabase).
    """
    if not raw_url:
        return raw_url, {}

    url = raw_url
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    connect_args = {}
    if getattr(settings, "DB_STATEMENT_CACHE_SIZE", 0) == 0:
        # Disable prepared statement cache for transaction poolers (PgBouncer, Neon, Supabase)
        connect_args["statement_cache_size"] = 0

    try:
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)

        # Map sslmode/ssl to connect_args['ssl'] (asyncpg does not accept sslmode keyword)
        if "sslmode" in query_params:
            mode = query_params.pop("sslmode")[0]
            if mode in ("require", "verify-ca", "verify-full"):
                connect_args["ssl"] = "require"
            elif mode == "disable":
                connect_args["ssl"] = False

        if "ssl" in query_params:
            ssl_val = query_params.pop("ssl")[0]
            if ssl_val.lower() in ("require", "true", "1"):
                connect_args["ssl"] = "require"

        if getattr(settings, "POSTGRES_SSL_MODE", None):
            connect_args["ssl"] = settings.POSTGRES_SSL_MODE
        elif ("sslmode=require" in url or "ssl=require" in url) and "ssl" not in connect_args:
            connect_args["ssl"] = "require"

        # Reconstruct cleaned database URL without unsupported asyncpg query params
        clean_query = urlencode([(k, v[0]) for k, v in query_params.items()])
        url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            clean_query,
            parsed.fragment
        ))
    except Exception:
        pass

    return url, connect_args


database_url_clean, connect_args = normalize_database_url_and_connect_args(settings.DATABASE_ASYNC_URL)


# Check if running in a serverless function environment (e.g. Vercel)
is_serverless = bool(os.environ.get("VERCEL")) or settings.ENVIRONMENT == "production"

# In serverless environments, use conservative pool size to avoid connection exhaustion
pool_size = 2 if is_serverless else getattr(settings, "DB_POOL_SIZE", 5)
max_overflow = 5 if is_serverless else getattr(settings, "DB_MAX_OVERFLOW", 10)

# Create Async Engine
engine = create_async_engine(
    database_url_clean,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=getattr(settings, "DB_POOL_TIMEOUT", 30),
    connect_args=connect_args
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

# Declarative Base for all SQLAlchemy models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session per request.
    Automatically rolls back on uncaught exceptions and guards session lifecycle.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            if session.is_active:
                await session.commit()
        except Exception:
            if session.is_active:
                try:
                    await session.rollback()
                except Exception:
                    pass
            raise
        finally:
            await session.close()

