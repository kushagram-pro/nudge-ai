from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.config.database import get_db
from app.models.event import Event
from app.models.user import User

router = APIRouter()

class EventRequest(BaseModel):
    user_id : str
    event : str
    timestamp : datetime



@router.post("/")
def ingest_event(event: EventRequest, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.user_id == event.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail ="User not found")
    
    new_event= Event(
        user_id = event.user_id,
        event = event.event,
        timestamp=event.timestamp
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "status" : "success",
        "message" : "Event recorded",
        "data" : {
            "id" : new_event.id,
            "user_id" : new_event.user_id,
            "event" :new_event.event,
            "timestamp" : new_event.timestamp
        }
    }
    
@router.get("/")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()

    return {
        "total_events" : len(events),
        "events" : [
            {
                "id": e.id,
                "user_id": e.user_id,
                "event" : e.event,
                "timestamp" : e.timestamp
            }
            for e in events
        ]
    }
