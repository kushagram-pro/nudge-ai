from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter

from app.config.database import get_db
from app.models.event import Event
from app.models.notification import Notification
from app.models.user import User

router = APIRouter()


@router.get("/engagement")
def get_engagement_metrics(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    notifications = db.query(Notification).all()

    total_events = len(events)
    total_notifications = len(notifications)

    event_types = [event.event for event in events]
    event_distribution = Counter(event_types)

    return {
        "total_events": total_events,
        "total_notifications": total_notifications,
        "event_distribution": event_distribution
    }


@router.get("/user/{user_id}")
def get_user_analytics(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        return {"error": "User not found"}

    user_events = db.query(Event).filter(Event.user_id == user_id).all()
    user_notifications = db.query(Notification).filter(Notification.user_id == user_id).all()

    return {
        "user_id": user_id,
        "total_events": len(user_events),
        "total_notifications": len(user_notifications),
        "events": [
            {
                "id": e.id,
                "event": e.event,
                "timestamp": e.timestamp
            }
            for e in user_events
        ],
        "notifications": [
            {
                "id": n.id,
                "message": n.message,
                "type": n.type,
                "status": n.status,
                "scheduled_time": n.scheduled_time
            }
            for n in user_notifications
        ]
    }