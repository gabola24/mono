# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Zukuri** — a note-app-vibed creative companion SaaS. Chat with an AI companion that grows as you share thoughts, plans, and references. Features: ASCII pet (5 stages), mind graph, skill tree, 6 arcade games, workspace, project garage.

**Current state (July 2026):** Full multi-tenant SaaS running on `develop`. Free tier (20 msgs/day, companion stages 1–2, 10-node graph glance) + Pro at $5/mo (500 msgs/day, all features). Stack: FastAPI + **Neon Postgres + pgvector** + Clerk auth + Stripe billing. Frontend on Vercel, backend on Railway.

## Commands

### Backend (`backend/`)
- Install: `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
- DB: Cloud Postgres on **Neon** — no local Docker needed. Set `DATABASE_URL` in `.env` (see format below).
- Run dev server: `uvicorn app.main:app --reload --port 8000`
- Migrations: `cd backend && alembic upgrade head`
- Env: copy `.env.example` to `.env`. Required vars: `OPENAI_API_KEY`, `DATABASE_URL`.

**`DATABASE_URL` format for Neon (asyncpg):**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname?sslmode=require&channel_binding=require
```
The `_asyncpg_engine_args()` helper in `app/db/database.py` strips psql-specific params (`sslmode`, `channel_binding`, etc.) and passes `ssl=True` via `connect_args` — asyncpg does not accept these as URL query params.

- Model routing: all OpenAI calls use **purpose-specific config fields** (`chat_model`, `discovery_model`, `edge_reason_model`, `plan_model`, `dna_model`, `vision_model`, `image_model`) — all default to `gpt-4o-mini`. Override individually in `.env`.

### Frontend (`frontend/`)
- Install: `npm install`
- Dev: `npm run dev` (Vite on port 5173 — must run alongside backend on 8000 for the proxy to work)
- Build: `npm run build` (runs `tsc -b && vite build` — type errors block the build)
- Lint: `npm run lint`
- Typecheck only: `npx tsc -b --noEmit`

## Architecture

### Request flow (chat)
1. Frontend `useChat` POSTs to `/api/chat` via `apiFetch` and reads the response with `res.body.getReader()` — **streamed NDJSON tokens, not EventSource/SSE**. Code paths: `frontend/src/hooks/useChat.ts` ↔ `backend/app/api/chat.py`.
2. `backend/app/services/conversation.py` orchestrates: load last 10 turns of history → embed user message → retrieve RAG context via pgvector cosine search → assemble prompt via `services/personality.py` → stream `chat_model` completion (temp 0.9, max_tokens 160).
3. After stream closes, both turns persist to DB. Then `_background_analysis` fires as `asyncio.create_task` — runs `process_skill_discovery` + `sync_mind_graph` without blocking.

### Auth
- **Backend**: `backend/app/auth.py` — `get_current_user` dependency. Verifies Clerk JWT when `CLERK_JWKS_URL` is set; falls back to `SYSTEM_USER_ID` (`00000000-0000-0000-0000-000000000001`) for local dev without Clerk configured.
- **Frontend**: `VITE_CLERK_PUBLISHABLE_KEY` in env enables Clerk. When set, `App.tsx` renders `<ClerkWrapper>` (Clerk `<SignedIn>/<SignedOut>` flow). When not set, renders `<AppContent>` directly using the system user.
- `frontend/src/lib/api.ts` — `apiFetch` wrapper injects `Authorization: Bearer <jwt>` when Clerk is active. Call `registerTokenGetter(getToken)` on mount. Call `register402Handler(fn)` to wire paywall modal to 402 responses.

### Billing
- **Backend**: `backend/app/api/billing.py` — `POST /api/billing/checkout` (Stripe Checkout Session), `GET /api/billing/portal` (Customer Portal URL). `backend/app/api/webhooks.py` handles `POST /api/webhooks/stripe` with signature verification and idempotency via `stripe_events` table.
- **Usage limits**: `backend/app/usage.py` — `check_and_increment_messages()` called before streaming in `chat.py`. Uses Postgres `INSERT ... ON CONFLICT DO UPDATE` for atomic increment. Raises HTTP 402 when daily limit reached.
- **Frontend**: `frontend/src/stores/billingStore.ts` — Zustand store with `tier`, `openUpsell`, `loadTier`. `UpsellModal.tsx` opens on 402 or locked feature click. `SettingsPanel.tsx` has Manage Subscription → Stripe Portal + Export/Delete account.

### Persistence
- **Neon Postgres** (via `asyncpg` + SQLAlchemy async). Schema managed by **Alembic** (`backend/alembic/versions/`): `001_initial_schema`, `002_add_user_tenancy`, `003_billing_and_usage`.
- **pgvector** — `references` table has `embedding VECTOR(1536)`. RAG lookup: `ORDER BY embedding <-> :query LIMIT 5`. ChromaDB fully removed.
- **Uploads** at `backend/uploads/`, served at `/uploads`.
- `muse.db` and `chroma_data/` are legacy artifacts — do not commit.

### Frontend state
Zustand stores in `frontend/src/stores/`:
- `chatStore` — messages, conversationId, streaming state
- `companionStore` — mood/stage/xp/level/name + daily decay. Persisted (localStorage).
- `billingStore` — subscription tier, upsell modal state
- `garageStore` — projects
- `referenceStore`, `skillTreeStore`, `workspaceStore` (plans/habits/DNA)

### Companion ASCII engine
Fully programmatic ASCII composited per render — do **not** reintroduce PNG/sprite paths.
- `asciiEngine.ts` — `AsciiCanvas` primitive (char grid, `set/get/paint/hline/toLines`)
- `asciiRoom.ts` — 46×18 room scene, per-stage pet anchors, slot-based `OBJECT_CATALOG`
- `asciiFrames.ts` — per-stage × per-mood frames + `SKILL_DECORATIONS`
- `RoomScene.tsx` — React component, memoizes scene + cycles frames via `setInterval`
- `CompanionAvatar.tsx` — wraps `<RoomScene />`, owns XP-flash, mood glow, transcended-stage aura

## Conventions & gotchas

- **TypeScript strict** (`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`). Build fails on unused imports. Use `import type` for type-only imports.
- **No path aliases** — use relative imports.
- **All API calls go through `apiFetch`** (`frontend/src/lib/api.ts`). URLs are relative (`/api/...`) proxied by Vite to `localhost:8000`. Do not hardcode `http://localhost:8000`.
- **VITE env vars**: `VITE_CLERK_PUBLISHABLE_KEY` (auth), `VITE_SENTRY_DSN` (errors), `VITE_POSTHOG_KEY` (analytics). All are optional — features silently no-op when unset.
- **Backend routers** mounted under `/api` in `backend/app/main.py`: `chat, references, activity, plans, habits, profile, projects, skills, companion, stats, graph, link_game, billing, account, me`. Webhooks at `/api/webhooks/stripe` and `/api/webhooks/clerk`.
- **`references` is a PostgreSQL reserved word** — always use `"references"` (double-quoted) in raw SQL strings (e.g. Alembic `op.execute`). SQLAlchemy Core queries via the `references` Table object are safe — SQLAlchemy quotes it automatically.
- **Timezone-aware datetimes**: Neon/asyncpg columns defined as `TIMESTAMP WITHOUT TIME ZONE` reject `datetime.now(timezone.utc)`. Either use `datetime.utcnow()` or omit `created_at` from inserts and let the `server_default=func.now()` handle it.
- **asyncpg SSL**: Neon connection strings include `sslmode=require&channel_binding=require`. asyncpg doesn't accept these as URL params — they're stripped by `_asyncpg_engine_args()` in `database.py` and `ssl=True` is passed via `connect_args` instead. Both `database.py` and `alembic/env.py` must use this helper.
- **Arcade games are lazy-loaded** via `React.lazy()` in `frontend/src/components/Games/registry.ts`. Named exports are wrapped: `.then(m => ({ default: m.ComponentName }))`. `GamesMenu.tsx` wraps renders in `<Suspense>`.
- `scripts/chroma_key.py` is a standalone Pillow/numpy sprite-sheet utility — unrelated to ChromaDB.

## SaaS refactor phases

| Phase | Status | What |
|---|---|---|
| **1a** | ✅ Done | Model routing (gpt-4o-mini), history cap (10 turns), background tasks |
| **1b** | ✅ Done | SQLite→Postgres, ChromaDB→pgvector, Alembic (3 migrations) |
| **1c** | ✅ Done | Multi-tenancy: `user_id` on all tables, system user fallback |
| **1d** | ✅ Done | Clerk auth (backend JWT + frontend React SDK), `apiFetch` wrapper |
| **2** | ✅ Done | Note-app reframe: companion+chat fullscreen, slide-out drawer, onboarding flow |
| **3** | ✅ Done | Stripe billing, Pro gates, usage limits, account lifecycle (export/delete) |
| **4** | ✅ Done | Railway + Vercel deploy configs, Sentry, PostHog activation funnel |
| **5** | ✅ Done | Landing page (`landing/`): hero, features, pricing, ToS, Privacy |
| **6** | ✅ Done | PWA manifest, lazy-load arcade, 404 page |

## Out-of-scope notes

- `Newideas.md`, `implementation_plan.md`, `plan.html`, `ascii_resources.md` are working notes, not authoritative specs. Treat code as the source of truth.
