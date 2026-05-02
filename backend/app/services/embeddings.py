from __future__ import annotations
import base64
from pathlib import Path

from openai import AsyncOpenAI

from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

EMBEDDING_MODEL = "text-embedding-3-small"


async def embed_text(text: str) -> list[float]:
    response = await client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return response.data[0].embedding


async def describe_image(image_path: str) -> str:
    """Use GPT-4o vision to produce a rich description of an image."""
    path = Path(image_path)
    suffix = path.suffix.lower().lstrip(".")
    mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "gif": "gif", "webp": "webp"}.get(
        suffix, "jpeg"
    )
    image_b64 = base64.b64encode(path.read_bytes()).decode()

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Describe this image in rich detail for a creative professional. "
                            "Cover: visual style, color palette, mood, composition, subject matter, "
                            "artistic influences you detect, and any notable techniques. "
                            "Be specific and evocative, not generic. 3-5 sentences."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/{mime};base64,{image_b64}"},
                    },
                ],
            }
        ],
        max_tokens=300,
    )
    return response.choices[0].message.content or ""
