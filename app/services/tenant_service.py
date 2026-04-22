from sqlalchemy.orm import Session

from app.models.tenant import Tenant


def get_tenant_by_api_key(db: Session, api_key: str) -> Tenant | None:
    return db.query(Tenant).filter(Tenant.api_key == api_key).first()
