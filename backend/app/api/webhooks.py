from __future__ import annotations
import base64
import hashlib
import hmac
import json
import time
import uuid

import sqlalchemy as sa
from fastapi import APIRouter, HTTPException, Header, Request

from app.config import settings
from app.db.database import (
    async_session,
    users,
    conversations,
    messages,
    references,
    activity_log,
    daily_stats,
    plans,
    habits,
    habit_logs,
    skill_nodes,
    skill_edges,
    skill_badges,
    mind_nodes,
    node_connections,
    projects,
    project_notes,
)

router = APIRouter(tags=["webhooks"])

# Delete order respects FK constraints: children before parents.
_TABLES_BY_USER = [
    messages,
    activity_log,
    daily_stats,
    plans,
    habit_logs,
    habits,
    skill_edges,
    skill_badges,
    skill_nodes,
    node_connections,
    mind_nodes,
    project_notes,
    projects,
    references,
    conversations,
]


def _verify_svix(
    payload: bytes,
    msg_id: str,
    msg_timestamp: str,
    sig_header: str,
    secret: str,
) -> bool:
    try:
        secret_bytes = base64.b64decode(secret.removeprefix("whsec_"))
    except Exception:
        return False
    to_sign = f"{msg_id}.{msg_timestamp}.".encode() + payload
    expected = base64.b64encode(
        hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()
    ).decode()
    for part in sig_header.split():
        if part.startswith("v1,") and hmac.compare_digest(part[3:], expected):
            return True
    return False


@router.post("/webhooks/clerk")
async def clerk_webhook(
    request: Request,
    svix_id: str | None = Header(default=None, alias="svix-id"),
    svix_timestamp: str | None = Header(default=None, alias="svix-timestamp"),
    svix_signature: str | None = Header(default=None, alias="svix-signature"),
):
    if not settings.clerk_webhook_secret:
        raise HTTPException(400, "Webhook not configured")

    if not all([svix_id, svix_timestamp, svix_signature]):
        raise HTTPException(400, "Missing Svix headers")

    try:
        if abs(time.time() - int(svix_timestamp)) > 300:  # type: ignore[arg-type]
            raise HTTPException(400, "Webhook timestamp expired")
    except (ValueError, TypeError):
        raise HTTPException(400, "Invalid timestamp")

    body = await request.body()

    if not _verify_svix(body, svix_id, svix_timestamp, svix_signature, settings.clerk_webhook_secret):  # type: ignore[arg-type]
        raise HTTPException(401, "Invalid signature")

    event = json.loads(body)
    event_type = event.get("type", "")
    data = event.get("data", {})

    async with async_session() as session:
        if event_type == "user.created":
            await _on_user_created(session, data)
        elif event_type == "user.deleted":
            await _on_user_deleted(session, data)

    return {"received": True}


async def _on_user_created(session, data: dict) -> None:
    clerk_id = data.get("id")
    if not clerk_id:
        return

    email: str | None = None
    for addr in data.get("email_addresses", []):
        email = addr.get("email_address")
        break

    existing = await session.execute(
        sa.select(users.c.id).where(users.c.clerk_user_id == clerk_id)
    )
    if existing.scalar_one_or_none():
        # Lazy-creation already happened on first request — just backfill email
        if email:
            await session.execute(
                sa.update(users)
                .where(users.c.clerk_user_id == clerk_id)
                .values(email=email)
            )
            await session.commit()
        return

    await session.execute(
        users.insert().values(
            id=str(uuid.uuid4()),
            clerk_user_id=clerk_id,
            email=email,
            subscription_tier="free",
            onboarded=False,
        )
    )
    await session.commit()


async def _on_user_deleted(session, data: dict) -> None:
    clerk_id = data.get("id")
    if not clerk_id:
        return

    row = await session.execute(
        sa.select(users.c.id).where(users.c.clerk_user_id == clerk_id)
    )
    user_id = row.scalar_one_or_none()
    if not user_id:
        return

    for table in _TABLES_BY_USER:
        await session.execute(sa.delete(table).where(table.c.user_id == user_id))

    await session.execute(sa.delete(users).where(users.c.id == user_id))
    await session.commit()
