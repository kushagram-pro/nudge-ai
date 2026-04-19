from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class UserCreateRequest(BaseModel):
    user_id : str
    name: Optional[str] = None

USER_STORE = {}

@router.post("/")
def create_user(user: UserCreateRequest):
    if user.user_id in USER_STORE:
        raise HTTPException(status_code=400, detail="User already exists")
    
    USER_STORE[user.user_id] = {
        "user_id" : user.user_id,
        "name" : user.name,
        "events" : [],
        "created_at" : "now"
    }

    return {
        "status" : "success",
        "message" : "User created",
        "data" : USER_STORE[user.user_id]
    }

@router.get("/{user_id}")
def get_user(user_id: str):
    if user_id not in USER_STORE:
        raise HTTPException(status_code=404, detail="User not found")

    return USER_STORE[user_id]

@router.get("/")
def get_all_users():
    return {
        "total_users" : len(USER_STORE),
        "users" : list(USER_STORE.values())
    }