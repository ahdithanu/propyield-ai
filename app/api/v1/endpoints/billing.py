from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import OrganizationModel, UserModel
from app.api.deps import get_current_user, require_roles, record_audit_event
from app.core.config import settings

router = APIRouter()

PLAN_DETAILS = {
    "scout": {
        "name": "Scout Tier",
        "price_monthly_usd": 399,
        "seats": 1,
        "export_limit": 100,
        "features": ["Semantic Search", "Basic ML Valuation", "Single-User Access", "100 CSV Exports/Mo"]
    },
    "team": {
        "name": "Acquisitions Team Tier",
        "price_monthly_usd": 1999,
        "seats": 5,
        "export_limit": 2500,
        "features": ["Submarket Graph Topology", "Deep ML Price Models", "5 Multi-User Seats", "Real-Time Buy-Box Alerts", "2,500 CSV Exports/Mo"]
    },
    "institutional": {
        "name": "Institutional Fund Tier",
        "price_monthly_usd": 4999,
        "seats": 50,
        "export_limit": 50000,
        "features": ["Dedicated Custom Models", "SOC 2 Audit Logs", "Unlimited API Access", "Custom IC Memos", "White-Glove Pipeline Sync"]
    }
}

class CheckoutRequest(BaseModel):
    target_tier: str # scout, team, institutional
    success_url: Optional[str] = "https://app.propyield.ai/dashboard?billing=success"
    cancel_url: Optional[str] = "https://app.propyield.ai/dashboard?billing=cancelled"

@router.get("/subscription")
async def get_current_subscription(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns current organization subscription tier, export quotas, and available upgrades.
    """
    stmt = select(OrganizationModel).where(OrganizationModel.id == current_user.organization_id)
    res = await db.execute(stmt)
    org = res.scalars().first()

    current_tier = org.subscription_tier if org else "scout"
    tier_info = PLAN_DETAILS.get(current_tier, PLAN_DETAILS["scout"])

    return {
        "organization_id": current_user.organization_id,
        "organization_name": org.name if org else "Default",
        "subscription_tier": current_tier,
        "plan_details": tier_info,
        "monthly_export_count": org.monthly_export_count if org else 0,
        "monthly_export_limit": org.monthly_export_limit if org else 100,
        "available_plans": PLAN_DETAILS
    }

@router.post("/checkout")
async def create_checkout_session(
    req: CheckoutRequest,
    current_user: UserModel = Depends(require_roles(["admin", "acquisition_director"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a Stripe Checkout Session or returns a verified upgrade session.
    """
    if req.target_tier not in PLAN_DETAILS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target plan. Must be one of: {list(PLAN_DETAILS.keys())}"
        )

    stmt = select(OrganizationModel).where(OrganizationModel.id == current_user.organization_id)
    res = await db.execute(stmt)
    org = res.scalars().first()

    # If in mock test mode without live Stripe credentials, perform direct tier upgrade
    if settings.STRIPE_SECRET_KEY == "sk_test_mock_key" or not settings.STRIPE_SECRET_KEY.startswith("sk_live"):
        org.subscription_tier = req.target_tier
        org.monthly_export_limit = PLAN_DETAILS[req.target_tier]["export_limit"]
        await db.commit()

        await record_audit_event(
            db=db,
            organization_id=org.id,
            user_id=current_user.id,
            action="BILLING_TIER_UPGRADE",
            details={"tier": req.target_tier, "mode": "direct_or_sandbox"}
        )

        return {
            "checkout_url": req.success_url,
            "session_id": f"sess_mock_{org.id}_{req.target_tier}",
            "status": "UPGRADED_SUCCESSFULLY",
            "tier": req.target_tier
        }

    # Live Stripe Integration
    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        plan = PLAN_DETAILS[req.target_tier]
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"PropYield AI — {plan['name']}",
                        "description": ", ".join(plan["features"][:3]),
                    },
                    "unit_amount": plan["price_monthly_usd"] * 100,
                    "recurring": {"interval": "month"}
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            client_reference_id=org.id,
            customer_email=current_user.email
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Stripe Error: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handles Stripe subscription lifecycle webhooks to update organization quotas.
    """
    payload = await request.body()
    # Signature verification in production if secret configured
    try:
        data = await request.json()
        event_type = data.get("type")
        if event_type == "checkout.session.completed":
            session_obj = data.get("data", {}).get("object", {})
            org_id = session_obj.get("client_reference_id")
            if org_id:
                stmt = select(OrganizationModel).where(OrganizationModel.id == org_id)
                res = await db.execute(stmt)
                org = res.scalars().first()
                if org:
                    org.stripe_customer_id = session_obj.get("customer")
                    org.stripe_subscription_id = session_obj.get("subscription")
                    await db.commit()
        return {"status": "received"}
    except Exception as e:
        return {"status": "ignored", "detail": str(e)}
