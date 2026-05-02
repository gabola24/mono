from __future__ import annotations
from app.services.embeddings import embed_text
from app.db.vectorstore import query_references, reference_count


async def retrieve_context(query: str, n_results: int = 5) -> list[dict]:
    """Retrieve the most relevant references for a given query."""
    if reference_count() == 0:
        return []

    query_embedding = await embed_text(query)
    results = query_references(query_embedding, n_results=n_results)

    context = []
    for i, doc_id in enumerate(results["ids"][0]):
        meta = results["metadatas"][0][i]
        context.append(
            {
                "id": doc_id,
                "type": meta.get("type", "text"),
                "title": meta.get("title", "Untitled"),
                "content": results["documents"][0][i],
                "relevance": 1 - results["distances"][0][i],
            }
        )
    return context


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
