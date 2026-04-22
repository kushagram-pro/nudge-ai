from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.tenant import Tenant
from app.services.tenant_service import get_tenant_by_api_key


def get_current_tenant(
    request: Request,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Tenant:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Use: Bearer <API_KEY>",
        )

    api_key = authorization.removeprefix("Bearer ").strip()
    tenant = get_tenant_by_api_key(db, api_key)

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    request.state.tenant = tenant
    return tenant
