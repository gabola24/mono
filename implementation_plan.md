# 🐵 ZUKURI — Your Pixel Companion for Making Things

## The Name & Concept

**Zukuri** — from *Monozukuri* (物作り), the Japanese philosophy of "making things" with care, craftsmanship, and soul. It's the art of creation as a way of life.

**Mono** — your pixel monkey companion. "Mono" means monkey in Spanish, and is the first half of *Monozukuri*. Your monkey companion is a maker, a thinker, a builder — just like you.

> The wordplay: **Mono** (the monkey) + **Zukuri** (the making) = *Monozukuri* = the craft of creation.
> Your monkey grows as YOU grow. You make things. You are a maker. You are Monozukuri.

---

## Decisions Locked In

| Decision | Choice | Rationale |
|---|---|---|
| **Platform** | Web app first (PWA), mobile later | Fastest to ship, zero app-store friction |
| **Companion feature** | Floating PiP window (Document Picture-in-Picture API) | Mono stays visible while you work |
| **Target audience** | Creative autodidacts + indie hackers | Makers, learners, builders who live online |
| **Solo founder** | Yes | Scope adjusted accordingly |
| **Aesthetic** | 2000s pixel art (GBA-era) with ASCII art accents | Colorful, nostalgic, warm — not cold terminal |
| **Mini-game** | 1 included in MVP | Details below |
| **Name** | **Zukuri** | App name. Companion = "Mono" |

---

## The Vision

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   Zukuri is a daily companion for creative people        ║
║   who build things, learn constantly, and want a         ║
║   playful way to track their growth.                     ║
║                                                          ║
║   It's NOT a productivity tool.                          ║
║   It's NOT a note-taking app.                            ║
║   It's NOT a habit tracker.                              ║
║                                                          ║
║   It's a tiny digital world that mirrors your            ║
║   creative life. A pixel monkey that grows with you.     ║
║   A mind graph that shows how your ideas connect.        ║
║   A character sheet for your actual human stats.         ║
║                                                          ║
║   Think: Tamagotchi × Obsidian × character sheet         ║
║   Aesthetic: GBA × early web × cozy pixel art            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Core Features (MVP)

### 1. 🐵 Mono — The Pixel Monkey Companion

Your monkey companion lives in a small pixel-art scene. It reacts to your activity and evolves over time.

**Mono's States (MVP — 5 states):**

```
   HAPPY           THINKING         SLEEPY          EXCITED         HUNGRY
                                                   (new idea)      (no input)
  ╭──────╮       ╭──────╮        ╭──────╮        ╭──────╮        ╭──────╮
  │ ●  ● │       │ ●  ● │        │ -  - │        │ ★  ★ │        │ ●  ● │
  │  ▽▽  │       │  ..  │        │  ~~  │        │  ▽▽  │        │  △△  │
  │ /  \ │       │ /  \ │        │ /  \ │        │ \  / │        │ /  \ │
  ╰──────╯       ╰──────╯        ╰──────╯        ╰──────╯        ╰──────╯
    idle         processing       dormant          eureka!        needs you
```

