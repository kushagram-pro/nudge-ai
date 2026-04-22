from sqlalchemy.orm import Session

from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.tenant import Tenant
from app.models.user import User


def get_metrics(db: Session, tenant: Tenant) -> dict:
    notifications = db.query(Notification).filter(Notification.tenant_id == tenant.id).all()
    feedback = db.query(Feedback).filter(Feedback.tenant_id == tenant.id).all()
    users = db.query(User).filter(User.tenant_id == tenant.id).all()

    total_notifications = len(notifications)
    total_decisions = len([item for item in notifications if item.type == "decision" or item.reason])
    clicked = len([item for item in feedback if item.action == "clicked"])
    opened = len([item for item in feedback if item.action == "opened"])
    engaged = clicked + opened
    click_rate = round(clicked / len(feedback), 3) if feedback else 0.0
    engagement_score = round(engaged / total_notifications, 3) if total_notifications else 0.0
    successful_conversion_notifications = len({item.notification_id for item in feedback if item.action == "clicked"})
    retained_users = len({item.user_id for item in feedback if item.action in {"clicked", "opened"}})
    user_retention_percentage = round((retained_users / len(users)) * 100, 1) if users else 0.0

    def bucket_age(age):
        if age is None:
            return "Unknown"
        if age < 25:
            return "18-24"
        if age < 35:
            return "25-34"
        if age < 45:
            return "35-44"
        return "45+"

    def count_by(items, getter):
        counts = {}
        for item in items:
            key = getter(item) or "Unknown"
            counts[key] = counts.get(key, 0) + 1
        return [{"name": key, "value": value} for key, value in sorted(counts.items())]

    return {
        "total_decisions": total_decisions,
        "total_notifications": total_notifications,
        "total_users": len(users),
        "click_rate": click_rate,
        "engagement_score": engagement_score,
        "user_retention_percentage": user_retention_percentage,
        "successful_conversion_notifications": successful_conversion_notifications,
        "demographics": {
            "age": count_by(users, lambda user: bucket_age(user.age)),
            "country": count_by(users, lambda user: user.country),
            "device": count_by(users, lambda user: user.device),
        },
    }
