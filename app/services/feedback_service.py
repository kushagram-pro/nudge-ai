from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.tenant import Tenant


def create_feedback(db: Session, tenant: Tenant, user_id: str, notification_id: int, action: str) -> Feedback:
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.tenant_id == tenant.id,
            Notification.user_id == user_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found for this tenant and user")

    feedback = Feedback(
        user_id=user_id,
        tenant_id=tenant.id,
        notification_id=notification_id,
        action=action,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
