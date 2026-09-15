import jwt
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import UserModel, OrganizationModel, AuditLogModel
from app.core.config import settings
from app.core.security import decode_token

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    request: Request,
    token_creds: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[UserModel]:
    """
    Extracts authenticated user from Bearer token if provided.
    If absent and DEMO_MODE_ALLOWED is True, falls back to a guest analyst account.
    """
    if token_creds and token_creds.credentials:
        try:
            payload = decode_token(token_creds.credentials)
            user_id: str = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")
            
            stmt = select(UserModel).where(UserModel.id == user_id)
            res = await db.execute(stmt)
            user = res.scalars().first()
            if not user or not user.is_active:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User deactivated or not found")
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except jwt.PyJWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    # Guest Demo Fallback (when running in public demo mode)
    if settings.DEMO_MODE_ALLOWED:
        stmt = select(UserModel).where(UserModel.id == "usr_analyst_1")
        res = await db.execute(stmt)
        demo_user = res.scalars().first()
        return demo_user

    return None

async def get_current_user(
    current_user: Optional[UserModel] = Depends(get_current_user_optional)
) -> UserModel:
    """Enforces authentication; raises 401 Unauthorized if no valid credentials exist."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return current_user

def require_roles(allowed_roles: List[str]) -> Callable:
    """
    Role-Based Access Control (RBAC) guard:
    Enforces that current_user has one of the required roles.
    """
    async def role_checker(current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {allowed_roles}, but user role is '{current_user.role}'."
            )
        return current_user
    return role_checker

async def record_audit_event(
    db: AsyncSession,
    organization_id: str,
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict] = None
):
    """
    Records an immutable audit event to the audit_logs compliance ledger.
    """
    try:
        audit_entry = AuditLogModel(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
        db.add(audit_entry)
        await db.commit()
    except Exception as e:
        print(f"Warning: Failed to record audit log: {e}")
