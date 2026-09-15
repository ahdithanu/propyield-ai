import logging
from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal
from app.db.models import OrganizationModel, UserModel
from app.core.security import get_password_hash

logger = logging.getLogger("SeedData")

DEFAULT_ORG_ID = "org_default"
DEFAULT_ORG_SLUG = "redwood-cap"

async def seed_default_organization_and_users():
    """
    Seeds default enterprise organization and role accounts if not present.
    """
    async with AsyncSessionLocal() as session:
        # 1. Check or create default Organization
        org_stmt = select(OrganizationModel).where(OrganizationModel.id == DEFAULT_ORG_ID)
        res = await session.execute(org_stmt)
        org = res.scalars().first()

        if not org:
            logger.info("Seeding default institutional organization: Redwood Real Estate Capital")
            org = OrganizationModel(
                id=DEFAULT_ORG_ID,
                name="Redwood Real Estate Capital",
                slug=DEFAULT_ORG_SLUG,
                subscription_tier="institutional",
                monthly_export_limit=10000,
                monthly_export_count=12,
                is_active=True
            )
            session.add(org)
            await session.commit()
            await session.refresh(org)

        # 2. Check and seed standard role users
        default_users = [
            {
                "id": "usr_admin_1",
                "email": "admin@propyield.ai",
                "password": "Password123!",
                "full_name": "Marcus Vance (CISO/Admin)",
                "role": "admin",
                "mfa_enabled": False
            },
            {
                "id": "usr_director_1",
                "email": "director@propyield.ai",
                "password": "Password123!",
                "full_name": "Elena Rostova (Acquisitions Director)",
                "role": "acquisition_director",
                "mfa_enabled": False
            },
            {
                "id": "usr_analyst_1",
                "email": "analyst@propyield.ai",
                "password": "Password123!",
                "full_name": "David Chen (CRE Analyst)",
                "role": "analyst",
                "mfa_enabled": False
            },
            {
                "id": "usr_auditor_1",
                "email": "auditor@propyield.ai",
                "password": "Password123!",
                "full_name": "Sarah Jenkins (SOC2 Auditor)",
                "role": "auditor",
                "mfa_enabled": False
            },
        ]

        for u in default_users:
            u_stmt = select(UserModel).where(UserModel.email == u["email"])
            u_res = await session.execute(u_stmt)
            existing_user = u_res.scalars().first()
            if not existing_user:
                logger.info(f"Seeding default role account: {u['email']} [{u['role']}]")
                new_u = UserModel(
                    id=u["id"],
                    organization_id=DEFAULT_ORG_ID,
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    mfa_enabled=u["mfa_enabled"],
                    is_active=True
                )
                session.add(new_u)

        await session.commit()
