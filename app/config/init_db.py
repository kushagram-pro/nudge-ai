from app.config.database import engine, Base

from app.models.user import User
from app.models.event import Event
from app.models.notification import Notification

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()