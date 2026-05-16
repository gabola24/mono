import { useEffect, useRef, useState, useCallback } from 'react'
import { VOICES, type VoiceId } from './drumSynth'

const STEPS = 16

interface LayerDef {
  id: VoiceId
  label: string
  color: string  // CSS var
}

const LAYERS: LayerDef[] = [
  { id: 'kick',  label: 'KICK',  color: 'var(--color-pixel-pink)' },
  { id: 'snare', label: 'SNARE', color: 'var(--color-pixel-gold)' },
  { id: 'hihat', label: 'HIHAT', color: 'var(--color-pixel-mint)' },
  { id: 'crash', label: 'CRASH', color: 'var(--color-pixel-pink)' },
]

const emptyPattern = (): boolean[][] =>
  Array.from({ length: LAYERS.length }, () => Array(STEPS).fill(false))

const PRESETS: Record<string, boolean[][]> = {
  BASIC: [
    // Kick: 4-on-the-floor
    [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
    // Snare: beats 2 & 4
    [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
    // Hihat: 8ths
    [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
    // Crash: downbeat only
    [true,  false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  ],
  BREAK: [
    [true,  false, false, false, false, false, true,  false, false, false, false, false, true,  false, false, false],
    [false, false, false, false, true,  false, false, false, false, false, true,  false, true,  false, false, false],
    [true,  false, true,  true,  false, true,  true,  false, true,  false, true,  true,  false, true,  false, true ],
    [true,  false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  ],
}

interface Props {
  onClose: () => void
}

export default function BeatMaker({ onClose }: Props) {
  const [pattern, setPattern] = useState<boolean[][]>(() => PRESETS.BASIC.map((r) => [...r]))
  const [playing, setPlaying] = useState(false)
  const [bpm, setBpm] = useState(112)
  const [currentStep, setCurrentStep] = useState(-1)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const patternRef = useRef(pattern)
  patternRef.current = pattern

  const tapTimesRef = useRef<number[]>([])
  const [tapFlash, setTapFlash] = useState(false)
  const TAP_RESET_MS = 2000
  const TAP_HISTORY = 8

  const ensureAudio = useCallback((): AudioContext => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new Ctor()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  // Scheduler — simple setInterval, sufficient at typical drum BPMs
  useEffect(() => {
    if (!playing) {
      setCurrentStep(-1)
      return
    }
    const stepMs = 60000 / bpm / 4
    let step = 0

    const tick = () => {
      const ctx = audioCtxRef.current
      if (ctx) {
        const t = ctx.currentTime
        LAYERS.forEach((layer, i) => {
          if (patternRef.current[i][step]) VOICES[layer.id](ctx, t)
        })
      }
      setCurrentStep(step)
      step = (step + 1) % STEPS
    }

    tick()  // immediate first hit
    const id = window.setInterval(tick, stepMs)
    return () => window.clearInterval(id)
  }, [playing, bpm])

  const handleTap = useCallback(() => {
    const now = performance.now()
    const taps = tapTimesRef.current
    if (taps.length && now - taps[taps.length - 1] > TAP_RESET_MS) {
      tapTimesRef.current = [now]
    } else {
      taps.push(now)
      if (taps.length > TAP_HISTORY) taps.shift()
      if (taps.length >= 2) {
        const intervals: number[] = []
        for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1])
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
        const next = Math.round(60000 / avg)
        if (next >= 60 && next <= 200) setBpm(next)
      }
    }
    setTapFlash(true)
    window.setTimeout(() => setTapFlash(false), 80)
  }, [])

  // Keyboard: Esc / Space / T
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose()
      else if (e.code === 'Space') {
        e.preventDefault()
        if (!playing) ensureAudio()
        setPlaying((p) => !p)
      } else if (e.code === 'KeyT' && !e.repeat) {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, playing, ensureAudio, handleTap])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {})
      audioCtxRef.current = null
    }
  }, [])

  const togglePlay = () => {
    if (!playing) ensureAudio()
    setPlaying((p) => !p)
  }

  const toggleCell = (layerIdx: number, stepIdx: number) => {
    setPattern((prev) => {
      const next = prev.map((row) => [...row])
      next[layerIdx][stepIdx] = !next[layerIdx][stepIdx]
      // Audition the sound when activating
      if (next[layerIdx][stepIdx]) {
        const ctx = ensureAudio()
        VOICES[LAYERS[layerIdx].id](ctx, ctx.currentTime)
      }
      return next
    })
  }

  const clearAll = () => setPattern(emptyPattern())
  const loadPreset = (name: keyof typeof PRESETS) =>
    setPattern(PRESETS[name].map((r) => [...r]))

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Step grid */}
      <div className="flex flex-col gap-1">
        {/* Step number row */}
        <div className="flex items-center gap-px pl-[52px]">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`w-5 text-center font-mono text-[7px] leading-tight ${
                i === currentStep
                  ? 'text-pixel-gold pixel-glow-gold'
                  : 'text-muse-text-dim opacity-50'
              } ${i > 0 && i % 4 === 0 ? 'ml-1' : ''}`}
            >
              {i % 4 === 0 ? (i / 4 + 1).toString() : '·'}
            </div>
          ))}
        </div>

        {/* Layer rows */}
        {LAYERS.map((layer, layerIdx) => (
          <div key={layer.id} className="flex items-center gap-px">
            <span
              className="w-[48px] pr-1 font-mono text-[9px] tracking-wide text-right shrink-0"
              style={{ color: layer.color }}
            >
              {layer.label}
            </span>
            {Array.from({ length: STEPS }).map((_, stepIdx) => {
              const active = pattern[layerIdx][stepIdx]
              const isCurrent = stepIdx === currentStep
              const accent = stepIdx % 4 === 0
              return (
                <button
                  key={stepIdx}
                  onClick={() => toggleCell(layerIdx, stepIdx)}
                  aria-label={`${layer.label} step ${stepIdx + 1}`}
                  className={`w-5 h-5 border transition-all ${
                    stepIdx > 0 && stepIdx % 4 === 0 ? 'ml-1' : ''
                  } ${
                    isCurrent && playing ? 'scale-110 shadow-[0_0_6px_var(--color-pixel-gold)]' : ''
                  }`}
                  style={{
                    background: active ? layer.color : 'transparent',
                    borderColor: active
                      ? layer.color
                      : accent
                        ? 'var(--color-muse-border)'
                        : 'var(--color-muse-border)',
                    opacity: active ? 1 : accent ? 0.7 : 0.35,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-muse-border">
        <button
          onClick={togglePlay}
          className={`pixel-btn text-[10px] px-3 ${
            playing ? 'border-pixel-pink text-pixel-pink' : 'border-pixel-gold text-pixel-gold'
          }`}
        >
          {playing ? '■ STOP' : '▶ PLAY'}
        </button>

        <div className="flex items-center gap-2">
          <span className="pixel-text text-[9px] text-muse-text-dim">BPM</span>
          <input
            type="range"
            min={60}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-24 accent-pixel-gold"
          />
          <span className="font-mono text-[10px] text-pixel-gold w-8">{bpm}</span>
        </div>

        <button
          onClick={handleTap}
          className={`pixel-btn-ghost text-[9px] transition-all ${
            tapFlash
              ? 'border-pixel-pink text-pixel-pink scale-110 shadow-[0_0_6px_var(--color-pixel-pink)]'
              : ''
          }`}
          title="Tap a steady rhythm to set the BPM (or press T)"
        >
          ◉ TAP
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => loadPreset('BASIC')} className="pixel-btn-ghost text-[8px]">
            [basic]
          </button>
          <button onClick={() => loadPreset('BREAK')} className="pixel-btn-ghost text-[8px]">
            [break]
          </button>
          <button onClick={clearAll} className="pixel-btn-ghost text-[8px]">
            [clear]
          </button>
        </div>
      </div>

      <p className="pixel-text text-[7px] text-muse-text-dim text-center opacity-60">
        click cells · SPACE play/stop · T tap tempo · ESC leave
      </p>
    </div>
  )
}
