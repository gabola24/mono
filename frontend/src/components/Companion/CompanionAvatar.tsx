import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompanionStore } from '../../stores/companionStore'
import type { CompanionStage } from '../../stores/companionStore'
import { useSkillTreeStore } from '../../stores/skillTreeStore'
import {
  traitsFromDNA,
  type MonoTrait,
} from './pixelSprites'

/**
 * Sprite configuration per evolution stage.
 * To add a new stage:
 * 1. Process the spritesheet: python scripts/chroma_key.py <sheet> frontend/public --prefix <name> --size 128x128
 * 2. Add an entry here with the prefix, frame count, and animation speed.
 * 3. That's it — the component adapts automatically.
 */
interface StageSpriteConfig {
  /** Filename prefix for frame PNGs, e.g. "egg" → /egg_frame_0.png */
  prefix: string
  /** Number of animation frames available */
  frameCount: number
  /** Milliseconds between frame changes */
  frameInterval: number
  /** Display size in pixels for the sprite container */
  displaySize: number
  /** Scale of the sprite relative to the container (e.g. 0.5 for 50%) */
  spriteScale: number
  /** Alt text for accessibility */
  alt: string
}

const STAGE_SPRITE_CONFIG: Record<CompanionStage, StageSpriteConfig> = {
  egg: {
    prefix: 'egg',
    frameCount: 4,
    frameInterval: 250,
    displaySize: 200,
    spriteScale: 0.7,
    alt: 'Egg companion',
  },
  hatchling: {
    prefix: 'hatchling',
    frameCount: 8,
    frameInterval: 200,
    displaySize: 200,
    spriteScale: 0.55,
    alt: 'Hatchling companion',
  },
  adolescent: {
    prefix: 'hatchling',   // TODO: replace when adolescent sprites are ready
    frameCount: 8,
    frameInterval: 180,
    displaySize: 200,
    spriteScale: 0.6,
    alt: 'Adolescent companion',
  },
  evolved: {
    prefix: 'hatchling',   // TODO: replace when evolved sprites are ready
    frameCount: 8,
    frameInterval: 160,
    displaySize: 200,
    spriteScale: 0.7,
    alt: 'Evolved companion',
  },
  transcended: {
    prefix: 'hatchling',   // TODO: replace when transcended sprites are ready
    frameCount: 8,
    frameInterval: 140,
    displaySize: 200,
    spriteScale: 0.8,
    alt: 'Transcended companion',
  },
}

/** Ambient glow color depending on current mood */
const MOOD_GLOW: Record<string, string> = {
  idle: '#ff9ebd28',
  thinking: '#93b9ff28',
  speaking: '#d6a1f028',
  celebrating: '#fce68f45',
  eating: '#bcf2dd28',
}

export default function CompanionAvatar() {
  const { mood, stage, xp, level } = useCompanionStore()
  const topSkills = useSkillTreeStore((s) => s.topSkills)

  const spriteConfig = STAGE_SPRITE_CONFIG[stage] ?? STAGE_SPRITE_CONFIG.egg

  const [frame, setFrame] = React.useState(0)
  React.useEffect(() => {
    setFrame(0) // Reset frame on stage change
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % spriteConfig.frameCount)
    }, spriteConfig.frameInterval)
    return () => clearInterval(timer)
  }, [stage, spriteConfig.frameCount, spriteConfig.frameInterval])

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

  // Derive traits from top skills
  const skillNames = topSkills.map((s) => s.name)
  const dnaThemes = skillNames
  const traits: MonoTrait[] = traitsFromDNA(dnaThemes, [])

  const xpInLevel = xp % 100
  const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1)
  const glowColor = MOOD_GLOW[mood] ?? MOOD_GLOW.idle
  const isActive = mood !== 'idle'

  // Stage enhancement: crown for evolved+
  const showCrown = stage === 'evolved' || stage === 'transcended'
  const showAura = stage === 'transcended'

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Companion sprite display */}
      <div className="relative">
        {/* XP flash indicator */}
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
        {/* Ambient pixel glow */}
        <motion.div
          className="absolute -inset-6 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)` }}
          animate={{ opacity: isActive ? 0.9 : 0.4, scale: isActive ? 1.08 : 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Aura ring for transcended */}
        {showAura && (
          <div
            className="absolute -inset-3 rounded-full pointer-events-none animate-pixel-pulse"
            style={{ border: '2px solid var(--color-pixel-gold)', opacity: 0.4 }}
          />
        )}

        {/* Pixel panel container */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'var(--color-muse-surface)',
            border: '2px solid var(--color-muse-border)',
            boxShadow: `4px 4px 0 rgba(0,0,0,0.15), inset 1px 1px 0 rgba(255,255,255,0.04)`,
            padding: '8px',
            borderRadius: '16px',
          }}
        >
          {/* Pixel dither overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='rgba(255,107,157,0.02)'/%3E%3Crect x='2' y='2' width='2' height='2' fill='rgba(255,107,157,0.02)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Crown for evolved stage */}
          {showCrown && (
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 text-[14px] animate-pixel-float">
              👑
            </div>
          )}

          {/* Sprite image replacing SVG string */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${stage}-${mood}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center justify-center"
              style={{
                marginTop: showCrown ? '16px' : '0',
                filter: `drop-shadow(0 0 6px ${glowColor.replace('28', '60')})`,
              }}
            >
              <div
                className="relative overflow-hidden rounded-xl shadow-inner"
                style={{
                  width: `${spriteConfig.displaySize}px`,
                  height: `${spriteConfig.displaySize}px`,
                  backgroundImage: 'url(/egg_background_1777308785982.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  imageRendering: 'pixelated'
                }}
              >
                <img
                  src={`/${spriteConfig.prefix}_frame_${frame}.png`}
                  alt={spriteConfig.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center bottom',
                    imageRendering: 'pixelated',
                    transform: `scale(${spriteConfig.spriteScale})`,
                    transformOrigin: 'center',
                  }}
                  draggable={false}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mood label — shown when not idle */}
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
                color: 'var(--color-pixel-pink)',
              }}
            >
              {mood === 'thinking' && '...'}
              {mood === 'speaking' && '!'}
              {mood === 'celebrating' && '✦ yay! ✦'}
              {mood === 'eating' && 'nom nom'}
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

        {/* Pixel XP bar */}
        <div className="w-36 pixel-bar-track relative" style={{ height: '8px', background: 'var(--color-muse-bg)', border: '2px solid var(--color-muse-border)' }}>
          <motion.div
            className="h-full"
            style={{ background: 'var(--color-pixel-pink)', width: `${xpInLevel}%` }}
            animate={{ width: `${xpInLevel}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Trait badges */}
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
