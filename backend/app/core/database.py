import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Build connection arguments for asyncpg
connect_args = {}
if getattr(settings, "DB_STATEMENT_CACHE_SIZE", 0) == 0:
    # Disable prepared statement cache for transaction poolers (PgBouncer, Neon, Supabase)
    connect_args["statement_cache_size"] = 0

if getattr(settings, "POSTGRES_SSL_MODE", None):
    connect_args["ssl"] = settings.POSTGRES_SSL_MODE
elif "sslmode=require" in settings.DATABASE_ASYNC_URL or "ssl=require" in settings.DATABASE_ASYNC_URL:
    connect_args["ssl"] = "require"

# Check if running in a serverless function environment (e.g. Vercel)
is_serverless = bool(os.environ.get("VERCEL")) or settings.ENVIRONMENT == "production"

# In serverless environments, use conservative pool size to avoid connection exhaustion
pool_size = 2 if is_serverless else getattr(settings, "DB_POOL_SIZE", 5)
max_overflow = 5 if is_serverless else getattr(settings, "DB_MAX_OVERFLOW", 10)

# Create Async Engine
engine = create_async_engine(
    settings.DATABASE_ASYNC_URL,
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
    Automatically rolls back on uncaught exceptions.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