**Mono's Evolution (Post-MVP roadmap):**
- Stage 1: Baby Mono (simple, 16x16 sprite)
- Stage 2: Young Mono (32x32, more detail, accessories based on your habits)
- Stage 3: Adult Mono (48x48, unique traits based on your graph's personality)

**Mono's Personality emerges from YOUR data:**
- Heavy music theory nodes → Mono gets headphones
- Lots of design nodes → Mono gets a tiny pixel pencil
- Consistent daily check-ins → Mono builds a small camp/room around itself

---

### 2. 🧠 Mind Graph — Lightweight Idea Web

NOT a PKM tool. Not Obsidian. Not Logseq. This is intentionally simple.

**What you do:**
- Drop a thought/idea as a node (max 280 chars — Twitter-length constraint forces clarity)
- Tag it with a color/category (project, idea, learning, question)
- Optionally connect it to existing nodes
- That's it.

**What the graph shows you:**
- A visual constellation of your thinking over time
- Clusters form naturally around topics
- Orphan nodes get highlighted ("ideas you haven't connected yet")
- Simple stats: "You've added 12 ideas this week. 'Music' and 'Design' are your hottest clusters."

**Visual style:**

```
   ┌─────────────────────────────────────────────────┐
   │                                                 │
   │          [design]──────[typography]              │
   │           /    \           │                     │
   │    [color]    [layout]    [grids]                │
   │                \          /                      │
   │              [responsive]                        │
   │                                                  │
   │     [music theory]──[harmony]                    │
   │           │              \                       │
   │      [chords]         [scales]                   │
   │                                                  │
   │     ◇ [loneliness of code]  ← orphan node       │
   │                                                  │
   └─────────────────────────────────────────────────┘
   
   Nodes are pixel-art bubbles with 2000s-style 
   color gradients. Connections are dashed pixel lines.
   The graph gently pulses and breathes.
```

**Why this works (learned from research):**
- The "Collector's Fallacy" is the #1 killer of PKM tools — people hoard notes they never revisit
- By limiting to 280 chars and making the visual graph the PRIMARY interface (not a sidebar), you force synthesis over collection
- The graph is beautiful enough to share → organic growth

---

### 3. 📊 Life Stats — Your Character Sheet

Track your daily state as RPG-style attributes. Pixel-art progress bars, stat cards, and a weekly radar chart.

**MVP Stats (4 core attributes):**

```
╔═══════════════════════════════════════╗
║  Z U K U R I  ─  Stats v1.0          ║
║───────────────────────────────────────║
║                                       ║
║  ⚡ ENERGY    ████████░░░░  67%       ║
║  🧠 FOCUS     ██████░░░░░░  50%       ║
║  💛 MOOD      ██████████░░  83%       ║
║  🔥 CREATIVE  ████░░░░░░░░  33%       ║
║                                       ║
║  ┌──── Weekly Radar ────┐             ║
║  │    ENERGY             │             ║
║  │      ╱╲               │             ║
║  │ FOC╱    ╲MOOD         │             ║
║  │    ╲    ╱             │             ║
║  │      ╲╱               │             ║
║  │    CREATIVE           │             ║
║  └───────────────────────┘             ║
║                                       ║
║  Streak: 🔥 7 days                    ║
╚═══════════════════════════════════════╝
```

**How stats feed Mono:**
- High energy + high creative → Mono dances
- Low mood → Mono sits quietly near you (not punitive, supportive)
- All stats high → Mono's environment upgrades (flowers bloom, stars appear)

---

### 4. 🎮 Mini-Game: "LINK" — The Idea Association Game

This is the mini-game for MVP. It's brilliant because it **feeds the knowledge graph** while being fun.

**How LINK works:**

```
╔═══════════════════════════════════════╗
║      L I N K   ─  Round 3/5          ║
║───────────────────────────────────────║
║                                       ║
║   Connect these two concepts:         ║
║                                       ║
║   ┌──────────┐     ┌──────────┐      ║
║   │ FRACTALS │ ━━? │  JAZZ    │      ║
║   └──────────┘     └──────────┘      ║
║                                       ║
║   Your link: [improvisation________]  ║
║                                       ║
║   ⏱ 15 seconds remaining             ║
║                                       ║
║   Mono: 🐵 "Ooh, interesting..."     ║
║                                       ║
╚═══════════════════════════════════════╝
```

**Game mechanics:**
- System picks 2 concepts (from your graph nodes + a curated bank of concepts)
- You type 1 word/phrase that connects them
- 15-second timer → forces gut instinct over overthinking
- 5 rounds per session (~90 seconds total)
- Your linking words become NEW NODES in your graph, connected to both concepts
- Mono reacts to each answer (surprised, amused, confused, impressed)

**Why this is the perfect mini-game:**
1. **Feeds the graph** — every game session generates 5 new connected nodes for free
2. **Trains creative thinking** — lateral association is the core skill of creative autodidacts
3. **Takes 90 seconds** — zero friction, playable in any break
4. **Reveals personality** — your linking words show how YOUR mind works (shareable!)
5. **Gets better over time** — as your graph grows, the system has more concepts to pair
6. **Procedurally generated** — concepts from YOUR graph means infinite replayability, zero content treadmill

**Shareability:** After 5 rounds, generate a "LINK Card" showing your most creative connections. This is extremely shareable content.

---

### 5. 🪟 Picture-in-Picture Mode — "Mono on Your Desk"

Using the **Document Picture-in-Picture API** (Chrome/Edge/Brave, ~80% desktop browser coverage):

```
┌─── Your browser (any tab) ───────────────────────┐
│                                                   │
│   You're working on your project, writing code,   │
│   reading articles, watching tutorials...         │
│                                                   │
│                           ┌─────────────────────┐ │
│                           │  ╭──────╮           │ │
│                           │  │ ●  ● │  Mono     │ │
│                           │  │  ▽▽  │  is here  │ │
│                           │  ╰──────╯           │ │
│                           │  ⚡67% 🧠50%        │ │
│                           │  [check in] [link]  │ │
│                           └─────────────────────┘ │
│                            ↑ Floating PiP window  │
│                              Always on top         │
└───────────────────────────────────────────────────┘
```

**PiP window contents:**
- Mono's current state (animated pixel sprite)
- Quick stat summary
- "Check in" button (opens full app)
- "Play LINK" button (play a quick round right in the PiP window)
- Mono occasionally wiggles, yawns, or reacts — adds life to your workspace

**Fallback for unsupported browsers (Firefox/Safari):**
- A draggable, resizable mini-widget pinned to the corner of the Zukuri page
- Still useful, just not floating over other tabs

> [!NOTE]
> The Document PiP API is supported in Chrome 116+, Edge, Brave, Vivaldi, Opera. This covers ~80% of desktop users. For the remaining 20%, we gracefully degrade to an in-page widget.

---

## The Aesthetic — 2000s Pixel Art Revival

### Color Palette

Not cold terminal green. Not generic dark mode. **Warm, nostalgic, GBA-era with modern refinement.**

```
Primary Palette:
┌─────────────────────────────────────────┐
│                                         │
│  ██ #1A1B2E  Deep Indigo (background)   │
│  ██ #2D2B55  Purple Night (panels)      │
│  ██ #FF6B9D  Pixel Pink (accents)       │
│  ██ #C792EA  Soft Lavender (secondary)  │
│  ██ #82AAFF  Bright Blue (links/nodes)  │
│  ██ #F7DC6F  Warm Gold (highlights)     │
│  ██ #A8E6CF  Mint Green (success/good)  │
│  ██ #FF8A5C  Warm Orange (energy)       │
│  ██ #FAFAFA  Soft White (text)          │
│                                         │
│  Mono's palette:                        │
│  ██ #8B6914  Warm Brown (fur base)      │
│  ██ #D4A03C  Golden Brown (fur light)   │
│  ██ #5C3D0E  Dark Brown (fur shadow)    │
│  ██ #FFD6C0  Beige (face/belly)         │
│                                         │
└─────────────────────────────────────────┘
```

### Typography
- **Headings:** Pixel-art bitmap font (like "Press Start 2P" from Google Fonts, or a custom one)
- **Body text:** A clean monospace with personality (like "JetBrains Mono" or "IBM Plex Mono")
- **Stats/numbers:** Pixel font, always

### Visual Elements
- Pixel-art UI borders and panels (not flat CSS boxes)
- Subtle CRT scanline overlay (OPTIONAL toggle, not forced)
- Dithering patterns for gradients
- Sprite-based animations (not CSS transitions — actual frame-by-frame pixel animation)
- Sound effects: 8-bit chirps and bloops (with mute option)

### Vibe References
Think the intersection of:
- **Game Boy Advance** color warmth and sprite work
- **Early 2000s web** (chunky UI, fun borders, personality)
- **Neopets / Tamagotchi Connection** (pet care + customization)
- **Stardew Valley** pixel art quality level
- **lo-fi hip hop stream aesthetics** (cozy, warm, lived-in)

---

## Technical Architecture

### Stack

| Layer | Technology | Why |
|---|---|---|
| **Build tool** | Vite | Fast, modern, zero-config |
| **Framework** | Vanilla JS + Web Components (or Lit) | Lightweight, no React overhead, pixel-art rendering is custom |
| **Rendering** | HTML5 Canvas (for Mono + graph) + DOM (for UI) | Canvas for pixel-perfect sprite rendering; DOM for forms/text |
| **Styling** | Vanilla CSS + custom pixel-art CSS framework | Full control over retro aesthetic |
| **Data** | IndexedDB via idb library | Local-first, zero server cost, works offline |
| **Graph layout** | Custom force-directed (lightweight) or d3-force | Pixel-aesthetic graph visualization |
| **PiP** | Document Picture-in-Picture API | Floating companion window |
| **Hosting** | Vercel (free tier) or Netlify | Static site, $0/month |
| **PWA** | Service Worker + manifest.json | Installable, works offline |
| **Fonts** | "Press Start 2P" + "JetBrains Mono" (Google Fonts) | Pixel heading + clean body |

### Data Model (IndexedDB)

```javascript
// Core entities stored locally
{
  companion: {
    name: "Mono",
    stage: 1,          // evolution stage
    mood: "happy",     // current state
    traits: [],        // earned visual traits
    xp: 0,             // total experience
    daysActive: 0
  },
  
  nodes: [{
    id: "uuid",
    text: "fractals are everywhere",  // max 280 chars
    category: "idea",                  // idea | project | learning | question
    color: "#82AAFF",
    createdAt: "2026-04-10",
    connections: ["uuid-2", "uuid-5"],  // linked node IDs
    source: "manual" | "link-game"      // how was it created
  }],
  
  stats: [{
    date: "2026-04-10",
    energy: 67,
    focus: 50,
    mood: 83,
    creative: 33
  }],
  
  linkGames: [{
    date: "2026-04-10",
    rounds: [
      { concept1: "fractals", concept2: "jazz", link: "improvisation" }
    ],
    score: 4  // out of 5
  }]
}
```

### File Structure

```
zukuri/
├── index.html              # Single page app
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── vite.config.js
├── package.json
│
├── src/
│   ├── main.js             # App entry point
│   ├── app.js              # Core app orchestration
│   │
│   ├── styles/
│   │   ├── index.css       # Global styles, pixel-art system
│   │   ├── theme.css       # Color tokens, typography
│   │   ├── components.css  # Reusable component styles
│   │   └── animations.css  # Scan lines, pixel transitions
│   │
│   ├── components/
│   │   ├── companion/
│   │   │   ├── Mono.js         # Companion logic + rendering
│   │   │   ├── sprites.js      # Sprite sheet data
│   │   │   └── evolution.js    # Evolution/state rules
│   │   │
│   │   ├── graph/
│   │   │   ├── MindGraph.js    # Graph visualization (Canvas)
│   │   │   ├── NodeEditor.js   # Add/edit nodes
│   │   │   └── layout.js      # Force-directed layout
│   │   │
│   │   ├── stats/
│   │   │   ├── StatsPanel.js   # Character sheet view
│   │   │   ├── CheckIn.js      # Daily check-in form
│   │   │   └── RadarChart.js   # Weekly radar visualization
│   │   │
│   │   ├── game/
│   │   │   ├── LinkGame.js     # LINK mini-game
│   │   │   └── concepts.js     # Curated concept bank
│   │   │
│   │   ├── pip/
│   │   │   └── PipWindow.js    # Picture-in-Picture controller
│   │   │
│   │   └── ui/
│   │       ├── PixelPanel.js   # Reusable pixel-art panel
│   │       ├── PixelBar.js     # Stat progress bar
│   │       ├── Navigation.js   # Main nav
│   │       └── ShareCard.js    # Export shareable cards
│   │
│   ├── data/
│   │   ├── db.js           # IndexedDB wrapper
│   │   └── store.js        # Reactive state management
│   │
│   └── utils/
│       ├── pixelFont.js    # Pixel font rendering helpers
│       └── export.js       # Image export for share cards
│
├── assets/
│   ├── sprites/            # Mono sprite sheets (PNG)
│   ├── sounds/             # 8-bit sound effects
│   └── fonts/              # Custom pixel fonts if needed
│
└── public/
    ├── favicon.ico
    └── og-image.png        # Social preview image
```

---

## MVP Build Plan — Solo Developer, 5-6 Weeks

### Week 1: Foundation + Companion
- [x] Set up Vite project, CSS design system, pixel-art theme
- [ ] Build the retro UI shell (panels, navigation, pixel borders)
- [ ] Create Mono's sprite system (Canvas-based, 5 animation states)
- [ ] Implement basic companion logic (idle, happy, sleepy, thinking, excited)
- [ ] Main screen: Mono in their pixel world

### Week 2: Stats + Check-in
- [ ] Build the daily check-in flow (4 stats: energy, focus, mood, creative)
- [ ] Pixel progress bars and stat display
- [ ] Weekly radar chart (simple Canvas)
- [ ] IndexedDB storage for stats history
- [ ] Mono reacts to check-in values

### Week 3: Mind Graph
- [ ] Node creation form (280 char limit, category selection)
- [ ] Graph data model (nodes + connections in IndexedDB)
- [ ] Force-directed graph visualization on Canvas
- [ ] Pixel-art styled nodes and connections
- [ ] Basic interactions: click node to view, drag to rearrange
- [ ] Graph stats: "You have X nodes, Y connections, top clusters: ..."

### Week 4: LINK Game + PiP
- [ ] LINK game mechanics (concept pairing, 15-sec timer, 5 rounds)
- [ ] Curated concept bank (~200 starter concepts)
- [ ] Game results feed into graph (new nodes + connections)
- [ ] Mono reactions during gameplay
- [ ] Document PiP implementation (Mono floating widget)
- [ ] PiP fallback for unsupported browsers

### Week 5: Polish + Share + Ship
- [ ] Shareable character card (export as PNG)
- [ ] Shareable LINK results card
- [ ] Sound effects (8-bit, togglable)
- [ ] CRT scanline toggle
- [ ] PWA setup (manifest, service worker, offline)
- [ ] Landing page with retro aesthetic
- [ ] Deploy to Vercel
- [ ] Bug fixing and UX polish

### Week 6 (Buffer): Launch Prep
- [ ] Open Graph meta tags (social previews)
- [ ] README / about page
- [ ] Post on Indie Hackers, Product Hunt, Twitter/X
- [ ] Build in public: first dev-log thread
- [ ] Gather initial feedback from 10-20 users

---

## Monetization Strategy (Post-MVP)

| Tier | Price | Features |
|---|---|---|
| **Free** | $0 | Mono (1 evolution path), graph (up to 50 nodes), 4 stats, LINK game (3 sessions/day), PiP mode |
| **Zukuri Pro** | $5/mo or $39/yr | Unlimited graph, 8+ stats, all evolution paths, unlimited LINK, export hi-res share cards, custom themes (amber, green, blue, pink CRT), graph insights ("your most connected ideas"), sound pack options |
| **Supporter** | $9/mo or $69/yr | Everything in Pro + beta features, API access (for devs who want to integrate), custom Mono skins, your name in the credits |

---

## Growth Strategy (Organic-First)

### Phase 1: Launch (Weeks 6-8)
1. **Build in public** on X/Twitter — the retro pixel aesthetic + monkey companion is EXTREMELY tweetable
2. **Product Hunt launch** — retro/pixel products consistently perform well
3. **Indie Hackers post** — detailed "how I built this" story

### Phase 2: Viral Mechanics (Months 2-3)
1. **Share Cards** — pixel-art stat cards and LINK results designed to look amazing on social media
2. **Knowledge Constellations** — beautiful graph exports that look like star maps
3. **ASCII Mono exports** — for GitHub profiles, Discord, terminal enthusiasts
4. **"What's your Mono like?"** — companion personality becomes a conversation starter

### Phase 3: Community (Months 3-6)
1. **Discord community** — share ideas, custom themes, feature requests
2. **Weekly "LINK Challenge"** — community plays with the same concept pairs, shares results
3. **User-submitted concept packs** for LINK game (philosophy, music, design, etc.)

---

## Success Metrics

| Metric | Target (Month 1) | Target (Month 3) |
|---|---|---|
| Waitlist signups (pre-launch) | 200+ | — |
| Monthly Active Users | 500 | 2,000 |
| D7 Retention | 30% | 40% |
| Check-in completion rate | 60% of daily visits | 70% |
| Graph nodes per user (avg) | 15 | 40 |
| LINK games per user/week | 3 | 5 |
| Pro conversion | — | 3-5% |
| MRR | — | $300-500 |

---

## Risk Mitigation (Updated)

| Risk | Plan |
|---|---|
| "Cute but not useful" | The LINK game generates real creative value. The graph surfaces insights. Stats track real data. |
| Companion novelty fades | Evolution system gives long-term goals. Personality traits emerge from YOUR data — always personal. |
| Solo dev burnout | MVP is ruthlessly scoped. 5-6 weeks. Ship, then iterate. Don't perfectionism-trap. |
| PiP API limited support | Graceful fallback to in-page widget. PiP is a delighter, not a dependency. |
| Content treadmill (LINK) | User's own graph nodes ARE the content. Curated bank is a starter, not the engine. |

---

> [!IMPORTANT]
> ## Ready to Build?
> This plan is scoped for a solo developer building a web app (Vite + Vanilla JS + Canvas) with local-first data. The MVP is 5-6 weeks of focused work. All technical decisions prioritize: low cost, high personality, and zero backend dependencies.
>
> **Approve this plan to begin building.** I'll start with Week 1: the design system, retro UI shell, and Mono's first pixels.
