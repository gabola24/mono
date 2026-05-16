import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GAMES, type GameDef } from './registry'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAfterPlay?: () => void
}

export default function GamesMenu({ isOpen, onClose, onAfterPlay }: Props) {
  const [active, setActive] = useState<GameDef | null>(null)

  // Reset to menu when closed
  useEffect(() => {
    if (!isOpen) setActive(null)
  }, [isOpen])

  // Esc: if in a game, go back to menu; otherwise close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (active) setActive(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, active, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-muse-bg/80 backdrop-blur-md" onClick={() => { if (!active) onClose() }} />

      <motion.div
        className="pixel-panel relative w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-muse-border">
          <div className="flex items-center gap-3">
            {active && (
              <button
                onClick={() => setActive(null)}
                className="pixel-btn-ghost text-[10px] mr-1"
              >
                ← back
              </button>
            )}
            <h2 className="pixel-text text-[12px] tracking-wider text-pixel-gold pixel-glow-gold">
              {active ? active.name : 'ARCADE'}
            </h2>
          </div>
          <button onClick={onClose} className="pixel-btn-ghost text-[10px]">
            [CLOSE]
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="menu"
              className="p-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <p className="pixel-text text-[9px] text-muse-text-dim mb-6 text-center">
                Choose your mode.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setActive(game)}
                    className="pixel-panel p-4 text-left hover:border-pixel-gold transition-colors group"
                  >
                    <pre className="font-mono text-[10px] text-pixel-gold leading-tight mb-3 group-hover:text-pixel-pink transition-colors">
                      {game.glyph.join('\n')}
                    </pre>
                    <p className="pixel-text text-[9px] text-muse-text mb-1">{game.name}</p>
                    <p className="font-mono text-[8px] text-muse-text-dim leading-snug">
                      {game.tagline}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={active.id}
              className="p-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <active.Component
                onClose={() => setActive(null)}
                onAfterPlay={onAfterPlay}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
