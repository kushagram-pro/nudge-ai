from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
from app.config.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index= True)
    name= Column(String, nullable = True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
