from datetime import datetime, timezone, timedelta

def should_send_now(user_events):
    """
    Decide whether to send notifications now or delay it
    based on user's recent activity.
    """

    if not user_events:
        return False, "No user acitivity found"
    
    last_event = max(user_events, key=lambda e: e.timestamp)

    now = datetime.now(timezone.utc)

    # FIX: ensure timestamp is timezone-aware
    event_time = last_event.timestamp
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)

    time_diff = (now - event_time).total_seconds() / 60

    #Rule1: 
    if time_diff < 10:
        return False, "User recently active"
    
    if time_diff > 10080:
        return False, "User inactive for long"
    
    return True, "Optimal time to send"

def get_scheduled_time(user_events):
    """
    If not sending now, decide next best time.
    """

    now = datetime.now(timezone.utc)

    if not user_events:
        return now + timedelta(hours=1)
    
    last_event = max(user_events, key = lambda e: e.timestamp)
    last_hour = last_event.timestamp.hour

    scheduled = now.replace(hour=last_hour, minute=0, second=0, microsecond=0)

    if scheduled < now:
        scheduled += timedelta(days=1)
    
    return scheduled