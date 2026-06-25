import { useState, useEffect } from 'react'
import { useAuth, SignInButton, UserButton } from '@clerk/clerk-react'
import PipWindow from './components/Companion/PipWindow'
import ChatInterface from './components/Chat/ChatInterface'
import TrustMeter from './components/Gamification/TrustMeter'
import StreakCounter from './components/Gamification/StreakCounter'
import FeedPanel from './components/References/FeedPanel'
import WorkspacePanel from './components/Workspace/WorkspacePanel'
import GaragePanel from './components/Garage/GaragePanel'
import AsciiMiniTree from './components/SkillTree/AsciiMiniTree'
import MindGraph from './components/Graph/MindGraph'
import GamesMenu from './components/Games/GamesMenu'
import BadgeToast from './components/SkillTree/BadgeToast'
import StatsPanel from './components/Stats/StatsPanel'
import type { DailyStat } from './components/Stats/StatsPanel'
import { useReferences } from './hooks/useReferences'
import { useSkillTree } from './hooks/useSkillTree'
import { useMindGraph } from './hooks/useMindGraph'
import { useCompanionStore } from './stores/companionStore'
import TestPanel from './components/TestPanel'
import { registerTokenGetter, apiFetch } from './lib/api'

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

// ─── Main app content ────────────────────────────────────────────────────────

function AppContent() {
  const [testPanelOpen, setTestPanelOpen] = useState(false)
  const [feedOpen, setFeedOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [garageOpen, setGarageOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const { stats } = useReferences()
  const { edges, topSkills, pendingBadge, dismissBadge } = useSkillTree()
  const { nodes: mindNodes, edges: mindEdges, fetchGraph } = useMindGraph()

  const [statsPanelOpen, setStatsPanelOpen] = useState(false)
  const [dailyStatsHistory, setDailyStatsHistory] = useState<DailyStat[]>([])

  useEffect(() => {
    apiFetch('/api/stats/history')
      .then(res => res.json())
      .then((data: { stats?: DailyStat[] }) => {
        if (data?.stats) setDailyStatsHistory(data.stats)
      })
      .catch(console.error)
  }, [])

  const { setMood, checkDailyDecay } = useCompanionStore()

  useEffect(() => {
    checkDailyDecay()
  }, [checkDailyDecay])

  const handleCheckIn = async (stat: Record<string, number>) => {
    try {
      const res = await apiFetch('/api/stats/checkin', {
        method: 'POST',
        body: JSON.stringify(stat),
      })
      const newStat = await res.json() as DailyStat & { date: string }
      setDailyStatsHistory(prev => {
        const filtered = prev.filter(s => s.date !== newStat.date)
        return [newStat, ...filtered]
      })

      if (stat.energy >= 80 && stat.mood >= 80) {
        setMood('celebrating')
        setTimeout(() => setMood('idle'), 5000)
      } else if (stat.energy < 40 || stat.mood < 40) {
        setMood('thinking')
      } else {
        setMood('idle')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-muse-bg">
      {/* Header */}
      <header className="shrink-0 border-b border-muse-border px-4 py-3" style={{ background: 'var(--color-muse-surface)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setGarageOpen(true)} className="pixel-btn-ghost">
              garage
            </button>
            <button onClick={() => setWorkspaceOpen(true)} className="pixel-btn-ghost">
              ws
            </button>
            <button onClick={() => setStatsPanelOpen(true)} className="pixel-btn-ghost">
              stats
            </button>
            <button onClick={() => setTestPanelOpen(true)} className="pixel-btn-ghost text-pixel-gold">
              🧪 test
            </button>
            <h1
              className="pixel-text"
              style={{
                fontSize: '10px',
                color: 'var(--color-pixel-pink)',
                textShadow: '0 0 8px var(--color-muse-accent-glow), 0 0 20px rgba(255,107,157,0.3)',
                letterSpacing: '0.15em',
              }}
            >
              ZUKURI
            </h1>
            <StreakCounter />
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <div className="flex-1">
              <TrustMeter
                level={stats.trust_level}
                totalRefs={stats.total_count}
              />
            </div>
            <button onClick={() => setFeedOpen(true)} className="pixel-btn">
              + feed
            </button>
            <button onClick={() => setGamesOpen(true)} className="pixel-btn text-pixel-gold border-pixel-gold ml-2">
              ARCADE
            </button>
            {CLERK_ENABLED && <UserButton />}
          </div>
        </div>
      </header>

      {/* Companion */}
      <div className="shrink-0 border-b border-muse-border">
        <div className="max-w-2xl mx-auto">
          <PipWindow dailyStat={dailyStatsHistory[0]} />
        </div>
      </div>

      {/* Mind Map preview bar */}
      <div className="shrink-0 border-b border-muse-border">
        <div className="max-w-2xl mx-auto">
          <AsciiMiniTree
            topSkills={topSkills}
            edges={edges}
            onClick={() => {
              fetchGraph()
              setGraphOpen(true)
            }}
          />
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full">
        <ChatInterface onAfterMessage={fetchGraph} />
      </div>

      {/* Panels */}
      <FeedPanel isOpen={feedOpen} onClose={() => setFeedOpen(false)} />
      <WorkspacePanel isOpen={workspaceOpen} onClose={() => setWorkspaceOpen(false)} />
      <GaragePanel isOpen={garageOpen} onClose={() => setGarageOpen(false)} />
      <StatsPanel
        isOpen={statsPanelOpen}
        onClose={() => setStatsPanelOpen(false)}
        history={dailyStatsHistory}
        onCheckIn={handleCheckIn}
      />

      <GamesMenu
        isOpen={gamesOpen}
        onClose={() => setGamesOpen(false)}
        onAfterPlay={fetchGraph}
      />

      <MindGraph
        isOpen={graphOpen}
        onClose={() => setGraphOpen(false)}
        nodes={mindNodes}
        edges={mindEdges}
      />

      <BadgeToast badge={pendingBadge} onDismiss={dismissBadge} />

      <TestPanel isOpen={testPanelOpen} onClose={() => setTestPanelOpen(false)} />
    </div>
  )
}

// ─── Clerk auth wrapper (only rendered when CLERK_ENABLED) ───────────────────

function ClerkWrapper() {
  const { isSignedIn, getToken } = useAuth()

  useEffect(() => {
    registerTokenGetter(getToken)
  }, [getToken])

  if (!isSignedIn) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-muse-bg">
        <div
          className="p-8 bg-muse-surface border-2 border-muse-border rounded flex flex-col items-center gap-4 shadow-2xl scale-125"
        >
          <div
            className="pixel-text text-xl text-pixel-pink mb-4"
            style={{ textShadow: '0 0 8px var(--color-muse-accent-glow)' }}
          >
            INITIALIZE SESSION
          </div>
          <SignInButton mode="modal">
            <button className="pixel-btn w-64">LOG IN</button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return <AppContent />
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function App() {
  if (CLERK_ENABLED) {
    return <ClerkWrapper />
  }
  return <AppContent />
}
