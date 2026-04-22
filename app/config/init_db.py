from datetime import datetime, timedelta, timezone

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config.database import Base, engine
from app.config.settings import settings
from app.decision_engine.rules import NOTIFICATION_COOLDOWN_MINUTES, get_ready_time
from app.models.event import Event
from app.models.feedback import Feedback
from app.models.notification import Notification
from app.models.tenant import Tenant
from app.models.user import User


def _add_column_if_missing(table_name: str, column_name: str, definition: str):
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name not in columns:
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"))


def _apply_dev_migrations():
    if not settings.database_url.startswith("sqlite"):
        return

    _add_column_if_missing("users", "tenant_id", "INTEGER DEFAULT 1")
    _add_column_if_missing("users", "age", "INTEGER")
    _add_column_if_missing("users", "country", "VARCHAR")
    _add_column_if_missing("users", "device", "VARCHAR")
    _add_column_if_missing("events", "tenant_id", "INTEGER DEFAULT 1")
    _add_column_if_missing("notifications", "tenant_id", "INTEGER DEFAULT 1")
    _add_column_if_missing("notifications", "confidence", "FLOAT")
    _add_column_if_missing("notifications", "reason", "VARCHAR")
    _add_column_if_missing("tenants", "email", "VARCHAR")
    _add_column_if_missing("tenants", "password_hash", "VARCHAR")


