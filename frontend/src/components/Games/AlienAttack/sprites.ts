// Alien sprite frames — 3 wide × 2 tall per frame, 2 frames each for idle wobble
// Shape mirrors frontend/src/components/Companion/asciiFrames.ts convention

export const ALIEN: Record<0 | 1 | 2, [string[], string[]]> = {
  0: [
    ['|v|', '/=\\'],  // frame 0
    ['|v|', '\\=/'],  // frame 1
  ],
  1: [
    ['{O}', '(m)'],
    ['{O}', '/m\\'],
  ],
  2: [
    ['/W\\', '|=|'],
    ['\\W/', '|=|'],
  ],
}

// Player ship — 7 wide × 2 tall
export const SHIP: string[][] = [
  ['  /A\\  ', '[=====]'],  // idle
  ['  /A\\  ', '[=====]'],  // fire flash (same shape, colour handled in render)
]

// Player bullet — 1 wide × 1 tall
export const BULLET_PLAYER = '|'

// Alien bullet — 1 wide × 1 tall
export const BULLET_ALIEN = '!'

// Explosion frames — 3 wide × 2 tall
export const EXPLOSION: string[][] = [
  [' * ', '*X*'],
  ['***', ' X '],
  [' x ', '   '],
]

// Points per alien type
export const ALIEN_POINTS: Record<0 | 1 | 2, number> = { 0: 10, 1: 20, 2: 30 }
