from __future__ import annotations
import sqlalchemy as sa

from app.db.database import async_session, references
from app.services.embeddings import embed_text


async def retrieve_context(query: str, user_id: str, n_results: int = 5) -> list[dict]:
    """Retrieve the most relevant references via pgvector cosine similarity."""
    async with async_session() as session:
        count_result = await session.execute(
            sa.select(sa.func.count())
            .select_from(references)
            .where(references.c.embedding.isnot(None), references.c.user_id == user_id)
        )
        if (count_result.scalar() or 0) == 0:
            return []

        query_embedding = await embed_text(query)

        rows = await session.execute(
            sa.select(
                references.c.id,
                references.c.type,
                references.c.title,
                references.c.content,
                references.c.embedding.cosine_distance(query_embedding).label("distance"),
            )
            .where(references.c.embedding.isnot(None), references.c.user_id == user_id)
            .order_by("distance")
            .limit(n_results)
        )

        return [
            {
                "id": row.id,
                "type": row.type,
                "title": row.title,
                "content": row.content,
                "relevance": max(0.0, 1.0 - row.distance),
            }
            for row in rows.fetchall()
        ]


def format_context_for_prompt(references: list[dict]) -> str:
    """Format retrieved references into a string for injection into the system prompt."""
    if not references:
        return ""

    parts = [
        "\n\n--- CREATIVE DNA (the user's personal references) ---",
        "The following are relevant pieces from this user's uploaded creative references. "
        "Use these to ground your response in THEIR unique taste and perspective. "
        "Reference them naturally when relevant. Never list them robotically.\n",
    ]
    for ref in references:
        relevance_pct = int(ref["relevance"] * 100)
        parts.append(
            f"[{ref['type'].upper()}] \"{ref['title']}\" (match: {relevance_pct}%)\n"
            f"{ref['content']}\n"
        )
    parts.append("--- END CREATIVE DNA ---")
    return "\n".join(parts)
