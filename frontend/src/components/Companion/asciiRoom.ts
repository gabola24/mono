/**
 * ASCII Room System — background scene generator and room object catalog.
 *
 * The room is a fixed-size ASCII canvas (46 × 18 characters) that acts as
 * the persistent world the pet inhabits. It has three zones:
 *   - Wall area (rows 0–13): empty by default; objects appear here as the
 *     user's knowledge base grows.
 *   - Baseboard (row 14): separates wall from floor.
 *   - Floor (rows 15–16): wood-plank texture.
 *
 * Room objects are placed in predefined slots, one per slot, and are
 * determined by the user's top skill categories. Adding a new object
 * category is as simple as adding an entry to OBJECT_CATALOG.
 *
 * Pet positioning: each evolution stage has a dedicated (petRow, petCol)
 * so the pet always stands on the floor, regardless of how tall it grows.
 */

import { AsciiCanvas } from './asciiEngine'

// ─── Scene dimensions ─────────────────────────────────────────────────────────

export const SCENE_WIDTH = 46
export const SCENE_HEIGHT = 18

const FLOOR_LINE_ROW = 14    // baseboard: ├──...──┤
const FLOOR_FILL_ROW_1 = 15  // wood planks
const FLOOR_FILL_ROW_2 = 16  // floor shadow

// ─── Pet anchor positions ──────────────────────────────────────────────────────
// Each stage's art has a different height. petRow is chosen so the last
// visible art row lands on room row 13 (just above the baseboard).

export const STAGE_PET_CONFIG: Record<string, { petRow: number; petCol: number }> = {
  egg: { petRow: 5, petCol: 16 },  // 14w × 9h  — shadow at row 13
  hatchling: { petRow: 5, petCol: 15 },  // 15w × 10h — feet at row 13
  adolescent: { petRow: 3, petCol: 14 },  // 17w × 11h — feet at row 13
  evolved: { petRow: 2, petCol: 13 },  // 19w × 12h — feet at row 13
  transcended: { petRow: 1, petCol: 13 },  // 20w × 13h — fills the room
}

// ─── Room slots ───────────────────────────────────────────────────────────────

export type RoomSlot =
  | 'wall-left'
  | 'wall-right'
  | 'wall-center'
  | 'floor-left'
  | 'floor-right'

/** Top-left (row, col) of each slot inside the scene. */
export const SLOT_POSITIONS: Record<RoomSlot, [number, number]> = {
  'wall-left': [2, 2],
  'wall-right': [2, 36],
  'wall-center': [2, 18],
  'floor-left': [9, 2],
  'floor-right': [9, 33],
}

// ─── Room object types ────────────────────────────────────────────────────────

export interface RoomObject {
  id: string
  /** Skill category this object represents */
  category: string
  /** ASCII art lines — spaces are treated as transparent */
  art: string[]
  /** Where in the room to place the object */
  slot: RoomSlot
  /** Optional single-line label rendered below the art */
  label?: string
}

// ─── Object catalog ────────────────────────────────────────────────────────────
// Keyed by skill category. Add a new entry to make a new category visible
// in the room. Prefer art that fits within its slot's available columns
// (wall slots: ~8w × 5h; floor slots: ~8w × 4h).

export const OBJECT_CATALOG: Record<string, RoomObject> = {
  music: {
    id: 'guitar',
    category: 'music',
    slot: 'wall-right',
    art: [
      "  '&`  ",
      "   ││   ",
      "  _││_  ",
      " ( ││ ) ",
      " / () \\",
      "(  ══  ) ",
      " ` ── ",
    ],
  },

  code: {
    id: 'monitor',
    category: 'code',
    slot: 'floor-right',
    art: [
      '╭──────╮',
      '│▓ >_  │',
      '│░▒▓▒░░│',
      '╰──┬───╯',
      ' ══╧══  ',
    ],
  },

  writing: {
    id: 'bookshelf',
    category: 'writing',
    slot: 'wall-left',
    art: [
      '╔═══════╗',
      '║▌█▐▌█▐▌║',
      '║▌▓▐▌▓▐▌║',
      '║▌░▐▌░▐▌║',
      '╚═══════╝',
    ],
  },

  design: {
    id: 'canvas_board',
    category: 'design',
    slot: 'wall-center',
    art: [
      '╔═════╗',
      '║░◆◇◆░║',
      '║▒◇◆◇▒║',
      '╚══╤══╝',
      '   │   ',
    ],
  },

  science: {
    id: 'telescope',
    category: 'science',
    slot: 'floor-right',
    art: [
      ' ════╗  ',
      '╱ ░░░╚═ ',
      '│   ◎   ',
      '╲ ░░░╔═ ',
      ' ╙───╜  ',
    ],
  },

  philosophy: {
    id: 'scroll',
    category: 'philosophy',
    slot: 'wall-right',
    art: [
      '╭─────╮',
      '│▒∞  ·│',
      '│·  ∞ │',
      '│░·  ·│',
      '╰─────╯',
    ],
  },

  creative: {
    id: 'palette',
    category: 'creative',
    slot: 'wall-left',
    art: [
      ' ╭──────╮ ',
      '╭╯●○ ◎○●╰╮',
      '│░▒  ▒  ▒░│',
      '╰──────────╯',
    ],
  },
}

// ─── Skill → category resolver ────────────────────────────────────────────────
// Mirrors the logic in asciiFrames.ts so both systems agree on categories.

