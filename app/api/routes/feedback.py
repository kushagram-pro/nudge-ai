from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_tenant
from app.config.database import get_db
from app.models.tenant import Tenant
from app.schema.feedback_schema import FeedbackRequest
from app.services.feedback_service import create_feedback
from app.utils.logger import get_logger
from app.utils.response import error_response, success_response

router = APIRouter()
logger = get_logger("feedback_api")


@router.post("/")
def feedback(
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    try:
        created = create_feedback(
            db=db,
            tenant=tenant,
            user_id=payload.user_id,
            notification_id=payload.notification_id,
            action=payload.action,
        )
        logger.info(
            f"feedback_recorded notification_id={created.notification_id} action={created.action}",
            extra={"tenant_id": tenant.id},
        )
        return success_response(
            message="Feedback recorded",
            data={
                "id": created.id,
                "tenant_id": created.tenant_id,
                "user_id": created.user_id,
                "notification_id": created.notification_id,
                "action": created.action,
                "timestamp": created.timestamp.isoformat(),
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("feedback_failed", extra={"tenant_id": tenant.id})
        return error_response(message=str(exc), code=500)
