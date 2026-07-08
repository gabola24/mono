import { useState, useEffect } from 'react'
import { useAuth, SignInButton, UserButton } from '@clerk/clerk-react'
import PipWindow from './components/Companion/PipWindow'
import ChatInterface from './components/Chat/ChatInterface'
import FeedPanel from './components/References/FeedPanel'
import WorkspacePanel from './components/Workspace/WorkspacePanel'
import GaragePanel from './components/Garage/GaragePanel'
import MindGraph from './components/Graph/MindGraph'
import GamesMenu from './components/Games/GamesMenu'
import BadgeToast from './components/SkillTree/BadgeToast'
import StatsPanel from './components/Stats/StatsPanel'
import type { DailyStat } from './components/Stats/StatsPanel'
import MainDrawer from './components/Drawer/MainDrawer'
import OnboardingFlow from './components/Companion/OnboardingFlow'
import StreakCounter from './components/Gamification/StreakCounter'
import UpsellModal from './components/UpsellModal'
import SettingsPanel from './components/Settings/SettingsPanel'
import { useReferences } from './hooks/useReferences'
import { useSkillTree } from './hooks/useSkillTree'
import { useMindGraph } from './hooks/useMindGraph'
import { useCompanionStore } from './stores/companionStore'
import { useBillingStore } from './stores/billingStore'
import TestPanel from './components/TestPanel'
import { registerTokenGetter, register402Handler, apiFetch } from './lib/api'
import { track } from './lib/analytics'
import NotFound from './components/NotFound'

const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
const IS_DEV = new URLSearchParams(window.location.search).has('dev')
const KNOWN_PATHS = new Set(['/', '/sso-callback', '/sign-in', '/sign-up'])

// ─── Main app content ────────────────────────────────────────────────────────

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [testPanelOpen, setTestPanelOpen] = useState(false)
  const [feedOpen, setFeedOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [garageOpen, setGarageOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [statsPanelOpen, setStatsPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dailyStatsHistory, setDailyStatsHistory] = useState<DailyStat[]>([])
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  const { stats } = useReferences()
  const { pendingBadge, dismissBadge } = useSkillTree()
  const { nodes: mindNodes, edges: mindEdges, truncated, totalCount, fetchGraph } = useMindGraph()
  const { setMood, checkDailyDecay, name: companionName } = useCompanionStore()
  const { tier, loadTier, openUpsell } = useBillingStore()

  // Check onboarded status
  useEffect(() => {
    // Fast local fallback
    if (localStorage.getItem('zukuri_onboarded') === 'true') {
      setOnboarded(true)
      return
    }
    apiFetch('/api/me')
      .then(r => r.json())
      .then((data: { onboarded: boolean }) => setOnboarded(data.onboarded))
      .catch(() => setOnboarded(true)) // fail open
  }, [])

  useEffect(() => {
    apiFetch('/api/stats/history')
      .then(res => res.json())
      .then((data: { stats?: DailyStat[] }) => {
        if (data?.stats) setDailyStatsHistory(data.stats)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    checkDailyDecay()
  }, [checkDailyDecay])

  useEffect(() => {
    register402Handler(openUpsell)
    loadTier()
  }, [openUpsell, loadTier])

  // Detect post-Stripe-checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('upgraded')) {
      track('upgraded')
      loadTier()
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loadTier])

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

  const handleOnboardingComplete = () => setOnboarded(true)

  const openGraph = () => {
    fetchGraph()
    setGraphOpen(true)
    track('graph_viewed')
  }

  // Loading state while we check onboarded
  if (onboarded === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-muse-bg">
        <span className="pixel-text text-[10px] text-muse-text-dim animate-pulse">
          initializing...
        </span>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-muse-bg overflow-hidden">
      {/* Onboarding overlay */}
      {!onboarded && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* Minimal header */}
      <header className="shrink-0 border-b border-muse-border px-3 py-2" style={{ background: 'var(--color-muse-surface)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="pixel-btn-ghost text-[14px] leading-none"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span
            className="pixel-text text-[10px] tracking-widest"
            style={{
              color: 'var(--color-pixel-pink)',
              textShadow: '0 0 8px var(--color-muse-accent-glow)',
            }}
          >
            {companionName.toUpperCase()}
          </span>
          <StreakCounter />
          <div className="flex-1" />
          {CLERK_ENABLED && <UserButton />}
        </div>
      </header>

      {/* Companion — fixed height */}
      <div className="shrink-0 border-b border-muse-border" style={{ height: '38vh' }}>
        <PipWindow dailyStat={dailyStatsHistory[0]} />
      </div>

      {/* Chat — fills remaining space */}
      <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full">
        <ChatInterface onAfterMessage={fetchGraph} />
      </div>

      {/* Drawer */}
      <MainDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenFeed={() => setFeedOpen(true)}
        onOpenGraph={openGraph}
        onOpenGames={() => setGamesOpen(true)}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
        onOpenGarage={() => setGarageOpen(true)}
        onOpenStats={() => setStatsPanelOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        trustLevel={stats.trust_level}
        totalRefs={stats.total_count}
        tier={tier}
        onUpsell={openUpsell}
        isDevMode={IS_DEV}
        onOpenTest={() => setTestPanelOpen(true)}
      />

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
        truncated={truncated}
        totalCount={totalCount}
      />
      <BadgeToast badge={pendingBadge} onDismiss={dismissBadge} />
      <TestPanel isOpen={testPanelOpen} onClose={() => setTestPanelOpen(false)} />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UpsellModal />
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
        <div className="p-8 bg-muse-surface border-2 border-muse-border rounded flex flex-col items-center gap-4 shadow-2xl scale-125">
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
  if (!KNOWN_PATHS.has(window.location.pathname)) {
    return <NotFound />
  }
  if (CLERK_ENABLED) {
    return <ClerkWrapper />
  }
  return <AppContent />
}
