from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_current_tenant
from app.config.database import get_db
from app.models.notification import Notification
from app.models.tenant import Tenant
from app.models.user import User
from app.models.event import Event

from app.decision_engine.rules import describe_next_step, get_ready_time, get_scheduled_time, should_send_now
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
def create_notification(
    request: NotificationRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    try:
        now = datetime.now(timezone.utc)
        logger.info(f"Received notification request for user={request.user_id}")

        # Check if user exists
        user = db.query(User).filter(User.tenant_id == tenant.id, User.user_id == request.user_id).first()
        if not user:
            logger.error(f"User not found: {request.user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch user events
        user_events = db.query(Event).filter(Event.tenant_id == tenant.id, Event.user_id == request.user_id).all()
        existing_notifications = (
            db.query(Notification)
            .filter(
                Notification.tenant_id == tenant.id,
                Notification.user_id == request.user_id,
                Notification.status.in_(["ready", "scheduled"]),
            )
            .all()
        )

        # Decision Engine
        should_send, reason = should_send_now(user_events, now=now)
        logger.info(f"Decision: should_send={should_send}, reason={reason}")

        if should_send:
            scheduled_time = get_ready_time(existing_notifications, now=now)
            status = "ready" if (scheduled_time - now).total_seconds() / 60 <= 15 else "scheduled"
            if status == "scheduled" and "Optimal" in reason:
                reason = "Queued behind an existing notification to avoid spam"
        else:
            scheduled_time = get_scheduled_time(user_events, existing_notifications, now=now)
            status = "scheduled"

        next_step = describe_next_step(status, scheduled_time, now=now)

        # Create notification
        notification = Notification(
            user_id=request.user_id,
            tenant_id=tenant.id,
            message=request.message,
            type=request.type,
            status=status,
            scheduled_time=scheduled_time,
            reason=reason,
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
                "tenant_id": notification.tenant_id,
                "message": notification.message,
                "type": notification.type,
                "status": notification.status,
                "scheduled_time": notification.scheduled_time.isoformat(),
                "created_at": notification.created_at.isoformat(),
                "reason": notification.reason,
                "next_step": next_step,
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
def get_notifications(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    try:
        notifications = db.query(Notification).filter(Notification.tenant_id == tenant.id).all()

        return success_response(
            data=[
                {
                    "id": n.id,
                    "user_id": n.user_id,
                    "tenant_id": n.tenant_id,
                    "message": n.message,
                    "type": n.type,
                    "status": n.status,
                    "scheduled_time": n.scheduled_time.isoformat(),
                    "created_at": n.created_at.isoformat(),
                    "reason": n.reason,
                    "next_step": describe_next_step(n.status, n.scheduled_time),
                }
                for n in notifications
            ]
        )

    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return error_response(message=str(e), code=500)
