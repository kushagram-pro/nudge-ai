from datetime import datetime, timezone, timedelta

QUIET_HOURS_START = 22
QUIET_HOURS_END = 8
RECENT_ACTIVITY_MINUTES = 25
INACTIVE_DAYS_LIMIT = 14
READY_LEAD_MINUTES = 5
NOTIFICATION_COOLDOWN_MINUTES = 90


def _ensure_aware(timestamp):
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=timezone.utc)
    return timestamp


def _round_up_to_five_minutes(timestamp):
    timestamp = timestamp.replace(second=0, microsecond=0)
    remainder = timestamp.minute % 5
    if remainder:
        timestamp += timedelta(minutes=5 - remainder)
    return timestamp


def _apply_quiet_hours(timestamp):
    if QUIET_HOURS_START <= timestamp.hour or timestamp.hour < QUIET_HOURS_END:
        next_day = timestamp
        if timestamp.hour >= QUIET_HOURS_START:
            next_day = timestamp + timedelta(days=1)
        return next_day.replace(hour=QUIET_HOURS_END, minute=30, second=0, microsecond=0)
    return timestamp


def _preferred_hour(user_events):
    if not user_events:
        return 18

    event_hours = [_ensure_aware(event.timestamp).hour for event in user_events]
    return max(set(event_hours), key=event_hours.count)


def _apply_notification_spacing(candidate_time, existing_notifications):
    scheduled_times = []
    for notification in existing_notifications or []:
        if notification.status in {"ready", "scheduled"}:
            scheduled_times.append(_ensure_aware(notification.scheduled_time))

    scheduled_times.sort()
    for scheduled in scheduled_times:
        window_start = scheduled - timedelta(minutes=NOTIFICATION_COOLDOWN_MINUTES)
        window_end = scheduled + timedelta(minutes=NOTIFICATION_COOLDOWN_MINUTES)
        if window_start <= candidate_time <= window_end:
            candidate_time = scheduled + timedelta(minutes=NOTIFICATION_COOLDOWN_MINUTES)

    return candidate_time


def should_send_now(user_events, now=None):
    """
    Decide whether to send notifications now or delay it
    based on user's recent activity.
    """
    now = now or datetime.now(timezone.utc)

    if not user_events:
        return False, "No recent activity found"
    
    last_event = max(user_events, key=lambda e: e.timestamp)
    event_time = _ensure_aware(last_event.timestamp)

    time_diff = (now - event_time).total_seconds() / 60

    if time_diff < RECENT_ACTIVITY_MINUTES:
        return False, "User recently active"
    
    if time_diff > INACTIVE_DAYS_LIMIT * 24 * 60:
        return False, "User inactive for long"
    
    return True, "Optimal time to send"


def get_scheduled_time(user_events, existing_notifications=None, now=None):
    """
    If not sending now, decide next best time.
    """
    now = now or datetime.now(timezone.utc)

    if not user_events:
        scheduled = now + timedelta(hours=4)
    else:
        preferred_hour = _preferred_hour(user_events)
        scheduled = now.replace(hour=preferred_hour, minute=30, second=0, microsecond=0)

    if scheduled < now:
        scheduled += timedelta(days=1)

    scheduled = _apply_quiet_hours(scheduled)
    scheduled = _apply_notification_spacing(scheduled, existing_notifications)
    return _round_up_to_five_minutes(scheduled)


def get_ready_time(existing_notifications=None, now=None):
    now = now or datetime.now(timezone.utc)
    ready_time = _round_up_to_five_minutes(now + timedelta(minutes=READY_LEAD_MINUTES))
    ready_time = _apply_quiet_hours(ready_time)
    ready_time = _apply_notification_spacing(ready_time, existing_notifications)
    return ready_time


def describe_next_step(status, scheduled_time, now=None):
    now = now or datetime.now(timezone.utc)
    scheduled_time = _ensure_aware(scheduled_time)
    minutes = max(0, int((scheduled_time - now).total_seconds() // 60))

    if status == "ready":
        if minutes <= 10:
            return f"Queued for worker pickup in about {max(1, minutes)} min"
        return f"Queued to send at {scheduled_time.strftime('%b %d, %I:%M %p UTC')}"

    if status == "scheduled":
        return f"Scheduled for re-send window at {scheduled_time.strftime('%b %d, %I:%M %p UTC')}"

    if status == "sent":
        return "Already delivered"

    return "Awaiting processing"
