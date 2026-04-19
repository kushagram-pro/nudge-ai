from app.scheduler.celery_app import celery_app
from app.config.database import SessionLocal
from app.models.notification import Notification

from app.utils.logger import get_logger

logger = get_logger("notification_worker")


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=5, retry_kwargs={"max_retries": 3})
def send_notification_task(self, notification_id: int):
    db = SessionLocal()

    try:
        logger.info(f"Processing notification_id={notification_id}")

        notification = db.query(Notification).filter(
            Notification.id == notification_id
        ).first()

        if not notification:
            logger.error(f"Notification {notification_id} not found")
            return

        logger.info(f"Sending notification to user={notification.user_id}")
        logger.info(f"Message={notification.message}")

        notification.status = "sent"
        db.commit()

        logger.info(f"Notification {notification_id} marked as sent")

    except Exception as e:
        logger.error(f"Error sending notification_id={notification_id}: {str(e)}")
        raise  # required for Celery retry

    finally:
        db.close()