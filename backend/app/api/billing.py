from __future__ import annotations
import asyncio

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import settings
from app.db.database import get_session, users

router = APIRouter(tags=["billing"])


def _require_stripe():
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Billing not configured")


@router.post("/billing/checkout")
async def create_checkout(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    _require_stripe()
    if not settings.stripe_price_id:
        raise HTTPException(503, "Stripe price not configured")

    import stripe as _stripe

    row = await session.execute(
        sa.select(users.c.email, users.c.stripe_customer_id)
        .where(users.c.id == user_id)
    )
    user = row.first()

    kwargs: dict = dict(
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        client_reference_id=user_id,
        success_url=f"{settings.app_url}/?upgraded=1",
        cancel_url=f"{settings.app_url}/",
    )
    if user and user.stripe_customer_id:
        kwargs["customer"] = user.stripe_customer_id
    elif user and user.email:
        kwargs["customer_email"] = user.email

    checkout = await asyncio.to_thread(
        lambda: _stripe.checkout.Session.create(api_key=settings.stripe_secret_key, **kwargs)
    )
    return {"url": checkout.url}


@router.get("/billing/portal")
async def billing_portal(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    _require_stripe()
    import stripe as _stripe

    row = await session.execute(
        sa.select(users.c.stripe_customer_id).where(users.c.id == user_id)
    )
    customer_id = row.scalar_one_or_none()
    if not customer_id:
        raise HTTPException(400, "No billing account found. Complete a purchase first.")

    portal = await asyncio.to_thread(
        lambda: _stripe.billing_portal.Session.create(
            api_key=settings.stripe_secret_key,
            customer=customer_id,
            return_url=settings.app_url,
        )
    )
    return {"url": portal.url}
