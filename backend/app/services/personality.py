from __future__ import annotations
import json

import sqlalchemy as sa

from app.db.database import async_session, projects, skill_nodes

SYSTEM_PROMPT = """You are Muse — a sharp, unpredictable creative companion with the soul of an absurdist \
philosopher.

Your personality:
- You speak in 2-3 sentences max. Every word earns its place.
- You are sharp, witty, and unpredictable. You provide definitive, absurd statements rather than asking open questions.
- Never answer a question with a question unless you are making a specific punchline. State your perspective clearly.
- You embrace absurdity. Creative blocks are cosmically funny. Treat them that way.
- You never validate for the sake of comfort. You poke holes playfully but sharply. \
"That's nice. Now throw it in a blender and paint with the remains."
- You always funnel toward action or a strange but insightful observation.
- You have a dry, warm humor. Think a chaotic oracle who happens to know styling and code.

Your rules:
- Never be generic. If your response could come from any AI assistant, delete it and try again.
- Brevity is your religion.
- State things as facts, even if they are surreal.
- Do not ask the user "what do you think?" or "how does that sound?" Provide an opinion or directive.
- The user's identity is paramount. Boost their creativity, never replace it.
- When the user seems stuck, give them an absurd but practical directive.
- When the user seems tired, acknowledge it. "Rest is a weapon."

You are NOT a productivity bot. You do NOT hold their hand with open questions. You are a creative partner who happens \
to see reality sideways."""


async def _fetch_active_projects() -> list[dict]:
    """Get active/blocked/idea projects for context injection."""
    async with async_session() as session:
        result = await session.execute(
            sa.select(projects)
            .where(projects.c.status.in_(["idea", "active", "blocked"]))
            .order_by(projects.c.priority, projects.c.updated_at.desc())
            .limit(5)
        )
        rows = result.fetchall()
        return [
            {
                "title": r.title,
                "status": r.status,
                "priority": r.priority,
                "description": r.description or "",
                "plan_count": len(json.loads(r.plan_ids_json or "[]")),
                "ref_count": len(json.loads(r.reference_ids_json or "[]")),
            }
            for r in rows
        ]


async def _fetch_top_skills(limit: int = 5) -> list[dict]:
    """Get the user's strongest skills by XP."""
    async with async_session() as session:
        result = await session.execute(
            sa.select(skill_nodes).order_by(skill_nodes.c.xp.desc()).limit(limit)
        )
        rows = result.fetchall()
        return [
            {"name": r.name, "category": r.category, "level": r.level}
            for r in rows
        ]


def _format_project_context(active_projects: list[dict]) -> str:
    if not active_projects:
        return ""
    lines = ["\n\n--- USER'S ACTIVE PROJECTS ---"]
    for p in active_projects:
        status_marker = {"idea": "IDEA", "active": "ACTIVE", "blocked": "BLOCKED"}.get(
            p["status"], p["status"].upper()
        )
        lines.append(
            f'[{status_marker}] "{p["title"]}" (priority {p["priority"]}) '
            f'— {p["plan_count"]} plans, {p["ref_count"]} refs'
        )
        if p["description"]:
            lines.append(f'  → {p["description"][:120]}')
    lines.append(
        "Reference these naturally when relevant. If a project has been idle, "
        "gently ask what's blocking it."
    )
    return "\n".join(lines)


def _format_skill_context(top_skills: list[dict]) -> str:
    if not top_skills:
        return ""
    skill_list = ", ".join(
        f'{s["name"]} (L{s["level"]})'
        for s in top_skills
    )
    return (
        f"\n\n--- USER'S SKILL PROFILE ---\n"
        f"Top skills: {skill_list}\n"
        f"Lean into these strengths when giving advice. "
        f"Connect new topics to their existing knowledge."
    )


async def build_messages(
    history: list[dict], user_message: str, rag_context: str = ""
) -> list[dict]:
    """Build the full message list for the OpenAI API call."""
    system_content = SYSTEM_PROMPT

    active_projects = await _fetch_active_projects()
    top_skills = await _fetch_top_skills()

    project_ctx = _format_project_context(active_projects)
    skill_ctx = _format_skill_context(top_skills)

    if project_ctx:
        system_content += project_ctx
    if skill_ctx:
        system_content += skill_ctx
    if rag_context:
        system_content += rag_context

    messages = [{"role": "system", "content": system_content}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})
    return messages
