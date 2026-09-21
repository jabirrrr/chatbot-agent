import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base
from app.schemas.platform_integration import ProviderEnum
import sqlalchemy as sa

class PlatformIntegration(Base):
    __tablename__ = "platform_integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    provider = Column(sa.Enum(ProviderEnum, native_enum=False), nullable=False) # e.g. "openai", "openrouter", "stripe"
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Encrypted API key or credentials
    encrypted_credentials = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
