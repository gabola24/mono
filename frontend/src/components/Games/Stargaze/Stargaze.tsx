import { useEffect, useRef, useState, useCallback } from 'react'
import { generateStars, drawScene, type Star, type Edge } from './starfield'
import { generateName } from './names'

const WIDTH = 64
const HEIGHT = 18
const STAR_COUNT = 20
const CLICK_RADIUS = 2.5

interface Drawn {
  id: number
  name: string
  edgeCount: number
}

interface Props {
  onClose: () => void
}

export default function Stargaze({ onClose }: Props) {
  const [stars, setStars] = useState<Star[]>(() => generateStars(WIDTH, HEIGHT, STAR_COUNT))
  const [edges, setEdges] = useState<Edge[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [drawn, setDrawn] = useState<Drawn[]>([])

  const preRef = useRef<HTMLPreElement>(null)
  const drawnIdRef = useRef(0)
  const starsRef = useRef(stars)
  starsRef.current = stars
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  const findStarAt = useCallback((col: number, row: number): Star | null => {
    let best: Star | null = null
    let bestDist = CLICK_RADIUS
    for (const s of starsRef.current) {
      // Use weighted Manhattan: rows visually taller in monospace
      const d = Math.abs(s.x - col) + Math.abs(s.y - row) * 1.5
      if (d < bestDist) { bestDist = d; best = s }
    }
    return best
  }, [])

  const coordsFromEvent = useCallback((e: React.MouseEvent): { col: number; row: number } | null => {
    const pre = preRef.current
    if (!pre) return null
    const rect = pre.getBoundingClientRect()
    const charW = rect.width / WIDTH
    const charH = rect.height / HEIGHT
    if (charW <= 0 || charH <= 0) return null
    const col = (e.clientX - rect.left) / charW
    const row = (e.clientY - rect.top) / charH
    return { col, row }
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    const c = coordsFromEvent(e)
    if (!c) return
    const star = findStarAt(c.col, c.row)
    if (!star) {
      setSelected(null)
      return
    }
    if (selected === null) {
      setSelected(star.id)
      return
    }
    if (selected === star.id) {
      setSelected(null)
      return
    }
    const exists = edgesRef.current.some(
      (ed) =>
        (ed.from === selected && ed.to === star.id) ||
        (ed.from === star.id && ed.to === selected)
    )
    if (!exists) setEdges((prev) => [...prev, { from: selected, to: star.id }])
    setSelected(star.id)  // chain from new star
  }

  const handleMove = (e: React.MouseEvent) => {
    const c = coordsFromEvent(e)
    if (!c) { setHovered(null); return }
    const star = findStarAt(c.col, c.row)
    setHovered(star?.id ?? null)
  }

  const nameIt = useCallback(() => {
    if (edgesRef.current.length === 0) return
    const ids = new Set<number>()
    edgesRef.current.forEach((e) => { ids.add(e.from); ids.add(e.to) })
    const name = generateName(ids.size)
    setDrawn((prev) => [...prev, { id: drawnIdRef.current++, name, edgeCount: edgesRef.current.length }])
    setEdges([])
    setSelected(null)
  }, [])

  const newSky = useCallback(() => {
    setStars(generateStars(WIDTH, HEIGHT, STAR_COUNT))
    setEdges([])
    setSelected(null)
    setHovered(null)
  }, [])

  const clearLines = useCallback(() => {
    setEdges([])
    setSelected(null)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { onClose(); return }
      if (e.code === 'KeyN' && !e.repeat) { e.preventDefault(); nameIt() }
      else if (e.code === 'KeyR' && !e.repeat) { e.preventDefault(); newSky() }
      else if (e.code === 'KeyC' && !e.repeat) { e.preventDefault(); clearLines() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, nameIt, newSky, clearLines])

  const lines = drawScene(WIDTH, HEIGHT, stars, edges, selected, hovered)

  return (
    <div className="flex flex-col gap-2 w-full select-none">

      {/* Starfield */}
      <div className="border border-muse-border bg-muse-surface rounded-sm p-1 overflow-hidden">
        <pre
          ref={preRef}
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
          className="font-mono text-[11px] leading-tight cursor-crosshair"
          style={{ color: 'var(--color-pixel-gold)' }}
        >
          {lines.join('\n')}
        </pre>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={nameIt}
          disabled={edges.length === 0}
          className={`pixel-btn text-[10px] px-3 ${
            edges.length === 0
              ? 'border-muse-border text-muse-text-dim opacity-40 cursor-not-allowed'
              : 'border-pixel-gold text-pixel-gold'
          }`}
        >
          ◇ NAME IT
        </button>
        <button onClick={clearLines} className="pixel-btn-ghost text-[8px]">
          [clear]
        </button>
        <button onClick={newSky} className="pixel-btn-ghost text-[8px]">
          [new sky]
        </button>
        <span className="ml-auto font-mono text-[8px] text-muse-text-dim">
          {edges.length === 0
            ? selected !== null
              ? 'pick a second star…'
              : 'click two stars to begin'
            : `${edges.length} line${edges.length === 1 ? '' : 's'} drawn`}
        </span>
      </div>

      {/* Charted constellations */}
      {drawn.length > 0 && (
        <div className="border-t border-muse-border pt-2 mt-1">
          <p className="pixel-text text-[8px] text-muse-text-dim mb-1 tracking-wider">CHARTED</p>
          <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto pr-1">
            {drawn.slice().reverse().map((d) => (
              <div key={d.id} className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-pixel-pink">{d.name}</span>
                <span className="font-mono text-[7px] text-muse-text-dim opacity-60">
                  · {d.edgeCount} line{d.edgeCount === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="pixel-text text-[7px] text-muse-text-dim text-center opacity-60">
        click stars · N name it · C clear · R new sky · ESC leave
      </p>
    </div>
  )
}
