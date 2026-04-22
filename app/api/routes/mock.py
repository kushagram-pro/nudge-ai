from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.config.database import get_db
from app.models.event import Event
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.tenant import Tenant
from app.models.user import User
from app.utils.response import success_response

router = APIRouter()


@router.get("/user")
def mock_user(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    user = db.query(User).filter(User.tenant_id == tenant.id, User.user_id == "demo_user_001").first()
    events = (
        db.query(Event)
        .filter(Event.tenant_id == tenant.id, Event.user_id == "demo_user_001")
        .order_by(Event.timestamp.desc())
        .all()
    )
    notifications = (
        db.query(Notification)
        .filter(Notification.tenant_id == tenant.id, Notification.user_id == "demo_user_001")
        .order_by(Notification.id.desc())
        .all()
    )
    feedback = (
        db.query(Feedback)
        .filter(Feedback.tenant_id == tenant.id, Feedback.user_id == "demo_user_001")
        .order_by(Feedback.timestamp.desc())
        .all()
    )

    return success_response(
        message="Mock user behavior loaded",
        data={
            "api_key": tenant.api_key,
            "tenant": {"id": tenant.id, "name": tenant.name},
            "user": {
                "user_id": user.user_id if user else "demo_user_001",
                "name": user.name if user else "Demo User",
                "created_at": user.created_at.isoformat() if user else None,
            },
            "behavior_summary": {
                "persona": "Fitness app user who opens the app in the morning, clicks workout nudges, and often ignores late-night reminders.",
                "preferred_window": "18:00-20:00 local time",
                "recent_pattern": "Opened the app, viewed today's workout, clicked a streak reminder, then went inactive for a healthy send window.",
            },
            "events": [
                {
                    "id": item.id,
                    "event": item.event,
                    "timestamp": item.timestamp.isoformat(),
                }
                for item in events
            ],
            "notifications": [
                {
                    "id": item.id,
                    "message": item.message,
                    "status": item.status,
                    "scheduled_time": item.scheduled_time.isoformat(),
                    "confidence": item.confidence,
                    "reason": item.reason,
                }
                for item in notifications
            ],
            "feedback": [
                {
                    "id": item.id,
                    "notification_id": item.notification_id,
                    "action": item.action,
                    "timestamp": item.timestamp.isoformat(),
                }
                for item in feedback
            ],
        },
    )
