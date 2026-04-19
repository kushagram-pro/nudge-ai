from fastapi import APIRouter
from collections import Counter

from app.api.routes.events import EVENT_STORE
from app.api.routes.notify import NOTIFICATION_STORE

router = APIRouter()

@router.get("/engagement")
def get_engagement_metrics():
    total_events = len(EVENT_STORE)
    total_notifications = len(NOTIFICATION_STORE)

    event_types = [event["event"] for event in EVENT_STORE]
    event_counts = Counter(event_types)

    return {
        "total_events" : total_events,
        "total_notifications" : total_notifications,
        "event_distribution" : event_counts
    }

@router.get("/users/{user_id}")
def get_user_analytics(user_id: str):
    user_events = [e for e in EVENT_STORE if e["user_id"] == user_id]
    user_notifications = [n for n in NOTIFICATION_STORE if n["user_id"] == user_id]

    return {
        "user_id" : user_id,
        "total_events" : len(user_events),
        "total_notifications" : len(user_notifications),
        "events" : user_events
    }