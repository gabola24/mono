from __future__ import annotations

from openai import AsyncOpenAI

from app.config import settings

_client = AsyncOpenAI(api_key=settings.openai_api_key)

_SYSTEM = (
    "You explain in ONE sentence (25 words or fewer) the meaningful intersection "
    "between two concepts. If no real intersection exists, reply with the single word NONE."
)


async def generate_edge_reason(
    node_a: str, node_b: str, hint: str | None = None
) -> str | None:
    """Return a one-sentence rationale for why two mind-graph nodes are connected.

    Returns None on error or when no real intersection exists, so callers can
    store NULL without blocking edge creation.
    """
    if hint and hint.strip() and hint.strip().lower() != "--- timeout ---":
        return hint.strip()

    user_msg = f'Concept A: "{node_a}"\nConcept B: "{node_b}"'

    try:
        resp = await _client.chat.completions.create(
            model=settings.openai_reasoning_model,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.3,
            max_tokens=60,
        )
        text = (resp.choices[0].message.content or "").strip()
        if not text or text.upper() == "NONE":
            return None
        return text
    except Exception:
        return None
