from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class EventHistoryItem(BaseModel):
    event: str = Field(..., examples=["app_open"])
    timestamp: Optional[datetime] = None


class DecideRequest(BaseModel):
    user_id: str
    event_history: List[EventHistoryItem] = []
    message: str


class DecideResponseData(BaseModel):
    tenant_id: int
    user_id: str
    notification_id: int
    should_send: bool
    status: str
    best_time: datetime
    confidence: float
    reason: str
    message: str
