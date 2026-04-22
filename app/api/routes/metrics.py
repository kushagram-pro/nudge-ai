from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.config.database import get_db
from app.models.tenant import Tenant
from app.services.metrics_service import get_metrics
from app.utils.response import success_response

router = APIRouter()


@router.get("/")
def metrics(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    return success_response(message="Metrics loaded", data=get_metrics(db, tenant))
