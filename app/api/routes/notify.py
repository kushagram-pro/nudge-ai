from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.config.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.models.event import Event

from app.decision_engine.rules import should_send_now, get_scheduled_time

router = APIRouter()


# Request Schema
class NotificationRequest(BaseModel):
    user_id: str
    message: str
    type: Optional[str] = "general"


@router.post("/")
def create_notification(request: NotificationRequest, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch user events
    user_events = db.query(Event).filter(Event.user_id == request.user_id).all()

    # Decision Engine
    should_send, reason = should_send_now(user_events)

    if should_send:
        scheduled_time = datetime.now(timezone.utc)
        status = "ready"
    else:
        scheduled_time = get_scheduled_time(user_events)
        status = "scheduled"

    # Create notification
    notification = Notification(
        user_id=request.user_id,
        message=request.message,
        type=request.type,
        status=status,
        scheduled_time=scheduled_time
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "status": "success",
        "decision": {
            "should_send": should_send,
            "reason": reason,
            "scheduled_time": scheduled_time
        },
        "data": {
            "id": notification.id,
            "user_id": notification.user_id,
            "message": notification.message,
            "type": notification.type,
            "status": notification.status,
            "scheduled_time": notification.scheduled_time.isoformat()
        }
    }


@router.get("/")
def get_notifications(db: Session = Depends(get_db)):
    notifications = db.query(Notification).all()

    return {
        "total_notifications": len(notifications),
        "notifications": [
            {
                "id": n.id,
                "user_id": n.user_id,
                "message": n.message,
                "type": n.type,
                "status": n.status,
                "scheduled_time": n.scheduled_time
            }
            for n in notifications
        ]
    }