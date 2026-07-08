import { AsciiCanvas } from '../../Companion/asciiEngine'

export interface Star {
  id: number
  x: number       // col
  y: number       // row
  glyph: string
  brightness: 0 | 1 | 2 | 3
}

export interface Edge {
  from: number
  to: number
}

const DIM_GLYPHS    = ['·', '·', '⋅']
const MED_GLYPHS    = ['✦', '✧']
const BRIGHT_GLYPHS = ['❋']
const RARE_GLYPHS   = ['✺', '★']

const HOVER_GLYPH    = '◌'
const SELECTED_GLYPH = '◉'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = []
  const minDist = 3
  let id = 0
  let attempts = 0
  while (stars.length < count && attempts < count * 30) {
    attempts++
    const x = Math.floor(Math.random() * (width - 4)) + 2
    const y = Math.floor(Math.random() * (height - 2)) + 1
    if (stars.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < minDist)) continue
    const r = Math.random()
    let brightness: Star['brightness']
    let glyph: string
    if (r < 0.55)      { brightness = 0; glyph = pick(DIM_GLYPHS) }
    else if (r < 0.85) { brightness = 1; glyph = pick(MED_GLYPHS) }
    else if (r < 0.97) { brightness = 2; glyph = pick(BRIGHT_GLYPHS) }
    else               { brightness = 3; glyph = pick(RARE_GLYPHS) }
    stars.push({ id: id++, x, y, glyph, brightness })
  }
  return stars
}

export function drawScene(
  width: number,
  height: number,
  stars: Star[],
  edges: Edge[],
  selected: number | null,
  hovered: number | null
): string[] {
  const canvas = new AsciiCanvas(width, height)

  // Edges first, so star glyphs win their cells
  for (const e of edges) {
    const a = stars.find((s) => s.id === e.from)
    const b = stars.find((s) => s.id === e.to)
    if (!a || !b) continue
    drawLine(canvas, a.x, a.y, b.x, b.y)
  }

  for (const star of stars) {
    let glyph = star.glyph
    if (star.id === selected)     glyph = SELECTED_GLYPH
    else if (star.id === hovered) glyph = HOVER_GLYPH
    canvas.set(star.y, star.x, glyph)
  }

  return canvas.toLines()
}

function drawLine(canvas: AsciiCanvas, x0: number, y0: number, x1: number, y1: number) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  const stepChar =
    dx > dy * 2 ? '─'
    : dy > dx * 2 ? '│'
    : sx === sy ? '╲'
    : '╱'

  let x = x0
  let y = y0
  while (true) {
    if (!(x === x0 && y === y0) && !(x === x1 && y === y1)) {
      const cur = canvas.get(y, x)
      if (!cur || cur === ' ') canvas.set(y, x, stepChar)
    }
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx)  { err += dx; y += sy }
  }
}
