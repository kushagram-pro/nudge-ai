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
from app.scheduler.tasks import send_notification_task

from app.utils.response import success_response, error_response
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("notify_api")


class NotificationRequest(BaseModel):
    user_id: str
    message: str
    type: Optional[str] = "general"


@router.post("/")
def create_notification(request: NotificationRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"Received notification request for user={request.user_id}")

        # Check if user exists
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            logger.error(f"User not found: {request.user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch user events
        user_events = db.query(Event).filter(Event.user_id == request.user_id).all()

        # Decision Engine
        should_send, reason = should_send_now(user_events)
        logger.info(f"Decision: should_send={should_send}, reason={reason}")

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

        logger.info(f"Notification saved with id={notification.id}, status={notification.status}")

        # Send async task if ready
        if notification.status == "ready":
            logger.info(f"Sending notification_id={notification.id} to Celery")
            send_notification_task.delay(notification.id)

        return success_response(
            data={
                "id": notification.id,
                "user_id": notification.user_id,
                "message": notification.message,
                "type": notification.type,
                "status": notification.status,
                "scheduled_time": notification.scheduled_time.isoformat()
            },
            message=f"Notification processed ({reason})"
        )

    except HTTPException as e:
        logger.error(f"HTTP error: {e.detail}")
        return error_response(message=e.detail, code=e.status_code)

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return error_response(message=str(e), code=500)


@router.get("/")
def get_notifications(db: Session = Depends(get_db)):
    try:
        notifications = db.query(Notification).all()

        return success_response(
            data=[
                {
                    "id": n.id,
                    "user_id": n.user_id,
                    "message": n.message,
                    "type": n.type,
                    "status": n.status,
                    "scheduled_time": n.scheduled_time.isoformat()
                }
                for n in notifications
            ]
        )

    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return error_response(message=str(e), code=500)