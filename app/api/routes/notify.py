from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.models.user import User
from app.models.notification import Notification
from app.config.database import get_db

router = APIRouter()

class NotificationRequest(BaseModel):
    user_id: str
    message: str
    type: Optional[str] ="general"


@router.post("/")
def create_notification(request: NotificationRequest, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.user_id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail = "User not found")
    
    notification = Notification(
        user_id = request.user_id,
        message = request.message,
        type = request.type,
        status = "pending",
        scheduled_time = datetime.now(timezone.utc)
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)
    return {
        "status" : "success",
        "message" : "Notification scheduled",
        "data" : {
            "id" : notification.id,
            "user_id" : notification.user_id,
            "message" : notification.message,
            "type" : notification.type,
            "status" : notification.status,
            "scheduled_time" : notification.scheduled_time
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