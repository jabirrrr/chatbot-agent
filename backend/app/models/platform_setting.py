from sqlalchemy import Column, String, Integer, Boolean, CheckConstraint
from app.models.base import Base, TimestampMixin

class PlatformSetting(Base, TimestampMixin):
    """
    Singleton configuration table for platform-wide settings.
    Enforced to have exactly one row using a CHECK constraint.
    """
    __tablename__ = "platform_settings"
    
    # Enforce singleton
    id = Column(Integer, primary_key=True, default=1)
    
    allow_signups = Column(Boolean, default=True, nullable=False)
    max_tenants_allowed = Column(Integer, default=1000, nullable=False)
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    maintenance_message = Column(String(255), default="System is under maintenance. Please check back later.", nullable=False)

    __table_args__ = (
        CheckConstraint('id = 1', name='platform_settings_id_check'),
    )
