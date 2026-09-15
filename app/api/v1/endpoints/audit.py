from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import AuditLogModel, UserModel
from app.api.deps import require_roles

router = APIRouter()

@router.get("/logs")
async def get_organization_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user: UserModel = Depends(require_roles(["admin", "auditor"])),
    db: AsyncSession = Depends(get_db)
):
    """
    CISO & SOC2 Audit Trail Endpoint:
    Returns immutable compliance logs strictly isolated to the caller's organization.
    Restricted to 'admin' and 'auditor' roles.
    """
    stmt = (
        select(AuditLogModel)
        .where(AuditLogModel.organization_id == current_user.organization_id)
        .order_by(AuditLogModel.timestamp.desc())
        .limit(limit)
    )

    if action:
        stmt = stmt.where(AuditLogModel.action == action)
    if user_id:
        stmt = stmt.where(AuditLogModel.user_id == user_id)

    res = await db.execute(stmt)
    records = res.scalars().all()

    return {
        "organization_id": current_user.organization_id,
        "total_returned": len(records),
        "audit_logs": [
            {
                "id": r.id,
                "action": r.action,
                "user_id": r.user_id,
                "resource_type": r.resource_type,
                "resource_id": r.resource_id,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "details": r.details,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None
            }
            for r in records
        ]
    }
