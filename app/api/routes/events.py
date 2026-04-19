from fastapi import APIRouter, HTTPException
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

class EventRequest(BaseModel):
    user_id : str
    event : str
    timestamp : datetime

EVENT_STORE = []

@router.post("/")
def ingest_event(event: EventRequest):
    try:
        event_data = {
            "user_id": event.user_id,
            "event" : event.event,
            "timestamp" : event.timestamp
        }

        EVENT_STORE.append(event_data)

        return {
            "status" : "success",
            "message" : "EVENT recorded",
            "data" : event_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
def get_events():
    return {
        "total_events" : len(EVENT_STORE),
        "events" : EVENT_STORE
    }
