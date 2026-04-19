from app.scheduler.celery_app import celery_app
from app.config.database import SessionLocal
from app.models.notification import Notification


@celery_app.task
def send_notification_task(notification_id: int):
    db = SessionLocal()

    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id
        ).first()

        if not notification:
            print(f"Notification {notification_id} not found")
            return

        # Simulate sending (replace later with email/push)
        print(f"Sending notification to user {notification.user_id}")
        print(f"Message: {notification.message}")

        # Update status
        notification.status = "sent"
        db.commit()

        print(f"Notification {notification_id} marked as sent")

    except Exception as e:
        print(f"Error sending notification: {e}")

    finally:
        db.close()