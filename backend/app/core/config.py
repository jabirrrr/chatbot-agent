from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    APP_NAME: str = "Helio Chatbot Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Security & Cryptography
    SECRET_KEY: str = "super-secret-development-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    # PostgreSQL Database
    DATABASE_ASYNC_URL: str = "postgresql+asyncpg://helio_user:helio_secure_password@localhost:5432/helio_db"
    DATABASE_URL: str = "postgresql://helio_user:helio_secure_password@localhost:5432/helio_db"

    # Redis Cache & Broker
    REDIS_URL: str = "redis://localhost:6379/0"

    # Object Storage (MinIO)
    STORAGE_PROVIDER: str = "minio"
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_ROOT_USER: str = "minio_admin"
    MINIO_ROOT_PASSWORD: str = "minio_secure_password"
    MINIO_BUCKET: str = "helio-documents"

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )


settings = Settings()
