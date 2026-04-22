import hashlib
import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.tenant import Tenant


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_company(db: Session, name: str, email: str, password: str) -> Tenant:
    existing = db.query(Tenant).filter(Tenant.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company email already exists")

    tenant = Tenant(
        name=name,
        email=email,
        password_hash=hash_password(password),
        api_key=f"nudge_{secrets.token_urlsafe(32)}",
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


def login_company(db: Session, email: str, password: str) -> Tenant:
    tenant = db.query(Tenant).filter(Tenant.email == email).first()
    if not tenant or tenant.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid company credentials")
    return tenant