def _seed_demo_data():
    if not settings.seed_demo_data:
        return

    db = Session(bind=engine)
    try:
        tenant = db.query(Tenant).filter(Tenant.api_key == settings.demo_api_key).first()
        if not tenant:
            tenant = Tenant(
                name=settings.demo_tenant_name,
                email="demo@nudgeai.dev",
                password_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
                api_key=settings.demo_api_key,
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        else:
            tenant.email = tenant.email or "demo@nudgeai.dev"
            tenant.password_hash = tenant.password_hash or "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
            db.commit()

        user = db.query(User).filter(User.tenant_id == tenant.id, User.user_id == "demo_user_001").first()
        if not user:
            user = User(
                user_id="demo_user_001",
                tenant_id=tenant.id,
                name="Riya Sharma",
                age=27,
                country="India",
                device="iOS",
            )
            db.add(user)
            db.commit()
        else:
            user.age = user.age or 27
            user.country = user.country or "India"
            user.device = user.device or "iOS"
            db.commit()

        demo_profiles = [
            ("demo_user_002", "Alex Morgan", 34, "United States", "Android"),
            ("demo_user_003", "Maya Chen", 22, "Singapore", "iOS"),
            ("demo_user_004", "Noah Smith", 41, "United Kingdom", "Web"),
            ("demo_user_005", "Sofia Garcia", 29, "Spain", "Android"),
        ]
        for user_id, name, age, country, device in demo_profiles:
            if not db.query(User).filter(User.tenant_id == tenant.id, User.user_id == user_id).first():
                db.add(User(user_id=user_id, tenant_id=tenant.id, name=name, age=age, country=country, device=device))
        db.commit()

        existing_events = db.query(Event).filter(Event.tenant_id == tenant.id, Event.user_id == "demo_user_001").count()
        now = datetime.now(timezone.utc)
        if existing_events == 0:
            events = [
                ("app_open", now - timedelta(days=3, hours=2)),
                ("workout_viewed", now - timedelta(days=3, hours=1, minutes=54)),
                ("notification_open", now - timedelta(days=2, hours=23)),
                ("streak_card_clicked", now - timedelta(days=2, hours=22, minutes=55)),
                ("app_open", now - timedelta(days=1, hours=3)),
                ("goal_progress_viewed", now - timedelta(days=1, hours=2, minutes=48)),
                ("settings_opened", now - timedelta(hours=8)),
                ("app_open", now - timedelta(minutes=42)),
            ]
            db.add_all(
                [
                    Event(user_id="demo_user_001", tenant_id=tenant.id, event=event_name, timestamp=timestamp)
                    for event_name, timestamp in events
                ]
            )
            db.add_all(
                [
                    Event(user_id="demo_user_002", tenant_id=tenant.id, event="app_open", timestamp=now - timedelta(hours=5)),
                    Event(user_id="demo_user_002", tenant_id=tenant.id, event="pricing_viewed", timestamp=now - timedelta(hours=4, minutes=52)),
                    Event(user_id="demo_user_003", tenant_id=tenant.id, event="notification_open", timestamp=now - timedelta(hours=7)),
                    Event(user_id="demo_user_004", tenant_id=tenant.id, event="app_open", timestamp=now - timedelta(days=4)),
                    Event(user_id="demo_user_005", tenant_id=tenant.id, event="streak_card_clicked", timestamp=now - timedelta(hours=12)),
                ]
            )
            db.commit()

        existing_notifications = (
            db.query(Notification)
            .filter(Notification.tenant_id == tenant.id, Notification.user_id == "demo_user_001")
            .count()
        )
        if existing_notifications == 0:
            first = Notification(
                user_id="demo_user_001",
                tenant_id=tenant.id,
                message="Your 7-day streak is within reach. Finish today's workout?",
                type="decision",
                status="sent",
                scheduled_time=now - timedelta(days=2, hours=22),
                confidence=0.88,
                reason="Optimal time to send",
            )
            second = Notification(
                user_id="demo_user_001",
                tenant_id=tenant.id,
                message="Evening workout reminder queued for Riya's usual activity window.",
                type="decision",
                status="scheduled",
                scheduled_time=now.replace(hour=18, minute=30, second=0, microsecond=0),
                confidence=0.81,
                reason="User recently active",
            )
            db.add_all([first, second])
            db.commit()
            db.refresh(first)

            db.add_all(
                [
                    Feedback(
                        user_id="demo_user_001",
                        tenant_id=tenant.id,
                        notification_id=first.id,
                        action="opened",
                        timestamp=now - timedelta(days=2, hours=21, minutes=56),
                    ),
                    Feedback(
                        user_id="demo_user_001",
                        tenant_id=tenant.id,
                        notification_id=first.id,
                        action="clicked",
                        timestamp=now - timedelta(days=2, hours=21, minutes=55),
                    ),
                ]
            )
            db.commit()
    finally:
        db.close()


def _rebalance_outstanding_notifications():
    db = Session(bind=engine)
    try:
        now = datetime.now(timezone.utc)
        pairs = (
            db.query(Notification.tenant_id, Notification.user_id)
            .filter(Notification.status.in_(["ready", "scheduled"]))
            .distinct()
            .all()
        )

        for tenant_id, user_id in pairs:
            items = (
                db.query(Notification)
                .filter(
                    Notification.tenant_id == tenant_id,
                    Notification.user_id == user_id,
                    Notification.status.in_(["ready", "scheduled"]),
                )
                .order_by(Notification.scheduled_time.asc(), Notification.id.asc())
                .all()
            )

            previous_time = None
            for index, item in enumerate(items):
                scheduled_time = item.scheduled_time
                if scheduled_time.tzinfo is None:
                    scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)

                if index == 0:
                    scheduled_time = max(scheduled_time, get_ready_time(now=now))
                else:
                    minimum_time = previous_time + timedelta(minutes=NOTIFICATION_COOLDOWN_MINUTES)
                    scheduled_time = max(scheduled_time, minimum_time)

                item.scheduled_time = scheduled_time
                item.status = "ready" if index == 0 and (scheduled_time - now).total_seconds() / 60 <= 15 else "scheduled"
                previous_time = scheduled_time

        db.commit()
    finally:
        db.close()


def init_db():
    _apply_dev_migrations()
    Base.metadata.create_all(bind=engine)
    _apply_dev_migrations()
    _seed_demo_data()
    _rebalance_outstanding_notifications()

if __name__ == "__main__":
    init_db()
