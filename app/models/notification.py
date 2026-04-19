from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.config.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="general")

    status = Column(String, default="pending")  # pending, sent, failed

    scheduled_time = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )