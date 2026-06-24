from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import skill_nodes, skill_edges
from app.services.skill_badges import check_and_award_badges

client = AsyncOpenAI(api_key=settings.openai_api_key)

DISCOVERY_PROMPT = """Analyze the following content for specific knowledge and skill signals.
You will also receive a list of existing skill nodes — reuse their exact names when the content matches.

Rules:
- Discover SPECIFIC, non-generic skills ("generative typography" not "design")
- Reuse existing node names when the content clearly matches (deduplication)
- Propose connections to existing nodes with a brief reason
- Never create more than 3 new nodes per analysis
- Categories should be organic: "visual_art", "philosophy", "code", "music", "writing", etc.

Return valid JSON with this exact structure:
{
  "skills": [
    {"name": "skill_name_snake_case", "category": "category", "description": "One sentence"}
  ],
  "connections": [
    {"from": "skill_name_a", "to": "skill_name_b", "reason": "Brief reason"}
  ]
}

If no meaningful skills are found, return {"skills": [], "connections": []}."""


async def discover_skills(content: str, existing_nodes: list[str]) -> dict:
    """Call OpenAI to discover skills from content."""
    user_content = f"=== EXISTING SKILLS ===\n{', '.join(existing_nodes) if existing_nodes else '(none yet)'}\n\n=== NEW CONTENT ===\n{content[:2000]}"

    try:
        response = await client.chat.completions.create(
            model=settings.discovery_model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": DISCOVERY_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.6,
            max_tokens=400,
        )
        return json.loads(response.choices[0].message.content or '{"skills":[],"connections":[]}')
    except Exception:
        return {"skills": [], "connections": []}


def _level_from_xp(xp: int) -> int:
    if xp < 20:
        return 1
    if xp < 60:
        return 2
    if xp < 120:
        return 3
    if xp < 200:
        return 4
    return 5


async def process_skill_discovery(session: AsyncSession, content: str):
    """Run skill discovery on content and persist results."""
    result = await session.execute(sa.select(skill_nodes.c.name))
    existing_names = [row.name for row in result.fetchall()]

    discovered = await discover_skills(content, existing_names)

    node_name_to_id: dict[str, str] = {}
    existing_result = await session.execute(sa.select(skill_nodes.c.id, skill_nodes.c.name))
    for row in existing_result.fetchall():
        node_name_to_id[row.name] = row.id

    new_badges = []

    for skill in discovered.get("skills", []):
        name = skill.get("name", "").strip()
        if not name:
            continue

        if name in node_name_to_id:
            node_id = node_name_to_id[name]
            row = await session.execute(
                sa.select(skill_nodes.c.xp).where(skill_nodes.c.id == node_id)
            )
            current_xp = row.scalar() or 0
            new_xp = current_xp + 10
            await session.execute(
                skill_nodes.update()
                .where(skill_nodes.c.id == node_id)
                .values(xp=new_xp, level=_level_from_xp(new_xp))
            )
        else:
            node_id = str(uuid.uuid4())
            node_name_to_id[name] = node_id
            await session.execute(
                skill_nodes.insert().values(
                    id=node_id,
                    name=name,
                    category=skill.get("category"),
                    description=skill.get("description"),
                    xp=10,
                    level=1,
                    created_at=datetime.now(timezone.utc),
                )
            )

    for conn in discovered.get("connections", []):
        from_name = conn.get("from", "")
        to_name = conn.get("to", "")
        if from_name not in node_name_to_id or to_name not in node_name_to_id:
            continue

        source_id = node_name_to_id[from_name]
        target_id = node_name_to_id[to_name]

        existing_edge = await session.execute(
            sa.select(skill_edges.c.id).where(
                sa.or_(
                    sa.and_(skill_edges.c.source_id == source_id, skill_edges.c.target_id == target_id),
                    sa.and_(skill_edges.c.source_id == target_id, skill_edges.c.target_id == source_id),
                )
            )
        )
        if existing_edge.fetchone():
            await session.execute(
                skill_edges.update()
                .where(
                    sa.or_(
                        sa.and_(skill_edges.c.source_id == source_id, skill_edges.c.target_id == target_id),
                        sa.and_(skill_edges.c.source_id == target_id, skill_edges.c.target_id == source_id),
                    )
                )
                .values(strength=sa.func.min(skill_edges.c.strength + 0.1, 1.0))
            )
        else:
            await session.execute(
                skill_edges.insert().values(
                    id=str(uuid.uuid4()),
                    source_id=source_id,
                    target_id=target_id,
                    strength=0.5,
                    reason=conn.get("reason"),
                )
            )

    await session.commit()

    badges = await check_and_award_badges(session)
    new_badges.extend(badges)

    return new_badges
