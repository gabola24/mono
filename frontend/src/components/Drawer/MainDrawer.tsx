import { motion, AnimatePresence } from 'framer-motion'
import TrustMeter from '../Gamification/TrustMeter'
import { isPro, type SubscriptionTier } from '../../stores/billingStore'

interface MainDrawerProps {
  isOpen: boolean
  onClose: () => void
  onOpenFeed: () => void
  onOpenGraph: () => void
  onOpenGames: () => void
  onOpenWorkspace: () => void
  onOpenGarage: () => void
  onOpenStats: () => void
  onOpenSettings: () => void
  trustLevel: number
  totalRefs: number
  tier: SubscriptionTier | null
  onUpsell: () => void
  isDevMode?: boolean
  onOpenTest?: () => void
}

interface DrawerItemProps {
  label: string
  sublabel?: string
  onClick: () => void
  accent?: string
  locked?: boolean
}

function DrawerItem({ label, sublabel, onClick, accent, locked }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-b border-muse-border hover:bg-muse-surface-light transition-colors group flex items-center justify-between"
    >
      <span>
        <span
          className="pixel-text text-[10px] tracking-widest block"
          style={{ color: locked ? 'var(--color-muse-text-dim)' : (accent ?? 'var(--color-muse-text)') }}
        >
          {label}
        </span>
        {sublabel && (
          <span className="pixel-text text-[8px] text-muse-text-dim block mt-0.5 group-hover:text-muse-text transition-colors">
            {sublabel}
          </span>
        )}
      </span>
      {locked && (
        <span className="pixel-text text-[9px] text-muse-text-dim ml-2 shrink-0">PRO</span>
      )}
    </button>
  )
}

export default function MainDrawer({
  isOpen,
  onClose,
  onOpenFeed,
  onOpenGraph,
  onOpenGames,
  onOpenWorkspace,
  onOpenGarage,
  onOpenStats,
  onOpenSettings,
  trustLevel,
  totalRefs,
  tier,
  onUpsell,
  isDevMode,
  onOpenTest,
}: MainDrawerProps) {
  const pro = isPro(tier)

  const handleItem = (fn: () => void, locked = false) => {
    if (locked) {
      onClose()
      onUpsell()
    } else {
      fn()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            key="drawer"
            className="fixed top-0 left-0 h-full z-50 flex flex-col bg-muse-surface border-r border-muse-border"
            style={{ width: 'min(280px, 80vw)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-muse-border">
              <div className="flex items-center gap-2">
                <span
                  className="pixel-text text-[10px] tracking-widest"
                  style={{ color: 'var(--color-pixel-pink)', textShadow: '0 0 8px var(--color-muse-accent-glow)' }}
                >
                  ZUKURI
                </span>
                {tier && (
                  <span
                    className="pixel-text text-[7px] px-1.5 py-0.5 border"
                    style={
                      pro
                        ? { color: 'var(--color-pixel-gold)', borderColor: 'var(--color-pixel-gold)' }
                        : { color: 'var(--color-muse-text-dim)', borderColor: 'var(--color-muse-border)' }
                    }
                  >
                    {pro ? 'PRO' : 'FREE'}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="pixel-btn-ghost text-[10px]">✕</button>
            </div>

            {/* Trust meter */}
            <div className="shrink-0 px-4 py-3 border-b border-muse-border">
              <TrustMeter level={trustLevel} totalRefs={totalRefs} />
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto">
              <DrawerItem
                label="REFERENCES"
                sublabel="feed your companion"
                onClick={() => handleItem(onOpenFeed, !pro)}
                locked={!pro}
              />
              <DrawerItem
                label="MIND GRAPH"
                sublabel={pro ? 'visualize your thoughts' : 'first 10 nodes'}
                onClick={() => handleItem(onOpenGraph)}
                accent="var(--color-pixel-blue)"
              />
              <DrawerItem
                label="ARCADE"
                sublabel="play to grow"
                onClick={() => handleItem(onOpenGames, !pro)}
                locked={!pro}
                accent={pro ? 'var(--color-pixel-gold)' : undefined}
              />
              <DrawerItem
                label="WORKSPACE"
                sublabel="plans &amp; habits"
                onClick={() => handleItem(onOpenWorkspace, !pro)}
                locked={!pro}
              />
              <DrawerItem
                label="GARAGE"
                sublabel="your projects"
                onClick={() => handleItem(onOpenGarage, !pro)}
                locked={!pro}
              />
              <DrawerItem
                label="STATS"
                sublabel="energy, focus, creative"
                onClick={() => handleItem(onOpenStats)}
              />
              <DrawerItem
                label="SETTINGS"
                sublabel="subscription &amp; account"
                onClick={() => handleItem(onOpenSettings)}
              />
              {isDevMode && onOpenTest && (
                <DrawerItem
                  label="DEV PANEL"
                  sublabel="test utilities"
                  onClick={() => handleItem(onOpenTest)}
                  accent="var(--color-pixel-gold)"
                />
              )}
            </div>

            {!pro && (
              <div className="shrink-0 p-3 border-t border-muse-border">
                <button
                  onClick={() => { onUpsell(); onClose() }}
                  className="pixel-btn w-full text-[9px]"
                  style={{
                    background: 'var(--color-pixel-pink)',
                    color: '#080808',
                    borderColor: 'var(--color-pixel-pink)',
                  }}
                >
                  UPGRADE TO PRO — $5/MO
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
