from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.api.deps import get_current_tenant
from app.config.database import get_db
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()

class UserCreateRequest(BaseModel):
    user_id : str
    name: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    device: Optional[str] = None


@router.post("/")
def create_user(
    user: UserCreateRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    existing_user = db.query(User).filter(User.tenant_id == tenant.id, User.user_id == user.user_id).first()

    if existing_user:
        raise HTTPException(status_code=400, detail = "User already exists")
    
    new_user = User(
        user_id = user.user_id,
        tenant_id=tenant.id,
        name=user.name,
        age=user.age,
        country=user.country,
        device=user.device
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status" : "success",
        "message" : "User created",
        "data" : {
            "user_id" : new_user.user_id,
            "tenant_id" : new_user.tenant_id,
            "name" : new_user.name,
            "age": new_user.age,
            "country": new_user.country,
            "device": new_user.device,
            "created_at" : new_user.created_at
        }
    }


@router.get("/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    user = db.query(User).filter(User.tenant_id == tenant.id, User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user_id,
        "tenant_id": user.tenant_id,
        "name" : user.name,
        "age": user.age,
        "country": user.country,
        "device": user.device,
        "created_at" : user.created_at
    }

@router.get("/")
def get_all_users(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    users = db.query(User).filter(User.tenant_id == tenant.id).all()

    return {
        "total_users" : len(users),
        "users" : [
            {
                "user_id" : user.user_id,
                "tenant_id" : user.tenant_id,
                "name" : user.name,
                "age": user.age,
                "country": user.country,
                "device": user.device,
                "created_at" : user.created_at
            }
            for user in users
        ]
    }
