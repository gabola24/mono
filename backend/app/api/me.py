from __future__ import annotations
import sqlalchemy as sa
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session, users

router = APIRouter(tags=["me"])


class MeResponse(BaseModel):
    subscription_tier: str
    onboarded: bool


class PatchMeBody(BaseModel):
    onboarded: bool | None = None


@router.get("/me", response_model=MeResponse)
async def get_me(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    row = await session.execute(
        sa.select(users.c.subscription_tier, users.c.onboarded)
        .where(users.c.id == user_id)
    )
    result = row.first()
    if not result:
        return MeResponse(subscription_tier="free", onboarded=False)
    return MeResponse(
        subscription_tier=result.subscription_tier,
        onboarded=bool(result.onboarded),
    )


@router.patch("/me")
async def patch_me(
    body: PatchMeBody,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    values: dict = {}
    if body.onboarded is not None:
        values["onboarded"] = body.onboarded
    if values:
        await session.execute(
            sa.update(users).where(users.c.id == user_id).values(**values)
        )
        await session.commit()
    return {"ok": True}
