from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from datetime import datetime, timezone
from app.config.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index= True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), primary_key=True, index=True, default=1)
    name= Column(String, nullable = True)
    age = Column(Integer, nullable=True)
    country = Column(String, nullable=True)
    device = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
