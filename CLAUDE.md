# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Zukuri** — a note-app-vibed creative companion SaaS. Chat with an AI companion that grows as you share thoughts, plans, and references. Features: ASCII pet (5 stages), mind graph, skill tree, 6 arcade games, workspace, project garage.

**Product direction (June 2026):** Pivoting from local prototype to multi-tenant SaaS on branch `saas-refactor`. Free tier (20 msgs/day, companion stages 1–2, graph glance) + Pro at $5/mo (unlimited, all features). Stack target: FastAPI + **Postgres + pgvector** (replacing SQLite + ChromaDB) + Clerk auth + Stripe billing + Railway hosting.

## Commands

### Backend (`backend/`)
- Install: `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
- Local DB: `docker-compose up -d postgres` (Postgres + pgvector — replaces SQLite/ChromaDB as of Phase 1b)
- Run dev server: `uvicorn app.main:app --reload --port 8000`
- Migrations: `cd backend && alembic upgrade head` (Alembic adopted in Phase 1b)
- Env: copy `.env.example` to `.env`; required vars: `OPENAI_API_KEY`, `DATABASE_URL` (default `postgresql+asyncpg://...`).
- Model routing: all OpenAI calls use **purpose-specific config fields** (`chat_model`, `discovery_model`, `edge_reason_model`, `plan_model`, `dna_model`, `vision_model`, `image_model`) — all default to `gpt-4o-mini`. Override individually in `.env` if needed. Do **not** add a single `OPENAI_MODEL` back.
- No formal test or lint setup. `backend/tests/` is empty; `backend/test_skill.py` is an ad-hoc script (`python backend/test_skill.py`), not pytest.

### Frontend (`frontend/`)
- Install: `npm install`
- Dev: `npm run dev` (Vite on port 5173 — must run alongside backend on 8000 for the proxy to work)
- Build: `npm run build` (runs `tsc -b && vite build` — type errors block the build)
- Lint: `npm run lint` (ESLint flat config)
- No `test` or standalone `typecheck` script. To typecheck without building: `npx tsc -b --noEmit`.

## Architecture

### Request flow (chat)
1. Frontend `useChat` POSTs to `/api/chat` and reads the response with `res.body.getReader()` — **streamed plain-text/NDJSON tokens, not EventSource/SSE**. Code paths: `frontend/src/hooks/useChat.ts` ↔ `backend/app/api/chat.py`.
2. `backend/app/services/conversation.py` orchestrates: load last 10 turns of history (capped) → embed user message (`services/embeddings.py`) → retrieve RAG context via **pgvector cosine search** (`services/rag_pipeline.py`) → assemble prompt via `services/personality.py` (Muse system prompt + top-5 active projects + top-5 skills + RAG snippets + history) → stream `chat_model` completion (temp 0.9, max_tokens 160).
3. After the stream closes both turns persist to DB. Then `_background_analysis` fires as an `asyncio.create_task` — it opens its own session and runs `process_skill_discovery` + `sync_mind_graph` without blocking the response.

### Persistence
- **Postgres** (via `asyncpg` + SQLAlchemy async). Schema managed by **Alembic** (`backend/alembic/`). Local dev via `docker-compose up -d postgres`.
- **pgvector** — `references` table has an `embedding VECTOR(1536)` column. RAG lookup is `ORDER BY embedding <-> :query LIMIT 5`. ChromaDB is fully removed.
- **Uploads** at `backend/uploads/`, served at `/uploads`.
- Runtime state: `muse.db` and `chroma_data/` are legacy artifacts on the `develop` branch — not present on `saas-refactor`. Don't commit DB files.

### Frontend state
Zustand stores in `frontend/src/stores/`. `authStore` and `companionStore` use `persist` (localStorage). One store per domain: `chatStore`, `companionStore` (mood/stage/xp/level + daily decay), `garageStore` (projects), `referenceStore`, `skillTreeStore`, `workspaceStore` (plans/habits/DNA).

### Companion ASCII engine (in active migration — May 2026)
The companion was previously an AI-generated PNG; it is now fully programmatic ASCII composited per render.
- `frontend/src/components/Companion/asciiEngine.ts` — `AsciiCanvas` primitive (char grid with `set/get/paint/hline`, `toLines/toString`).
- `frontend/src/components/Companion/asciiRoom.ts` — room scene (46×18 grid, baseboard/floor, per-stage pet anchors, slot-based `OBJECT_CATALOG` keyed by skill category). Exports `buildRoomCanvas`, `resolveRoomObjects`, `compositeScene`.
- `frontend/src/components/Companion/asciiFrames.ts` — per-stage × per-mood pet frames + `SKILL_DECORATIONS` overlays applied through `applySkillDecorations`.
- `frontend/src/components/Companion/RoomScene.tsx` — React component, memoizes scene + cycles frames via `setInterval`.
- `frontend/src/components/Companion/CompanionAvatar.tsx` wraps `<RoomScene />` and owns XP-flash, mood glow, transcended-stage aura.

When touching companion visuals, edit the ASCII modules — do **not** reintroduce PNG/sprite paths.

## Conventions & gotchas

- **TypeScript strict is on** in `frontend/tsconfig.app.json` (`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`). The build will fail on unused imports.
- **No path aliases**; use relative imports.
- **Frontend → backend URL** is mostly relative (`/api/...`) and routed through Vite's proxy (`/api` and `/uploads` → `localhost:8000`, see `vite.config.ts`). **Two places hardcode `http://localhost:8000`**: `frontend/src/App.tsx` (stats endpoints) and `frontend/src/hooks/useMindGraph.ts`. These will break in production — prefer the relative-path pattern when adding new calls.
- **No `VITE_*` env vars** are read anywhere in the frontend.
- Backend routers are mounted under `/api` from `backend/app/main.py`: `chat, references, activity, plans, habits, profile, projects, skills, companion, stats, graph, link_game`.
- `scripts/chroma_key.py` is a standalone Pillow/numpy sprite-sheet utility — unrelated to ChromaDB despite the name.

## SaaS refactor phases (branch: `saas-refactor`)

| Phase | Status | What |
|---|---|---|
| **1a** | ✅ Done | Model routing (gpt-4o-mini), history cap (10 turns), background tasks |
| **1b** | 🔄 In progress | SQLite→Postgres, ChromaDB→pgvector, Alembic setup |
| **1c** | Pending | Multi-tenancy: `user_id` on all 12 tables, isolation tests |
| **1d** | Pending | Clerk auth (backend JWT + frontend React SDK) |
| **2** | Pending | Note-app reframe: companion+chat fullscreen, drawer, onboarding |
| **3** | Pending | Stripe billing, Pro gates, usage limits, account lifecycle |
| **4** | Pending | Railway + Vercel deploy, Sentry, PostHog, ToS/Privacy |
| **5** | Pending | Landing page (Astro) |
| **6** | Pending | PWA, lazy-load arcade, launch |

Free tier: 20 msgs/day, companion stages 1–2, graph 10-node glance. Pro ($5/mo): 500 msgs/day, all features.

## Out-of-scope notes

- `Newideas.md`, `implementation_plan.md`, `plan.html`, `ascii_resources.md` are working notes, not authoritative specs. Treat code as the source of truth.
