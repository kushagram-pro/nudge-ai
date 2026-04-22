from celery import Celery
from app.config.settings import settings

celery_app = Celery(
    "nudgeai",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.scheduler.tasks"  # IMPORTANT: register tasks properly
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# IMPORTANT: import ALL models here (ensures metadata is loaded)
import app.models.user
import app.models.event
import app.models.notification
import app.models.feedback
import app.models.tenant
