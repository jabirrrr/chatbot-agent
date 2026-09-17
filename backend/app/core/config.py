import os
import json
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Helio Chatbot Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security & Cryptography
    SECRET_KEY: str = "super-secret-development-key-change-in-production-min-32-chars-long"
    VAULT_SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS & Allowed Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    CORS_ORIGIN_REGEX: Optional[str] = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$|^https://.*\.vercel\.app$"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    # PostgreSQL Database
    DATABASE_ASYNC_URL: str = "postgresql+asyncpg://helio_user:helio_secure_password@localhost:5432/helio_db"
    DATABASE_URL: str = "postgresql://helio_user:helio_secure_password@localhost:5432/helio_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_STATEMENT_CACHE_SIZE: int = 0
    POSTGRES_SSL_MODE: Optional[str] = None

    # Redis Cache & Broker
    REDIS_URL: str = "redis://localhost:6379/0"

    # Object Storage (MinIO)
    STORAGE_PROVIDER: str = "minio"
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_ROOT_USER: str = "minio_admin"
    MINIO_ROOT_PASSWORD: str = "minio_secure_password"
    MINIO_BUCKET: str = "helio-documents"
    STORAGE_LOCAL_DIR: Optional[str] = None

    # Transactional Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "notifications@helio.ai"
    EMAILS_FROM_NAME: str = "Helio Assistant"

    # AI Gateways
    OPENROUTER_API_KEY: str = "sk-or-v1-mock-test-key"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENAI_API_KEY: str = "sk-mock-openai-key"

    # Google OAuth & Calendar Integration
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/integrations/google-calendar/callback"
    FRONTEND_URL: str = "http://localhost:3000"

    # Error Monitoring (Sentry)
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1
    SENTRY_ENVIRONMENT: str = "production"

    @model_validator(mode="after")
    def validate_production_and_vercel_defaults(self):
        vercel_url = os.environ.get("VERCEL_URL")
        # If running on Vercel and domain is still localhost default, auto-configure production URL
        if vercel_url:
            canonical_frontend = f"https://{vercel_url}"
            if "localhost" in self.FRONTEND_URL:
                self.FRONTEND_URL = canonical_frontend
            if "localhost" in self.GOOGLE_REDIRECT_URI:
                self.GOOGLE_REDIRECT_URI = f"{canonical_frontend}/api/v1/integrations/google-calendar/callback"
            if canonical_frontend not in self.BACKEND_CORS_ORIGINS:
                self.BACKEND_CORS_ORIGINS.append(canonical_frontend)

        # If FRONTEND_URL is explicitly set to production domain and GOOGLE_REDIRECT_URI is still localhost default
        if self.FRONTEND_URL and "localhost" not in self.FRONTEND_URL and "localhost" in self.GOOGLE_REDIRECT_URI:
            self.GOOGLE_REDIRECT_URI = f"{self.FRONTEND_URL.rstrip('/')}/api/v1/integrations/google-calendar/callback"

        # Ensure FRONTEND_URL is always included in allowed CORS origins
        if self.FRONTEND_URL and self.FRONTEND_URL not in self.BACKEND_CORS_ORIGINS:
            self.BACKEND_CORS_ORIGINS.append(self.FRONTEND_URL)

        # If running in Vercel environment and ENVIRONMENT is still default development, promote to production
        if os.environ.get("VERCEL") and self.ENVIRONMENT == "development":
            self.ENVIRONMENT = "production"

        # Resolve production database URL from any standard Vercel / Supabase environment variable
        for candidate_url in [
            getattr(self, "DATABASE_ASYNC_URL", None),
            getattr(self, "DATABASE_URL", None),
            getattr(self, "SUPABASE_DATABASE_URL", None),
            getattr(self, "SUPABASE_DIRECT_DATABASE_URL", None),
            getattr(self, "POSTGRES_URL", None),
            os.environ.get("DATABASE_ASYNC_URL"),
            os.environ.get("DATABASE_URL"),
            os.environ.get("SUPABASE_DATABASE_URL"),
            os.environ.get("SUPABASE_DIRECT_DATABASE_URL"),
            os.environ.get("POSTGRES_URL"),
        ]:
            if candidate_url and "localhost" not in candidate_url:
                raw = candidate_url.strip().strip("'").strip('"')
                if raw.startswith("postgres://"):
                    self.DATABASE_ASYNC_URL = "postgresql+asyncpg://" + raw[len("postgres://"):]
                elif raw.startswith("postgresql://") and not raw.startswith("postgresql+asyncpg://"):
                    self.DATABASE_ASYNC_URL = "postgresql+asyncpg://" + raw[len("postgresql://"):]
                else:
                    self.DATABASE_ASYNC_URL = raw
                break

        # Ensure DATABASE_ASYNC_URL uses asyncpg scheme
        if self.DATABASE_ASYNC_URL.startswith("postgres://"):
            self.DATABASE_ASYNC_URL = "postgresql+asyncpg://" + self.DATABASE_ASYNC_URL[len("postgres://"):]
        elif self.DATABASE_ASYNC_URL.startswith("postgresql://") and not self.DATABASE_ASYNC_URL.startswith("postgresql+asyncpg://"):
            self.DATABASE_ASYNC_URL = "postgresql+asyncpg://" + self.DATABASE_ASYNC_URL[len("postgresql://"):]

        return self

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
