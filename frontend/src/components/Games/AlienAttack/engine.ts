import { ALIEN_POINTS } from './sprites'

export const CANVAS_W = 48
export const CANVAS_H = 22
export const SHIP_WIDTH = 7
export const SHIP_ROW = 19        // ship top row
export const GROUND_ROW = 21      // hline row (no-go for aliens)
export const ALIEN_WIDTH = 3
export const ALIEN_HEIGHT = 2
export const ALIEN_COLS = 7
export const ALIEN_ROWS = 3
export const ALIEN_H_STEP = 5     // col distance between alien left edges
export const ALIEN_V_STEP = 3     // row distance between alien top edges
export const ALIEN_SPAWN_COL = Math.floor((CANVAS_W - ALIEN_COLS * ALIEN_H_STEP) / 2)
export const ALIEN_SPAWN_ROW = 1

export type AlienType = 0 | 1 | 2
export type GameStatus = 'playing' | 'paused' | 'gameover' | 'wave_clear'

export interface Alien {
  id: number
  row: number
  col: number
  type: AlienType
  alive: boolean
  exploding: boolean
  explodeFrames: number
}

export interface Bullet {
  id: number
  row: number
  col: number
  dir: 1 | -1   // -1 = up (player), +1 = down (alien)
}

export interface GameState {
  ship: { col: number }
  aliens: Alien[]
  bullets: Bullet[]
  wave: number
  score: number
  lives: number
  status: GameStatus
  alienDir: 1 | -1
  alienMoveTimer: number
  alienMoveInterval: number
  alienShootTimer: number
  alienShootInterval: number
  playerShootCooldown: number
  frameCount: number
  nextBulletId: number
}

export interface Input {
  left: boolean
  right: boolean
  fire: boolean
  pause: boolean
}

function spawnAliens(): Alien[] {
  const aliens: Alien[] = []
  let id = 0
  for (let r = 0; r < ALIEN_ROWS; r++) {
    const type = (ALIEN_ROWS - 1 - r) as AlienType  // top row = type 2 (hardest)
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        id: id++,
        row: ALIEN_SPAWN_ROW + r * ALIEN_V_STEP,
        col: ALIEN_SPAWN_COL + c * ALIEN_H_STEP,
        type,
        alive: true,
        exploding: false,
        explodeFrames: 0,
      })
    }
  }
  return aliens
}

export function createInitialState(): GameState {
  return {
    ship: { col: Math.floor((CANVAS_W - SHIP_WIDTH) / 2) },
    aliens: spawnAliens(),
    bullets: [],
    wave: 1,
    score: 0,
    lives: 3,
    status: 'playing',
    alienDir: 1,
    alienMoveTimer: 0,
    alienMoveInterval: 18,
    alienShootTimer: 0,
    alienShootInterval: 45,
    playerShootCooldown: 0,
    frameCount: 0,
    nextBulletId: 0,
  }
}

export function nextWave(state: GameState): GameState {
  const interval = Math.max(6, state.alienMoveInterval - 3)
  const shootInterval = Math.max(20, state.alienShootInterval - 5)
  return {
    ...state,
    aliens: spawnAliens(),
    bullets: [],
    wave: state.wave + 1,
    status: 'playing',
    alienDir: 1,
    alienMoveTimer: 0,
    alienMoveInterval: interval,
    alienShootTimer: 0,
    alienShootInterval: shootInterval,
  }
}

function liveAliens(aliens: Alien[]) {
  return aliens.filter((a) => a.alive && !a.exploding)
}

function moveAliensDown(aliens: Alien[]): Alien[] {
  return aliens.map((a) => ({ ...a, row: a.row + 2 }))
}

