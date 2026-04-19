from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.config.database import get_db
from app.models.user import User

router = APIRouter()

class UserCreateRequest(BaseModel):
    user_id : str
    name: Optional[str] = None


@router.post("/")
def create_user(user: UserCreateRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.user_id == user.user_id).first()

    if existing_user:
        raise HTTPException(status_code=400, detail = "User already exists")
    
    new_user = User(
        user_id = user.user_id,
        name=user.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status" : "success",
        "message" : "User created",
        "data" : {
            "user_id" : new_user.user_id,
            "name" : new_user.name,
            "created_at" : new_user.created_at
        }
    }


@router.get("/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user_id,
        "name" : user.name,
        "created_at" : user.created_at
    }

@router.get("/")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    return {
        "total_users" : len(users),
        "users" : [
            {
                "user_id" : user.user_id,
                "name" : user.name,
                "created_at" : user.created_at
            }
            for user in users
        ]
    }