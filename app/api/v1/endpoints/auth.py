import re
import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import UserModel, OrganizationModel
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_mfa_secret,
    get_mfa_provisioning_uri,
    verify_mfa_code,
)
from app.api.deps import get_current_user, record_audit_event

router = APIRouter()

# --- Request / Response Schemas ---

class RegisterRequest(BaseModel):
    organization_name: str = Field(..., min_length=2, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 chars with upper, lower, number, special")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class MfaVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    mfa_token: Optional[str] = None  # Needed if completing 2-step login

class RefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False
    mfa_token: Optional[str] = None
    user: Dict[str, Any]

# --- Endpoints ---

@router.post("/register", response_model=TokenResponse)
async def register_organization_and_admin(
    req: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new Institutional / Fund organization and its initial CISO/Admin account.
    """
    # 1. Enforce password complexity
    if not (re.search(r"[A-Z]", req.password) and re.search(r"[a-z]", req.password) and re.search(r"[0-9]", req.password)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number."
        )

    # 2. Check if email already registered
    existing_user_stmt = select(UserModel).where(UserModel.email == req.email.lower().strip())
    res = await db.execute(existing_user_stmt)
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address is already registered."
        )

    # 3. Create Organization
    slug = re.sub(r"[^a-z0-9]+", "-", req.organization_name.lower().strip()).strip("-")
    # Check slug collisions
    slug_stmt = select(OrganizationModel).where(OrganizationModel.slug == slug)
    slug_res = await db.execute(slug_stmt)
    if slug_res.scalars().first():
        slug = f"{slug}-{int(datetime.datetime.utcnow().timestamp())}"

    org = OrganizationModel(
        name=req.organization_name.strip(),
        slug=slug,
        subscription_tier="scout",
        monthly_export_limit=100,
        monthly_export_count=0,
        is_active=True
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)

    # 4. Create Admin User
    user = UserModel(
        organization_id=org.id,
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role="admin",
        is_active=True,
        mfa_enabled=False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 5. Audit Log
    client_ip = request.client.host if request.client else "unknown"
    await record_audit_event(
        db=db,
        organization_id=org.id,
        user_id=user.id,
        action="AUTH_REGISTER_ORGANIZATION",
        resource_type="Organization",
        resource_id=org.id,
        ip_address=client_ip,
        details={"org_name": org.name, "admin_email": user.email}
    )

    access_token = create_access_token(subject=user.id, organization_id=org.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, organization_id=org.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": org.id,
            "organization_name": org.name,
            "subscription_tier": org.subscription_tier,
            "mfa_enabled": user.mfa_enabled
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates user with email and password.
    If MFA is activated, issues a temporary mfa_token requiring 6-digit TOTP verification.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_stmt = select(UserModel).where(UserModel.email == req.email.lower().strip())
    res = await db.execute(user_stmt)
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        if user:
            await record_audit_event(
                db=db,
                organization_id=user.organization_id,
                user_id=user.id,
                action="AUTH_LOGIN_FAILED",
                ip_address=client_ip,
                details={"reason": "Invalid credentials"}
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")

    # Get Organization
    org_stmt = select(OrganizationModel).where(OrganizationModel.id == user.organization_id)
    org_res = await db.execute(org_stmt)
    org = org_res.scalars().first()
    org_name = org.name if org else "Default Fund"
    tier = org.subscription_tier if org else "scout"

    # Check MFA requirement
    if user.mfa_enabled and user.mfa_secret:
        # Issue short 5-minute temporary MFA token
        mfa_token = create_access_token(
            subject=user.id,
            organization_id=user.organization_id,
            role="mfa_pending"
        )
        return TokenResponse(
            access_token="",
            mfa_required=True,
            mfa_token=mfa_token,
            user={"id": user.id, "email": user.email, "mfa_enabled": True}
        )

    # Standard Login Success
    user.last_login_at = datetime.datetime.utcnow()
    await db.commit()

    await record_audit_event(
        db=db,
        organization_id=user.organization_id,
        user_id=user.id,
        action="AUTH_LOGIN_SUCCESS",
        ip_address=client_ip
    )

    access_token = create_access_token(subject=user.id, organization_id=user.organization_id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, organization_id=user.organization_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
            "organization_name": org_name,
            "subscription_tier": tier,
            "mfa_enabled": user.mfa_enabled
        }
    )

@router.post("/mfa/setup")
async def setup_mfa(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a new Base32 TOTP secret and provisioning URI for Google Authenticator / 1Password.
    """
    secret = generate_mfa_secret()
    current_user.mfa_secret = secret
    await db.commit()

    uri = get_mfa_provisioning_uri(secret, current_user.email)
    return {
        "secret": secret,
        "provisioning_uri": uri,
        "instructions": "Enter this secret in Google Authenticator or scan the provisioning URI QR code."
    }

@router.post("/mfa/verify", response_model=TokenResponse)
async def verify_mfa(
    req: MfaVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies 6-digit TOTP code to finalize MFA activation or complete a 2-step login.
    """
    client_ip = request.client.host if request.client else "unknown"
    user = None

    if req.mfa_token:
        # Resolving user from temporary login MFA token
        try:
            payload = decode_token(req.mfa_token)
            user_id = payload.get("sub")
            stmt = select(UserModel).where(UserModel.id == user_id)
            res = await db.execute(stmt)
            user = res.scalars().first()
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA token invalid or expired")

    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not resolve user context for MFA")

    if not user.mfa_secret or not verify_mfa_code(user.mfa_secret, req.code):
        await record_audit_event(
            db=db,
            organization_id=user.organization_id,
            user_id=user.id,
            action="AUTH_MFA_FAILED",
            ip_address=client_ip
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 6-digit verification code")

    # Mark MFA fully enabled
    user.mfa_enabled = True
    user.last_login_at = datetime.datetime.utcnow()
    await db.commit()

    await record_audit_event(
        db=db,
        organization_id=user.organization_id,
        user_id=user.id,
        action="AUTH_MFA_SUCCESS",
        ip_address=client_ip
    )

    # Get Org
    org_stmt = select(OrganizationModel).where(OrganizationModel.id == user.organization_id)
    org_res = await db.execute(org_stmt)
    org = org_res.scalars().first()

    access_token = create_access_token(subject=user.id, organization_id=user.organization_id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, organization_id=user.organization_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id,
            "organization_name": org.name if org else "",
            "subscription_tier": org.subscription_tier if org else "scout",
            "mfa_enabled": True
        }
    )

@router.post("/refresh")
async def refresh_access_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Issues a new access token using a valid, non-expired refresh token.
    """
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type")
        
        user_id = payload.get("sub")
        org_id = payload.get("org")
        
        stmt = select(UserModel).where(UserModel.id == user_id)
        res = await db.execute(stmt)
        user = res.scalars().first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or removed")

        new_access = create_access_token(subject=user.id, organization_id=org_id, role=user.role)
        return {"access_token": new_access, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Refresh failed: {str(e)}")

@router.get("/me")
async def get_current_user_profile(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns current authenticated user profile and organization membership.
    """
    org_stmt = select(OrganizationModel).where(OrganizationModel.id == current_user.organization_id)
    org_res = await db.execute(org_stmt)
    org = org_res.scalars().first()

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "mfa_enabled": current_user.mfa_enabled,
        "organization": {
            "id": org.id if org else current_user.organization_id,
            "name": org.name if org else "Default Organization",
            "subscription_tier": org.subscription_tier if org else "scout",
            "monthly_export_count": org.monthly_export_count if org else 0,
            "monthly_export_limit": org.monthly_export_limit if org else 100
        }
    }
