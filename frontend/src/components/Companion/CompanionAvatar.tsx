import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompanionStore } from '../../stores/companionStore'
import { useSkillTreeStore } from '../../stores/skillTreeStore'
import { traitsFromDNA, type MonoTrait } from './pixelSprites'
import RoomScene from './RoomScene'

/** Ambient glow color depending on current mood */
const MOOD_GLOW: Record<string, string> = {
  idle:        'var(--color-muse-accent-glow)',
  thinking:    'var(--color-crt-glow)',
  speaking:    'var(--color-muse-accent-glow)',
  celebrating: 'var(--color-muse-accent-glow)',
  eating:      'var(--color-crt-glow)',
}

export default function CompanionAvatar() {
  const { mood, stage, xp, level } = useCompanionStore()
  const topSkills = useSkillTreeStore((s) => s.topSkills)

  // XP gain/loss flash
  const prevXpRef = React.useRef(xp)
  const [xpFlash, setXpFlash] = React.useState<{ amount: number; key: number } | null>(null)
  React.useEffect(() => {
    const diff = xp - prevXpRef.current
    if (diff !== 0) {
      setXpFlash({ amount: diff, key: Date.now() })
      const t = setTimeout(() => setXpFlash(null), 1400)
      prevXpRef.current = xp
      return () => clearTimeout(t)
    }
    prevXpRef.current = xp
  }, [xp])

  const traits: MonoTrait[] = traitsFromDNA(topSkills.map((s) => s.name), [])
  const xpInLevel  = xp % 100
  const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1)
  const glowColor  = MOOD_GLOW[mood] ?? MOOD_GLOW.idle
  const isActive   = mood !== 'idle'
  const showAura   = stage === 'transcended'

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Scene wrapper */}
      <div className="relative">
        {/* XP flash */}
        {xpFlash && (
          <div
            key={xpFlash.key}
            className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none animate-xp-rise z-30 whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '8px',
              color: xpFlash.amount > 0 ? 'var(--color-pixel-gold)' : '#f87171',
            }}
          >
            {xpFlash.amount > 0 ? `+${xpFlash.amount} XP` : `${xpFlash.amount} XP`}
          </div>
        )}

        {/* Ambient glow */}
        <motion.div
          className="absolute -inset-6 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)` }}
          animate={{ opacity: isActive ? 0.9 : 0.4, scale: isActive ? 1.05 : 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Transcended aura ring */}
        {showAura && (
          <div
            className="absolute -inset-3 rounded-full pointer-events-none animate-pixel-pulse"
            style={{ border: '1px solid var(--color-muse-accent)', opacity: 0.5 }}
          />
        )}

        {/* ASCII scene panel */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'var(--color-muse-surface)',
            border: '2px solid var(--color-muse-border)',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.08), inset 1px 1px 0 rgba(255,255,255,0.06)',
            padding: '10px 12px',
            borderRadius: '12px',
          }}
        >
          {/* Scanline dither */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)',
            }}
          />

          {/* ASCII room scene — handles its own animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${stage}-${mood}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative z-10"
            >
              <RoomScene />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mood label */}
        <AnimatePresence>
          {mood !== 'idle' && (
            <motion.div
              className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '7px',
                color: 'var(--color-muse-accent)',
              }}
            >
              {mood === 'thinking'    && '· · ·'}
              {mood === 'speaking'    && '!'}
              {mood === 'celebrating' && '✦ ✦ ✦'}
              {mood === 'eating'      && 'nom'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status & XP bar */}
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <p
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '7px',
            color: 'var(--color-muse-text-dim)',
            letterSpacing: '0.1em',
          }}
        >
          {stageLabel} · Lv.{level}
        </p>

        <div
          className="relative"
          style={{ width: '160px', height: '6px', background: 'var(--color-muse-bg)', border: '1px solid var(--color-muse-border)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'var(--color-muse-accent)', width: `${xpInLevel}%` }}
            animate={{ width: `${xpInLevel}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {traits.length > 0 && (
          <div className="flex gap-1 mt-1">
            {traits.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: t.color,
                  border: `1px solid ${t.color}40`,
                  background: `${t.color}12`,
                }}
              >
                {t.symbol} {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
