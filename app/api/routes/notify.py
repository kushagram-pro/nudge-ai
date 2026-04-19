from fastapi import APIRouter, HTTPException
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class NotificationRequest(BaseModel):
    user_id: str
    message: str
    type: Optional[str] ="general"

NOTIFICATION_STORE = []

@router.post("/")
def create_notification(request: NotificationRequest):
    try:
        notification = {
            "user_id" : request.user_id,
            "message" : request.message,
            "type" : request.type,
            "status" : "scheduled",
            "scheduled_time" : datetime.utcnow()
        }

        NOTIFICATION_STORE.append(notification)

        return {
            "status" : "success",
            "message" : "Notification received", 
            "decision" : {
                "should_send" : True,
                "scheduled_time" : notification["scheduled_time"]
            },
            "data" : notification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
def get_notifications():
    return {
        "total_notifications" : len(NOTIFICATION_STORE),
        "notifications" : NOTIFICATION_STORE
    }