import { useEffect, useRef, useState, useCallback } from 'react'
import { SynthEngine } from './synthEngine'
import { PRESETS, type Patch, type Waveform } from './presets'
import { renderScope } from './oscilloscope'

const SCOPE_W = 64
const SCOPE_H = 8
const SCOPE_CENTER = Math.floor(SCOPE_H / 2)
const SCOPE_TARGET_MS = 33

const WAVE_LABELS: Record<Waveform, string> = {
  sawtooth: 'saw',
  square:   'sqr',
  triangle: 'tri',
  sine:     'sin',
}

const KEYBOARD_KEYS: { code: string; label: string; semitone: number; isBlack: boolean }[] = [
  { code: 'KeyA', label: 'A', semitone: 0,  isBlack: false },
  { code: 'KeyW', label: 'W', semitone: 1,  isBlack: true  },
  { code: 'KeyS', label: 'S', semitone: 2,  isBlack: false },
  { code: 'KeyE', label: 'E', semitone: 3,  isBlack: true  },
  { code: 'KeyD', label: 'D', semitone: 4,  isBlack: false },
  { code: 'KeyF', label: 'F', semitone: 5,  isBlack: false },
  { code: 'KeyT', label: 'T', semitone: 6,  isBlack: true  },
  { code: 'KeyG', label: 'G', semitone: 7,  isBlack: false },
  { code: 'KeyY', label: 'Y', semitone: 8,  isBlack: true  },
  { code: 'KeyH', label: 'H', semitone: 9,  isBlack: false },
  { code: 'KeyU', label: 'U', semitone: 10, isBlack: true  },
  { code: 'KeyJ', label: 'J', semitone: 11, isBlack: false },
  { code: 'KeyK', label: 'K', semitone: 12, isBlack: false },
  { code: 'KeyL', label: 'L', semitone: 14, isBlack: false },
]

const NOTE_MAP: Record<string, number> = Object.fromEntries(
  KEYBOARD_KEYS.map((k) => [k.code, k.semitone])
)

function noteFreq(semitone: number, octave: number): number {
  // C4 = MIDI 60, A4 = MIDI 69 = 440 Hz
  const midi = octave * 12 + 12 + semitone
  return 440 * Math.pow(2, (midi - 69) / 12)
}

type SliderKey = Exclude<keyof Patch, 'waveform'>

interface SliderParam {
  key: SliderKey
  label: string
  min: number
  max: number
  step: number
  fmt: (v: number) => string
}

const PARAMS: SliderParam[] = [
  { key: 'detune',       label: 'DTN', min: 0,     max: 50,   step: 1,     fmt: (v) => `${v}¢` },
  { key: 'filterCutoff', label: 'CUT', min: 60,    max: 8000, step: 10,    fmt: (v) => `${v}Hz` },
  { key: 'filterQ',      label: 'RES', min: 0.5,   max: 18,   step: 0.1,   fmt: (v) => v.toFixed(1) },
  { key: 'attack',       label: 'ATK', min: 0.001, max: 2,    step: 0.001, fmt: (v) => `${v.toFixed(3)}s` },
  { key: 'decay',        label: 'DEC', min: 0.01,  max: 2,    step: 0.01,  fmt: (v) => `${v.toFixed(2)}s` },
  { key: 'sustain',      label: 'SUS', min: 0,     max: 1,    step: 0.01,  fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'release',      label: 'REL', min: 0.01,  max: 3,    step: 0.01,  fmt: (v) => `${v.toFixed(2)}s` },
  { key: 'volume',       label: 'VOL', min: 0,     max: 1,    step: 0.01,  fmt: (v) => `${Math.round(v * 100)}%` },
]

const PRESET_NAMES = Object.keys(PRESETS)

interface Props {
  onClose: () => void
}

