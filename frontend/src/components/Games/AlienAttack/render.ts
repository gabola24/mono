import { AsciiCanvas } from '../../Companion/asciiEngine'
import { ALIEN, SHIP, BULLET_PLAYER, BULLET_ALIEN, EXPLOSION } from './sprites'
import {
  type GameState,
  CANVAS_W,
  CANVAS_H,
  GROUND_ROW,
  SHIP_ROW,
} from './engine'

export function renderToLines(state: GameState): string[] {
  const canvas = new AsciiCanvas(CANVAS_W, CANVAS_H)

  // Sparse starfield — fixed seed based on wave so it doesn't flicker
  for (let i = 0; i < 20; i++) {
    const r = (i * 7 + state.wave * 3) % (GROUND_ROW - 1)
    const c = (i * 13 + state.wave * 5) % CANVAS_W
    if (canvas.get(r, c) === ' ') canvas.set(r, c, '.')
  }

  // Aliens
  const wobble = Math.floor(state.frameCount / 8) % 2 as 0 | 1
  for (const alien of state.aliens) {
    if (!alien.alive && !alien.exploding) continue

    if (alien.exploding) {
      const ef = Math.floor((6 - alien.explodeFrames) / 2) % EXPLOSION.length
      canvas.paint(EXPLOSION[ef], alien.row, alien.col)
    } else {
      const frame = ALIEN[alien.type][wobble]
      canvas.paint(frame, alien.row, alien.col)
    }
  }

  // Bullets
  for (const b of state.bullets) {
    const char = b.dir === -1 ? BULLET_PLAYER : BULLET_ALIEN
    canvas.set(b.row, b.col, char)
  }

  // Ground
  canvas.hline(GROUND_ROW, 0, CANVAS_W - 1, '=')

  // Ship
  const shipFrame = SHIP[0]
  canvas.paint(shipFrame, SHIP_ROW, state.ship.col)

  return canvas.toLines()
}

export function renderHud(state: GameState): string {
  const scoreStr = `SCORE:${state.score.toString().padStart(6, '0')}`
  const waveStr = `WAVE:${state.wave}`
  const livesStr = `LIVES:${'♥'.repeat(Math.max(0, state.lives))}`
  const pad = CANVAS_W - scoreStr.length - waveStr.length - livesStr.length
  return scoreStr + ' '.repeat(Math.max(1, Math.floor(pad / 2))) + waveStr + ' '.repeat(Math.max(1, Math.ceil(pad / 2))) + livesStr
}
