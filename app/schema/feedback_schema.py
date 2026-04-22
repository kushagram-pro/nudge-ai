from pydantic import BaseModel, Field


class FeedbackRequest(BaseModel):
    user_id: str
    notification_id: int
    action: str = Field(..., pattern="^(clicked|opened|ignored)$")
