from __future__ import annotations

# Stable UUID for the single local user during Phase 1b→1c (pre-Clerk).
# Phase 1d replaces get_current_user with real JWT verification.
SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001"


def get_current_user() -> str:
    return SYSTEM_USER_ID
