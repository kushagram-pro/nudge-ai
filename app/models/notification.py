from sqlalchemy import Column, Float, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.config.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, default=1)
    message = Column(String, nullable=False)
    type = Column(String, default="general")
    confidence = Column(Float, nullable=True)
    reason = Column(String, nullable=True)

    status = Column(String, default="pending")  # pending, sent, failed

    scheduled_time = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )
