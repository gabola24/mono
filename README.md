# Project Muse

A tamagotchi-like creative companion with an ASCII art soul and a guru's wit.
Feeds on your references, learns your taste, and helps you structure chaos into action.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Architecture

```
backend/                 Python + FastAPI
  app/
    api/
      chat.py            SSE streaming chat
      references.py      Upload text/image references
      plans.py           Structured plan generation
      habits.py          Habit tracking
      activity.py        Streak tracking
      profile.py         Creative DNA analysis
    services/
      personality.py     Guru prompt system
      conversation.py    OpenAI + RAG integration
      embeddings.py      Text + image embeddings
      rag_pipeline.py    Reference retrieval
      structured_output.py  Plan generation + DNA analysis
      streak.py          Streak computation
    db/
      database.py        SQLite + SQLAlchemy async
      vectorstore.py     ChromaDB for reference embeddings

frontend/                React + Vite + TypeScript
  src/
    components/
      Companion/         ASCII art tamagotchi with CRT effects
      Chat/              Streaming chat interface
      Gamification/      Trust meter, streak counter
      References/        Feed panel (upload references)
      Workspace/         Plans, habits, Creative DNA profile
    stores/              Zustand state management
    hooks/               Custom hooks for API interaction
```

## Features

- **ASCII companion** that evolves through 5 stages as you interact
- **Guru personality** — Socratic, absurdist, sharp, never verbose
- **RAG-powered chat** grounded in your uploaded references
- **Structured plans** generated from your ideas
- **Habit tracking** with streak rewards
- **Creative DNA profile** analyzed from your references and conversations
- **CRT vintage aesthetic** — amber phosphor glow, scanlines, monospace