export function step(state: GameState, input: Input): GameState {
  if (state.status === 'paused') {
    if (input.pause) return { ...state, status: 'playing' }
    return state
  }
  if (state.status === 'gameover' || state.status === 'wave_clear') return state

  let s = { ...state, frameCount: state.frameCount + 1 }

  // --- Pause ---
  if (input.pause) return { ...s, status: 'paused' }

  // --- Move ship ---
  const SHIP_SPEED = 1
  let shipCol = s.ship.col
  if (input.left) shipCol = Math.max(0, shipCol - SHIP_SPEED)
  if (input.right) shipCol = Math.min(CANVAS_W - SHIP_WIDTH, shipCol + SHIP_SPEED)
  s = { ...s, ship: { col: shipCol } }

  // --- Player fire ---
  let nextBulletId = s.nextBulletId
  let bullets = [...s.bullets]
  let playerShootCooldown = Math.max(0, s.playerShootCooldown - 1)
  if (input.fire && playerShootCooldown === 0) {
    bullets.push({
      id: nextBulletId++,
      row: SHIP_ROW - 1,
      col: shipCol + Math.floor(SHIP_WIDTH / 2),
      dir: -1,
    })
    playerShootCooldown = 12
  }

  // --- Alien shoot ---
  let alienShootTimer = s.alienShootTimer + 1
  if (alienShootTimer >= s.alienShootInterval) {
    alienShootTimer = 0
    const live = liveAliens(s.aliens)
    if (live.length > 0) {
      const shooter = live[Math.floor(Math.random() * live.length)]
      bullets.push({
        id: nextBulletId++,
        row: shooter.row + ALIEN_HEIGHT,
        col: shooter.col + 1,
        dir: 1,
      })
    }
  }

  // --- Move bullets ---
  bullets = bullets
    .map((b) => ({ ...b, row: b.row + b.dir }))
    .filter((b) => b.row > 0 && b.row < GROUND_ROW)

  // --- Move aliens ---
  let aliens = s.aliens.map((a) => {
    if (a.exploding) {
      const ef = a.explodeFrames - 1
      return ef <= 0 ? { ...a, exploding: false, alive: false } : { ...a, explodeFrames: ef }
    }
    return a
  })

  let alienDir = s.alienDir
  let alienMoveTimer = s.alienMoveTimer + 1

  if (alienMoveTimer >= s.alienMoveInterval) {
    alienMoveTimer = 0
    const live = liveAliens(aliens)

    // Check if any alien would go out of bounds after moving
    const wouldHitWall = live.some((a) =>
      alienDir === 1 ? a.col + ALIEN_WIDTH + 1 > CANVAS_W : a.col - 1 < 0
    )

    if (wouldHitWall) {
      aliens = moveAliensDown(aliens)
      alienDir = (alienDir * -1) as 1 | -1
    } else {
      aliens = aliens.map((a) =>
        a.alive ? { ...a, col: a.col + alienDir } : a
      )
    }
  }

  // --- Collisions: player bullets hit aliens ---
  let score = s.score
  const hitAlienIds = new Set<number>()
  const consumedBulletIds = new Set<number>()

  for (const b of bullets) {
    if (b.dir !== -1) continue
    for (const a of aliens) {
      if (!a.alive || a.exploding) continue
      if (
        b.row >= a.row && b.row <= a.row + ALIEN_HEIGHT - 1 &&
        b.col >= a.col && b.col <= a.col + ALIEN_WIDTH - 1
      ) {
        hitAlienIds.add(a.id)
        consumedBulletIds.add(b.id)
        score += ALIEN_POINTS[a.type]
        break
      }
    }
  }

  aliens = aliens.map((a) =>
    hitAlienIds.has(a.id) ? { ...a, exploding: true, explodeFrames: 6 } : a
  )
  bullets = bullets.filter((b) => !consumedBulletIds.has(b.id))

  // --- Collisions: alien bullets hit ship ---
  let lives = s.lives
  const hitShipBullets = new Set<number>()
  for (const b of bullets) {
    if (b.dir !== 1) continue
    if (
      b.row >= SHIP_ROW && b.row <= SHIP_ROW + 1 &&
      b.col >= shipCol && b.col <= shipCol + SHIP_WIDTH - 1
    ) {
      hitShipBullets.add(b.id)
      lives -= 1
    }
  }
  bullets = bullets.filter((b) => !hitShipBullets.has(b.id))

  // --- Check game over conditions ---
  const liveNow = liveAliens(aliens)

  // Any alien reaches the ground or ship row
  const aliensTooLow = liveNow.some((a) => a.row + ALIEN_HEIGHT - 1 >= SHIP_ROW)
  const dead = lives <= 0 || aliensTooLow

  // All aliens destroyed → wave clear
  const waveClear = liveNow.length === 0 && !aliens.some((a) => a.exploding)

  let status: GameStatus = 'playing'
  if (dead) status = 'gameover'
  else if (waveClear) status = 'wave_clear'

  return {
    ...s,
    ship: { col: shipCol },
    aliens,
    bullets,
    score,
    lives,
    status,
    alienDir,
    alienMoveTimer,
    alienShootTimer,
    playerShootCooldown,
    nextBulletId,
  }
}
