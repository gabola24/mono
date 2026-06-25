from __future__ import annotations
import time
import uuid

import httpx
import sqlalchemy as sa
from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt

from app.config import settings
from app.db.database import async_session, users

# Stable UUID for the single local user in dev mode (no Clerk configured).
SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001"

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600.0  # seconds


async def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_fetched_at
    if not force_refresh and time.time() - _jwks_fetched_at < _JWKS_TTL and _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(settings.clerk_jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = time.time()
    return _jwks_cache


async def _decode_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(401, f"Malformed token: {exc}")

    kid = header.get("kid")
    jwks = await _get_jwks()

    def _find_key(jwks: dict) -> dict | None:
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                return k
        return None

    key = _find_key(jwks)
    if key is None:
        # Key may have rotated — refresh once and retry
        jwks = await _get_jwks(force_refresh=True)
        key = _find_key(jwks)

    if key is None:
        raise HTTPException(401, "Unknown signing key")

    try:
        return jwt.decode(token, key, algorithms=["RS256"], options={"leeway": 60})
    except JWTError as exc:
        raise HTTPException(401, f"Invalid token: {exc}")


async def _get_or_create_user(clerk_user_id: str, email: str | None) -> str:
    """Look up user by Clerk ID; lazy-create on first authenticated request."""
    async with async_session() as session:
        row = await session.execute(
            sa.select(users.c.id).where(users.c.clerk_user_id == clerk_user_id)
        )
        user_id = row.scalar_one_or_none()
        if user_id:
            return user_id
        new_id = str(uuid.uuid4())
        await session.execute(
            users.insert().values(
                id=new_id,
                clerk_user_id=clerk_user_id,
                email=email,
                subscription_tier="free",
                onboarded=False,
            )
        )
        await session.commit()
        return new_id


async def get_current_user(
    authorization: str | None = Header(default=None),
) -> str:
    """FastAPI dependency — returns local user_id.

    When CLERK_JWKS_URL is unset, runs in single-tenant dev mode and
    always returns SYSTEM_USER_ID without requiring an auth header.
    """
    if not settings.clerk_jwks_url:
        return SYSTEM_USER_ID

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required")

    token = authorization.removeprefix("Bearer ")
    payload = await _decode_token(token)

    clerk_id: str | None = payload.get("sub")
    if not clerk_id:
        raise HTTPException(401, "Token missing sub claim")

    email: str | None = payload.get("email")
    return await _get_or_create_user(clerk_id, email)
