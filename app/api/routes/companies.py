from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schema.company_schema import CompanyLoginRequest, CompanySignupRequest
from app.services.company_service import create_company, login_company
from app.utils.response import success_response

router = APIRouter()


def _tenant_payload(tenant):
    return {
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "email": tenant.email,
            "created_at": tenant.created_at.isoformat(),
        },
        "api_key": tenant.api_key,
    }


@router.post("/signup")
def signup(payload: CompanySignupRequest, db: Session = Depends(get_db)):
    tenant = create_company(db, payload.name, payload.email, payload.password)
    return success_response(message="Company account created", data=_tenant_payload(tenant))


@router.post("/login")
def login(payload: CompanyLoginRequest, db: Session = Depends(get_db)):
    tenant = login_company(db, payload.email, payload.password)
    return success_response(message="Company login successful", data=_tenant_payload(tenant))
