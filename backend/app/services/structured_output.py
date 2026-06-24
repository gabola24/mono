from __future__ import annotations
import json

from openai import AsyncOpenAI

from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

PLAN_SYSTEM_PROMPT = """You are a sharp creative strategist. The user will give you a topic or idea.
Generate a structured action plan. Be concise, specific, and opinionated.
No generic advice. Each step should be concrete and actionable.

Return valid JSON with this exact structure:
{
  "title": "Short punchy title for the plan",
  "summary": "1-2 sentence summary of the approach",
  "steps": [
    {"order": 1, "title": "Step name", "description": "Specific action, max 2 sentences"},
    ...
  ]
}

Rules:
- 3-7 steps maximum. Fewer is better.
- First step should be something the user can do TODAY.
- Last step should be a reflection/iteration step.
- Be sharp. No filler. No corporate speak.
- If the idea is bad, say so in the summary and still give a plan to test it."""


async def generate_plan(topic: str, context: str = "") -> dict:
    """Generate a structured plan from a topic using OpenAI JSON mode."""
    user_content = topic
    if context:
        user_content += f"\n\nAdditional context from the user's creative references:\n{context}"

    response = await client.chat.completions.create(
        model=settings.plan_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": PLAN_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.8,
        max_tokens=800,
    )

    return json.loads(response.choices[0].message.content or "{}")


DNA_SYSTEM_PROMPT = """Analyze the following collection of a creative person's references, \
notes, and conversation excerpts. Build a Creative DNA profile.

Return valid JSON with this exact structure:
{
  "themes": ["theme1", "theme2", ...],
  "color_tendencies": ["tendency1", "tendency2", ...],
  "influences": ["influence1", "influence2", ...],
  "patterns": ["pattern1", "pattern2", ...],
  "creative_energy": "One sentence about their creative energy and tendencies"
}

Rules:
- Be SPECIFIC. Not "minimalism" but "brutalist minimalism with warm textures".
- Identify 3-6 items per category.
- Look for contradictions and tensions — those are the most interesting.
- The "patterns" field should capture behavioral/creative tendencies.
- Be honest. If you see derivative tendencies, note them diplomatically.
- Write as if speaking to the person directly: "You tend to..."."""


async def analyze_creative_dna(
    reference_texts: list[str], conversation_snippets: list[str]
) -> dict:
    """Analyze references and conversations to build a Creative DNA profile."""
    content_parts = []

    if reference_texts:
        content_parts.append("=== REFERENCES ===")
        for i, text in enumerate(reference_texts[:30], 1):
            content_parts.append(f"[{i}] {text[:300]}")

    if conversation_snippets:
        content_parts.append("\n=== RECENT CONVERSATIONS ===")
        for snippet in conversation_snippets[:15]:
            content_parts.append(snippet[:400])

    if not content_parts:
        return {
            "themes": [],
            "color_tendencies": [],
            "influences": [],
            "patterns": ["Not enough data yet. Feed me more references."],
            "creative_energy": "Unknown — the canvas is still blank.",
        }

    response = await client.chat.completions.create(
        model=settings.dna_model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": DNA_SYSTEM_PROMPT},
            {"role": "user", "content": "\n".join(content_parts)},
        ],
        temperature=0.7,
        max_tokens=600,
    )

    return json.loads(response.choices[0].message.content or "{}")
