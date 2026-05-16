import { useEffect, useRef, useState } from 'react'
import {
  renderKaleido,
  DEFAULT_CONFIG,
  CHAR_SET_LABELS,
  type KaleidoConfig,
  type PatternType,
} from './kaleidoscope'

const CANVAS_W = 60
const CANVAS_H = 28
const TARGET_MS = 1000 / 30

const SYMMETRY_OPTIONS = [3, 4, 5, 6, 8, 12] as const
const PATTERN_OPTIONS: PatternType[] = ['waves', 'spiral', 'bloom', 'rings']

interface Props {
  onClose: () => void
}

export default function KaleidoView({ onClose }: Props) {
  const preRef = useRef<HTMLPreElement>(null)
  const tRef = useRef(0)
  const lastFrameRef = useRef(0)
  const playingRef = useRef(true)
  const [playing, setPlaying] = useState(true)
  const [config, setConfig] = useState<KaleidoConfig>(DEFAULT_CONFIG)
  const configRef = useRef(config)
  configRef.current = config

  // Animation loop — writes directly to DOM, no React re-renders per frame
  useEffect(() => {
    let raf = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!playingRef.current) return
      if (now - lastFrameRef.current < TARGET_MS) return
      lastFrameRef.current = now
      tRef.current += 0.04

      const t = tRef.current
      const cfg = configRef.current
      const lines = renderKaleido(CANVAS_W, CANVAS_H, t, cfg)

      if (preRef.current) {
        preRef.current.textContent = lines.join('\n')
        if (cfg.colorCycle) {
          // Slow 20-second hue cycle — pure CSS, no layout reflow
          preRef.current.style.color = `hsl(${(t * 8) % 360}, 65%, 62%)`
        } else {
          preRef.current.style.color = 'var(--color-pixel-gold)'
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { onClose(); return }
      if (e.code === 'Space') {
        e.preventDefault()
        playingRef.current = !playingRef.current
        setPlaying(playingRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof KaleidoConfig>(key: K, val: KaleidoConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }))

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Canvas */}
      <div className="relative w-full border border-muse-border overflow-hidden bg-muse-bg">
        <pre
          ref={preRef}
          className="font-mono leading-tight select-none w-full px-0.5 py-0.5"
          style={{ fontSize: '8px', lineHeight: '1.2', color: 'var(--color-pixel-gold)' }}
          aria-hidden
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-muse-bg/70 pointer-events-none">
            <span className="pixel-text text-[10px] text-pixel-gold pixel-glow-gold animate-pulse">
              PAUSED — SPACE to resume
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full space-y-2 text-[8px]">
        {/* Row 1: symmetry + play/pause */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pixel-text text-muse-text-dim w-16 shrink-0">SYM</span>
          <div className="flex gap-1 flex-wrap">
            {SYMMETRY_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => set('symmetry', n)}
                className={`font-mono px-1.5 py-0.5 border transition-colors ${
                  config.symmetry === n
                    ? 'border-pixel-gold text-pixel-gold bg-pixel-gold/10'
                    : 'border-muse-border text-muse-text-dim hover:border-pixel-gold hover:text-pixel-gold'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <button
              onClick={() => { playingRef.current = !playingRef.current; setPlaying(playingRef.current) }}
              className="pixel-btn-ghost text-[8px]"
            >
              {playing ? '[■ PAUSE]' : '[▶ PLAY]'}
            </button>
          </div>
        </div>

        {/* Row 2: pattern */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pixel-text text-muse-text-dim w-16 shrink-0">PATTERN</span>
          <div className="flex gap-1 flex-wrap">
            {PATTERN_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => set('pattern', p)}
                className={`font-mono px-1.5 py-0.5 border uppercase transition-colors ${
                  config.pattern === p
                    ? 'border-pixel-pink text-pixel-pink bg-pixel-pink/10'
                    : 'border-muse-border text-muse-text-dim hover:border-pixel-pink hover:text-pixel-pink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: char set + color toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pixel-text text-muse-text-dim w-16 shrink-0">CHARS</span>
          <div className="flex gap-1 flex-wrap">
            {CHAR_SET_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => set('charSetIdx', i)}
                className={`font-mono px-1.5 py-0.5 border transition-colors ${
                  config.charSetIdx === i
                    ? 'border-pixel-gold text-pixel-gold bg-pixel-gold/10'
                    : 'border-muse-border text-muse-text-dim hover:border-pixel-gold hover:text-pixel-gold'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => set('colorCycle', !config.colorCycle)}
            className={`ml-auto font-mono px-1.5 py-0.5 border transition-colors ${
              config.colorCycle
                ? 'border-pixel-gold text-pixel-gold bg-pixel-gold/10'
                : 'border-muse-border text-muse-text-dim'
            }`}
          >
            ∿ COLOR
          </button>
        </div>
      </div>

      <p className="pixel-text text-[7px] text-muse-text-dim text-center opacity-60">
        SPACE pause · ESC leave
      </p>
    </div>
  )
}
