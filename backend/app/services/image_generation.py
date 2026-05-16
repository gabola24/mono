from __future__ import annotations

from openai import AsyncOpenAI

from app.config import settings
from app.services.rag_pipeline import retrieve_context

client = AsyncOpenAI(api_key=settings.openai_api_key)


def _build_image_prompt(user_brief: str, refs: list[dict]) -> str:
    parts = []
    if user_brief:
        parts.append(user_brief)
    if refs:
        ref_lines = [f'"{r["title"]}": {r["content"][:120]}' for r in refs[:2]]
        parts.append("Inspired by: " + "; ".join(ref_lines))
    return " // ".join(parts) if parts else "abstract creative inspiration"


async def generate_inspiration(user_brief: str) -> dict:
    refs = await retrieve_context(user_brief or "creative inspiration", n_results=3)
    prompt = _build_image_prompt(user_brief, refs)

    result = await client.images.generate(
        model=settings.openai_image_model,
        prompt=prompt,
        size="1024x1024",
        n=1,
    )

    img_data = result.data[0]
    url = getattr(img_data, "url", None)
    if not url:
        b64 = getattr(img_data, "b64_json", None)
        if b64:
            url = f"data:image/png;base64,{b64}"

    return {
        "url": url or "",
        "prompt": prompt,
        "ref_ids": [r["id"] for r in refs],
    }
