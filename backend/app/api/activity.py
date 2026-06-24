from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.database import get_session
from app.services.streak import record_activity, get_streak_info

router = APIRouter(tags=["activity"])


@router.post("/activity/checkin")
async def checkin(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    await record_activity(session, user_id)
    return await get_streak_info(session, user_id)


@router.get("/activity/streak")
async def streak(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    return await get_streak_info(session, user_id)
