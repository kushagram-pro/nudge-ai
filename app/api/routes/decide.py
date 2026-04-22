from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.config.database import get_db
from app.models.tenant import Tenant
from app.schema.decision_schema import DecideRequest
from app.services.decision_service import decide_notification
from app.utils.logger import get_logger
from app.utils.response import error_response, success_response

router = APIRouter()
logger = get_logger("decide_api")


@router.post("/")
def decide(
    payload: DecideRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    try:
        result = decide_notification(
            db=db,
            tenant=tenant,
            user_id=payload.user_id,
            message=payload.message,
            event_history=payload.event_history,
        )
        logger.info(
            f"decision_created notification_id={result.notification.id} should_send={result.should_send}",
            extra={"tenant_id": tenant.id},
        )
        return success_response(
            message="Decision generated",
            data={
                "tenant_id": tenant.id,
                "user_id": payload.user_id,
                "notification_id": result.notification.id,
                "should_send": result.should_send,
                "status": result.notification.status,
                "best_time": result.best_time.isoformat(),
                "confidence": result.confidence,
                "reason": result.reason,
                "next_step": result.next_step,
                "message": payload.message,
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("decision_failed", extra={"tenant_id": tenant.id})
        return error_response(message=str(exc), code=500)