export function categorizeSkillForRoom(name: string): string | null {
  const n = name.toLowerCase()
  if (/music|audio|sound|rhythm|beat|melody|compos/.test(n)) return 'music'
  if (/writ|prose|poetry|narrative|story|literary/.test(n)) return 'writing'
  if (/art|generat|visual|color|aesthetic|illustration/.test(n)) return 'creative'
  if (/design|typograph|layout|ux|ui|brutalis|grid/.test(n)) return 'design'
  if (/code|program|engineer|algorithm|data|api|system/.test(n)) return 'code'
  if (/philos|ethic|metaphys|epistem|logic|absurd|existential/.test(n)) return 'philosophy'
  if (/scien|physics|chem|bio|math|statistic|research/.test(n)) return 'science'
  return null
}

/**
 * Resolve which room objects to display given the user's top skill names.
 * At most one object per slot — first-match wins per category order.
 * This is the primary hook for procedural room generation: as the user
 * builds up knowledge in new domains, new objects appear in the room.
 */
export function resolveRoomObjects(topSkillNames: string[]): RoomObject[] {
  const usedSlots = new Set<RoomSlot>()
  const result: RoomObject[] = []

  for (const skillName of topSkillNames) {
    const category = categorizeSkillForRoom(skillName)
    if (!category) continue
    const obj = OBJECT_CATALOG[category]
    if (obj && !usedSlots.has(obj.slot)) {
      usedSlots.add(obj.slot)
      result.push(obj)
      if (result.length >= 3) break  // cap at 3 objects to keep the room readable
    }
  }

  return result
}

// ─── Room canvas builder ──────────────────────────────────────────────────────

/**
 * Build the base empty room canvas: outer border, wallpaper dots,
 * baseboard, and floor texture.
 */
function buildBaseRoom(): AsciiCanvas {
  const c = new AsciiCanvas(SCENE_WIDTH, SCENE_HEIGHT)

  // Outer border
  c.set(0, 0, '╭')
  c.set(0, SCENE_WIDTH - 1, '╮')
  c.hline(0, 1, SCENE_WIDTH - 2, '─')

  c.set(SCENE_HEIGHT - 1, 0, '╰')
  c.set(SCENE_HEIGHT - 1, SCENE_WIDTH - 1, '╯')
  c.hline(SCENE_HEIGHT - 1, 1, SCENE_WIDTH - 2, '─')

  for (let r = 1; r < SCENE_HEIGHT - 1; r++) {
    c.set(r, 0, '│')
    c.set(r, SCENE_WIDTH - 1, '│')
  }

  // Wallpaper — staggered diamond dot pattern across upper wall
  for (let col = 3; col < SCENE_WIDTH - 2; col += 6) {
    c.set(1, col, '◦')
  }
  for (let col = 6; col < SCENE_WIDTH - 2; col += 6) {
    c.set(3, col, '◦')
  }
  for (let col = 3; col < SCENE_WIDTH - 2; col += 6) {
    c.set(5, col, '◦')
  }
  for (let col = 6; col < SCENE_WIDTH - 2; col += 6) {
    c.set(7, col, '◦')
  }

  // Baseboard — separates wall from floor
  c.set(FLOOR_LINE_ROW, 0, '├')
  c.set(FLOOR_LINE_ROW, SCENE_WIDTH - 1, '┤')
  c.hline(FLOOR_LINE_ROW, 1, SCENE_WIDTH - 2, '─')

  // Floor planks — light grain with plank dividers every 5 chars
  for (let col = 1; col < SCENE_WIDTH - 1; col++) {
    const char = col % 5 === 0 ? '╎' : '░'
    c.set(FLOOR_FILL_ROW_1, col, char)
  }

  // Floor shadow — sparse dots for a subtle depth hint
  for (let col = 2; col < SCENE_WIDTH - 1; col += 3) {
    c.set(FLOOR_FILL_ROW_2, col, '·')
  }

  return c
}

/**
 * Build a room canvas with all given objects already placed.
 * Store this and reuse across animation frames — only rebuild when
 * the set of objects changes (e.g., new skill unlocked).
 */
export function buildRoomCanvas(objects: RoomObject[] = []): AsciiCanvas {
  const room = buildBaseRoom()

  for (const obj of objects) {
    const [slotRow, slotCol] = SLOT_POSITIONS[obj.slot]
    room.paint(obj.art, slotRow, slotCol)

    if (obj.label) {
      const artWidth = Math.max(...obj.art.map(l => Array.from(l).length))
      const labelOffset = Math.max(0, Math.floor((artWidth - obj.label.length) / 2))
      const labelRow = slotRow + obj.art.length
      const labelCol = slotCol + labelOffset
      for (let i = 0; i < obj.label.length; i++) {
        room.set(labelRow, labelCol + i, obj.label[i])
      }
    }
  }

  return room
}

/**
 * Compose a complete scene by overlaying a single pet animation frame
 * onto the pre-built room canvas. Clones the room so the base is never
 * mutated and can be reused cheaply across frames.
 *
 * Call this every animation tick.
 */
export function compositeScene(
  roomCanvas: AsciiCanvas,
  petArt: string[],
  stage: string,
): string[] {
  const config = STAGE_PET_CONFIG[stage] ?? STAGE_PET_CONFIG.egg
  const frame = roomCanvas.clone()
  frame.paint(petArt, config.petRow, config.petCol)
  return frame.toLines()
}
