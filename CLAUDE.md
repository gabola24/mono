# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Project Muse — a tamagotchi-style creative companion. ASCII-art pet ("Muse") that grows as the user uploads references, chats, plans, and tracks habits. Backend is FastAPI + SQLite + ChromaDB; frontend is React 19 + Vite + Zustand with a custom ASCII rendering engine.

## Commands

### Backend (`backend/`)
- Install: `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
- Run dev server: `uvicorn app.main:app --reload --port 8000`
- Env: copy `.env.example` to `.env`; required vars: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o`), `DATABASE_URL` (default `sqlite+aiosqlite:///./muse.db`).
- No formal test or lint setup. `backend/tests/` is empty; `backend/test_skill.py` is an ad-hoc script (`python backend/test_skill.py`), not pytest.

### Frontend (`frontend/`)
- Install: `npm install`
- Dev: `npm run dev` (Vite on port 5173 — must run alongside backend on 8000 for the proxy to work)
- Build: `npm run build` (runs `tsc -b && vite build` — type errors block the build)
- Lint: `npm run lint` (ESLint flat config)
- No `test` or standalone `typecheck` script. To typecheck without building: `npx tsc -b --noEmit`.

## Architecture

### Request flow (chat)
1. Frontend `useChat` POSTs to `/api/chat` and reads the response with `res.body.getReader()` — **streamed plain-text/NDJSON tokens, not EventSource/SSE** despite the README phrasing. Code paths: `frontend/src/hooks/useChat.ts` ↔ `backend/app/api/chat.py`.
2. `backend/app/services/conversation.py` orchestrates: load history from SQLite → embed user message (`services/embeddings.py`) → retrieve RAG context from Chroma (`services/rag_pipeline.py`) → assemble prompt via `services/personality.py` (Muse system prompt + top-5 active projects + top-5 skills + RAG snippets + history) → stream OpenAI completion (temp 0.9, max_tokens 512).
3. After the stream closes, both turns persist to SQLite, then `services/skill_discovery.process_skill_discovery` and `services/mind_graph_sync.sync_mind_graph` run as post-hooks to update the skill tree and mind graph.

### Persistence
- **SQLite** at `backend/muse.db` (SQLAlchemy async via `aiosqlite`). Schema initialized in the FastAPI lifespan from `backend/app/db/database.py`.
- **ChromaDB** PersistentClient at `backend/chroma_data/`, single `references` collection (cosine HNSW). Holds reference embeddings used for RAG.
- **Uploads** at `backend/uploads/`, served at `/uploads`.
- All three are runtime state — `muse.db` and `chroma_data/length.bin` regularly show as modified in `git status`. Don't commit these.

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

## Out-of-scope notes

- `Newideas.md`, `implementation_plan.md`, `plan.html`, `ascii_resources.md` are working notes, not authoritative specs. Treat code as the source of truth.
