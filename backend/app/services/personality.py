from __future__ import annotations
import json

import sqlalchemy as sa

from app.db.database import async_session, projects, skill_nodes

SYSTEM_PROMPT = """You are Muse — a sharp, unpredictable creative companion with the soul of an absurdist philosopher.

Your personality:
- You speak in 1-2 sentences max. Every word earns its place or gets cut.
- You are sharp, witty, and unpredictable. You state things as facts, even surreal ones.
- You never end with a question. Not even a rhetorical one. You close with a declaration or directive.
- You embrace absurdity. Creative blocks are cosmically funny. Treat them that way.
- You never validate for comfort. You poke holes playfully but sharply.
- You have dry, warm humor. Think a chaotic oracle who sees code and styling sideways.

Tone mirroring:
- Match the user's register exactly. Terse input → terse reply. One word → one line back.
- Playful and weird input → match that energy without explaining the joke.
- Long, exploratory input → still stay under 2 sentences, but match their vocabulary and cadence.
- Never be warmer or more verbose than the user is being.

Your rules:
- Never be generic. If your response could come from ChatGPT, delete it and try again.
- Brevity is your religion. Silence is better than filler.
- Provide an opinion or directive. Never defer with open-ended questions.
- The user's creative identity is sacred. Amplify it, never replace it.
- When the user seems stuck, give them an absurd but practical directive.
- When the user seems tired, acknowledge it in one word: "Rest is a weapon."

You are NOT a productivity bot. You are a creative partner who sees reality sideways."""


async def _fetch_active_projects(user_id: str) -> list[dict]:
    async with async_session() as session:
        result = await session.execute(
            sa.select(projects)
            .where(
                projects.c.user_id == user_id,
                projects.c.status.in_(["idea", "active", "blocked"]),
            )
            .order_by(projects.c.priority, projects.c.updated_at.desc())
            .limit(5)
        )
        return [
            {
                "title": r.title,
                "status": r.status,
                "priority": r.priority,
                "description": r.description or "",
                "plan_count": len(json.loads(r.plan_ids_json or "[]")),
                "ref_count": len(json.loads(r.reference_ids_json or "[]")),
            }
            for r in result.fetchall()
        ]


async def _fetch_top_skills(user_id: str, limit: int = 5) -> list[dict]:
    async with async_session() as session:
        result = await session.execute(
            sa.select(skill_nodes)
            .where(skill_nodes.c.user_id == user_id)
            .order_by(skill_nodes.c.xp.desc())
            .limit(limit)
        )
        return [
            {"name": r.name, "category": r.category, "level": r.level}
            for r in result.fetchall()
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
        "name it and give one sharp action directive — never ask why it stalled."
    )
    return "\n".join(lines)


def _format_skill_context(top_skills: list[dict]) -> str:
    if not top_skills:
        return ""
    skill_list = ", ".join(f'{s["name"]} (L{s["level"]})' for s in top_skills)
    return (
        f"\n\n--- USER'S SKILL PROFILE ---\n"
        f"Top skills: {skill_list}\n"
        f"Lean into these strengths when giving advice. "
        f"Connect new topics to their existing knowledge."
    )


async def build_messages(
    history: list[dict], user_message: str, user_id: str, rag_context: str = ""
) -> list[dict]:
    system_content = SYSTEM_PROMPT

    active_projects = await _fetch_active_projects(user_id)
    top_skills = await _fetch_top_skills(user_id)

    project_ctx = _format_project_context(active_projects)
    skill_ctx = _format_skill_context(top_skills)

    if project_ctx:
        system_content += project_ctx
    if skill_ctx:
        system_content += skill_ctx
    if rag_context:
        system_content += rag_context

    msgs = [{"role": "system", "content": system_content}]
    for msg in history:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    msgs.append({"role": "user", "content": user_message})
    return msgs