export default function Synth({ onClose }: Props) {
  const [patch, setPatch] = useState<Patch>({ ...PRESETS.LEAD })
  const [octave, setOctave] = useState(4)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [activePreset, setActivePreset] = useState('LEAD')

  const engineRef = useRef<SynthEngine | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const keysHeldRef = useRef<string[]>([])  // ordered, for last-note priority
  const mouseKeyRef = useRef<string | null>(null)
  const octaveRef = useRef(octave)
  octaveRef.current = octave
  const patchRef = useRef(patch)
  patchRef.current = patch

  const ensureEngine = useCallback((): SynthEngine => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new Ctor()
      engineRef.current = new SynthEngine(audioCtxRef.current, patchRef.current)
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return engineRef.current!
  }, [])

  // Keep engine in sync when patch state changes
  useEffect(() => {
    engineRef.current?.setPatch(patch)
  }, [patch])

  // Oscilloscope rAF loop — direct DOM writes, no React re-renders
  useEffect(() => {
    const pre = preRef.current
    if (!pre) return

    const flatLine = Array.from({ length: SCOPE_H }, (_, i) =>
      i === SCOPE_CENTER ? '·'.repeat(SCOPE_W) : ' '.repeat(SCOPE_W)
    ).join('\n')

    let raf: number
    let last = 0
    let lastColor = 0

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < SCOPE_TARGET_MS) return
      last = now

      if (now - lastColor > 150) {
        lastColor = now
        const hue = (now * 0.008) % 360
        pre.style.color = `hsl(${hue}, 55%, 65%)`
      }

      const engine = engineRef.current
      pre.textContent = engine
        ? renderScope(engine.analyser, SCOPE_W, SCOPE_H).join('\n')
        : flatLine
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Keyboard — keydown / keyup for note on/off, octave, escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.code === 'KeyZ' && !e.repeat) { e.preventDefault(); setOctave((o) => Math.max(1, o - 1)); return }
      if (e.code === 'KeyX' && !e.repeat) { e.preventDefault(); setOctave((o) => Math.min(7, o + 1)); return }

      if (e.code in NOTE_MAP && !e.repeat) {
        e.preventDefault()
        if (!keysHeldRef.current.includes(e.code)) keysHeldRef.current.push(e.code)
        ensureEngine().noteOn(noteFreq(NOTE_MAP[e.code], octaveRef.current))
        setPressedKeys(new Set(keysHeldRef.current))
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (!(e.code in NOTE_MAP)) return
      keysHeldRef.current = keysHeldRef.current.filter((k) => k !== e.code)
      setPressedKeys(new Set(keysHeldRef.current))
      if (keysHeldRef.current.length > 0) {
        const last = keysHeldRef.current[keysHeldRef.current.length - 1]
        engineRef.current?.noteOn(noteFreq(NOTE_MAP[last], octaveRef.current))
      } else {
        engineRef.current?.noteOff()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onClose, ensureEngine])

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
      audioCtxRef.current = null
    }
  }, [])

  const loadPreset = (name: string) => {
    setActivePreset(name)
    setPatch({ ...PRESETS[name] })
  }

  const updatePatch = (key: SliderKey, value: number) => {
    setActivePreset('')
    setPatch((prev) => {
      const next = { ...prev, [key]: value }
      engineRef.current?.setPatch(next)
      return next
    })
  }

  const setWaveform = (w: Waveform) => {
    setActivePreset('')
    setPatch((prev) => {
      const next = { ...prev, waveform: w }
      engineRef.current?.setPatch(next)
      return next
    })
  }

  const handleKeyMouseDown = (code: string, semitone: number) => {
    ensureEngine().noteOn(noteFreq(semitone, octave))
    mouseKeyRef.current = code
    setPressedKeys((prev) => new Set([...prev, code]))
  }

  const handleKeyMouseRelease = (code: string) => {
    if (mouseKeyRef.current !== code) return
    mouseKeyRef.current = null
    setPressedKeys((prev) => { const n = new Set(prev); n.delete(code); return n })
    const held = keysHeldRef.current
    if (held.length > 0) {
      engineRef.current?.noteOn(noteFreq(NOTE_MAP[held[held.length - 1]], octaveRef.current))
    } else {
      engineRef.current?.noteOff()
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full select-none">

      {/* Oscilloscope */}
      <div className="border border-muse-border bg-muse-surface rounded-sm p-1 overflow-hidden">
        <pre
          ref={preRef}
          className="font-mono text-[7.5px] leading-tight"
          style={{ color: 'var(--color-pixel-gold)' }}
        >
          {Array.from({ length: SCOPE_H }, (_, i) =>
            i === SCOPE_CENTER ? '·'.repeat(SCOPE_W) : ' '.repeat(SCOPE_W)
          ).join('\n')}
        </pre>
      </div>

      {/* Presets + octave */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESET_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => loadPreset(name)}
            className={`pixel-btn-ghost text-[8px] ${
              activePreset === name ? 'border-pixel-gold text-pixel-gold' : ''
            }`}
          >
            [{name.toLowerCase()}]
          </button>
        ))}
        <span className="ml-auto font-mono text-[9px] text-pixel-gold">OCT {octave}</span>
      </div>

      {/* Waveform selector */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[8px] text-muse-text-dim w-7 shrink-0">WAVE</span>
        <div className="flex gap-1">
          {(Object.keys(WAVE_LABELS) as Waveform[]).map((w) => (
            <button
              key={w}
              onClick={() => setWaveform(w)}
              className={`pixel-btn-ghost text-[8px] ${
                patch.waveform === w ? 'border-pixel-gold text-pixel-gold' : ''
              }`}
            >
              {WAVE_LABELS[w]}
            </button>
          ))}
        </div>
      </div>

      {/* ADSR + filter sliders */}
      <div className="flex flex-col gap-0.5">
        {PARAMS.map((param) => (
          <div key={param.key} className="flex items-center gap-2">
            <span className="font-mono text-[8px] text-muse-text-dim w-7 shrink-0">{param.label}</span>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={patch[param.key] as number}
              onChange={(e) => updatePatch(param.key, Number(e.target.value))}
              className="w-24 accent-pixel-gold"
            />
            <span className="font-mono text-[8px] text-pixel-gold w-16 text-right">
              {param.fmt(patch[param.key] as number)}
            </span>
          </div>
        ))}
      </div>

      {/* Visual keyboard */}
      <div className="flex gap-px pt-1 border-t border-muse-border">
        {KEYBOARD_KEYS.map((key) => {
          const isPressed = pressedKeys.has(key.code)
          return (
            <button
              key={key.code}
              onMouseDown={() => handleKeyMouseDown(key.code, key.semitone)}
              onMouseUp={() => handleKeyMouseRelease(key.code)}
              onMouseLeave={() => handleKeyMouseRelease(key.code)}
              className={`font-mono text-[6px] h-8 flex-1 border transition-all flex items-end justify-center pb-0.5 ${
                isPressed
                  ? 'border-pixel-gold text-muse-bg shadow-[0_0_6px_var(--color-pixel-gold)]'
                  : key.isBlack
                  ? 'border-muse-border text-muse-text-dim bg-muse-surface opacity-80'
                  : 'border-muse-border text-muse-text-dim'
              }`}
              style={isPressed ? { background: 'var(--color-pixel-gold)' } : undefined}
            >
              {key.label}
            </button>
          )
        })}
      </div>

      <p className="pixel-text text-[7px] text-muse-text-dim text-center opacity-60">
        A–K play notes · W/E/T/Y/U sharps · Z/X octave · ESC leave
      </p>
    </div>
  )
}
