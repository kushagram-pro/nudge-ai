from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.decision_engine.rules import describe_next_step, get_ready_time, get_scheduled_time, should_send_now
from app.models.event import Event
from app.models.notification import Notification
from app.models.tenant import Tenant
from app.models.user import User


@dataclass
class DecisionResult:
    notification: Notification
    should_send: bool
    best_time: datetime
    confidence: float
    reason: str
    next_step: str


def _confidence_from_reason(reason: str, event_count: int) -> float:
    base = 0.72 if event_count else 0.58
    if "Optimal" in reason:
        base += 0.16
    elif "recently" in reason:
        base += 0.09
    elif "inactive" in reason:
        base -= 0.06
    return round(max(0.35, min(base, 0.96)), 2)


def decide_notification(db: Session, tenant: Tenant, user_id: str, message: str, event_history) -> DecisionResult:
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.tenant_id == tenant.id, User.user_id == user_id).first()
    if not user:
        user = User(user_id=user_id, tenant_id=tenant.id, name=f"User {user_id}")
        db.add(user)
        db.flush()

    for item in event_history:
        db.add(
            Event(
                user_id=user_id,
                tenant_id=tenant.id,
                event=item.event,
                timestamp=item.timestamp or now,
            )
        )

    db.flush()

    user_events = db.query(Event).filter(Event.tenant_id == tenant.id, Event.user_id == user_id).all()
    existing_notifications = (
        db.query(Notification)
        .filter(
            Notification.tenant_id == tenant.id,
            Notification.user_id == user_id,
            Notification.status.in_(["ready", "scheduled"]),
        )
        .all()
    )
    should_send, reason = should_send_now(user_events, now=now)
    best_time = get_ready_time(existing_notifications, now=now) if should_send else get_scheduled_time(user_events, existing_notifications, now=now)
    confidence = _confidence_from_reason(reason, len(user_events))
    lead_minutes = (best_time - now).total_seconds() / 60
    status = "ready" if should_send and lead_minutes <= 15 else "scheduled"
    if should_send and status == "scheduled" and "Optimal" in reason:
        reason = "Queued behind an existing notification to avoid spam"

    next_step = describe_next_step(status, best_time, now=now)

    notification = Notification(
        user_id=user_id,
        tenant_id=tenant.id,
        message=message,
        type="decision",
        status=status,
        scheduled_time=best_time,
        confidence=confidence,
        reason=reason,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    return DecisionResult(
        notification=notification,
        should_send=should_send,
        best_time=best_time,
        confidence=confidence,
        reason=reason,
        next_step=next_step,
    )
