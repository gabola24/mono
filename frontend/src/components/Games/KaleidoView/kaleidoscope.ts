/**
 * ASCII Kaleidoscope — original polar-fold renderer.
 *
 * Algorithm per cell:
 *   1. Centre + aspect-correct → (dx, dy)
 *   2. Polar coords: r = distance, θ = angle + time-rotation
 *   3. Fold θ into the first wedge (2π / N), mirror every other segment
 *   4. Sample a mathematical pattern at (r, foldedθ)
 *   5. Map float → character index
 */

export type PatternType = 'waves' | 'spiral' | 'bloom' | 'rings'

export interface KaleidoConfig {
  symmetry: number        // segments: 3 4 5 6 8 12
  pattern: PatternType
  charSetIdx: number      // index into CHAR_SETS
  colorCycle: boolean     // hue-rotate the pre text
  speed: number           // rotation speed multiplier
}

export const DEFAULT_CONFIG: KaleidoConfig = {
  symmetry: 6,
  pattern: 'waves',
  charSetIdx: 0,
  colorCycle: true,
  speed: 1,
}

// Ordered from sparse → dense for direct value→index mapping
export const CHAR_SETS: readonly string[] = [
  ' .,:;+=*%#@',   // Classic ASCII density gradient
  ' ░▒▓█',          // Unicode blocks
  ' .+*X#',          // Stars / crosses
  ' .:',             // Minimal (high contrast)
]

export const CHAR_SET_LABELS = ['CLASSIC', 'BLOCK', 'STARS', 'MINIMAL']

const TAU = Math.PI * 2

// Monospace aspect ratio compensation (line-height / char-width).
// JetBrains Mono at leading ~1.25: ≈ 9px line-height / 5.4px char = 1.67
// But visual height feel in the browser lands closer to 2.0-2.1.
const ASPECT = 2.0

function samplePattern(
  r: number,
  foldedTheta: number,
  wedgeAngle: number,
  t: number,
  pattern: PatternType,
): number {
  switch (pattern) {
    case 'waves':
      return (Math.sin(r * 0.55 - t * 2 + foldedTheta * 4) + 1) / 2

    case 'spiral':
      return (Math.sin(r * 0.4 - t * 2.5 + foldedTheta * 7) + 1) / 2

    case 'bloom': {
      // Petals that follow the fold — bulge at the centre of each wedge
      const petal = Math.sin((foldedTheta / wedgeAngle) * Math.PI)
      return (Math.sin(r * 0.6 - t * 1.8 + petal * 4) + 1) / 2
    }

    case 'rings':
      // Two independent ring frequencies beat against each other
      return (
        Math.sin(r * 0.75 - t * 1.5) *
        Math.sin(r * 0.22 + t * 0.55 + foldedTheta * 2) +
        1
      ) / 2
  }
}

export function renderKaleido(
  width: number,
  height: number,
  t: number,
  config: KaleidoConfig,
): string[] {
  const { symmetry, pattern, charSetIdx, speed } = config
  const chars = CHAR_SETS[charSetIdx]
  const lastIdx = chars.length - 1
  const cx = width / 2
  const cy = height / 2
  const wedgeAngle = TAU / symmetry
  const lines: string[] = []

  for (let row = 0; row < height; row++) {
    let line = ''
    const dy = ((row - cy) / cy) * ASPECT
    for (let col = 0; col < width; col++) {
      const dx = (col - cx) / cx

      const r = Math.sqrt(dx * dx + dy * dy) * 10
      // Rotate the whole field over time
      let theta = Math.atan2(dy, dx) + t * speed * 0.6

      // Clamp to [0, TAU)
      theta = ((theta % TAU) + TAU) % TAU

      // Fold into first wedge with mirror on alternating segments
      const segIdx = Math.floor(theta / wedgeAngle)
      let foldedTheta = theta - segIdx * wedgeAngle
      if (segIdx % 2 === 1) foldedTheta = wedgeAngle - foldedTheta

      const val = samplePattern(r, foldedTheta, wedgeAngle, t, pattern)
      const idx = Math.round(val * lastIdx)
      line += chars[Math.max(0, Math.min(lastIdx, idx))]
    }
    lines.push(line)
  }

  return lines
}
