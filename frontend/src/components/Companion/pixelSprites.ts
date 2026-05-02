/**
 * Mono Pixel Sprite System
 * SVG-based pixel art sprites for each mood state + stage combinations.
 * Each sprite is a small inline SVG string rendered on Canvas.
 * Traits (accessories) derived from Creative DNA are layered over the base sprite.
 */

export type MonoMood = 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'eating'
export type MonoStage = 'egg' | 'hatchling' | 'adolescent' | 'evolved' | 'transcended'

export interface MonoTrait {
  id: string
  label: string
  symbol: string
  color: string
}

/** Map Creative DNA keywords → Mono accessories */
export const DNA_TRAIT_MAP: Record<string, MonoTrait> = {
  music:      { id: 'headphones', label: 'headphones', symbol: '🎧', color: '#82aaff' },
  audio:      { id: 'headphones', label: 'headphones', symbol: '🎧', color: '#82aaff' },
  design:     { id: 'pencil',     label: 'pencil',     symbol: '✏️',  color: '#f7dc6f' },
  creative:   { id: 'pencil',     label: 'pencil',     symbol: '✏️',  color: '#f7dc6f' },
  code:       { id: 'glasses',    label: 'dev glasses', symbol: '👓', color: '#c792ea' },
  technical:  { id: 'glasses',    label: 'dev glasses', symbol: '👓', color: '#c792ea' },
  writing:    { id: 'quill',      label: 'quill',       symbol: '🪶', color: '#a8e6cf' },
  philosophy: { id: 'hat',        label: 'thinking hat', symbol: '🎩', color: '#ff8a5c' },
  science:    { id: 'telescope',  label: 'telescope',   symbol: '🔭', color: '#82aaff' },
}

/** Palette used across all sprite states */
const C = {
  fur:       '#8b6914',
  furLight:  '#d4a03c',
  furDark:   '#5c3d0e',
  face:      '#ffd6c0',
  eyeDark:   '#2a1a00',
  pink:      '#ff6b9d',
  indigo:    '#1a1b2e',
  purple:    '#2d2b55',
  gold:      '#f7dc6f',
  blue:      '#82aaff',
  mint:      '#a8e6cf',
  bg:        'transparent',
}

/** Each sprite is a 64×80 SVG string (viewBox="0 0 64 80") */
export const SPRITES: Record<MonoStage, Record<MonoMood, string[]>> = {
  egg: {
    idle: [
      // Frame 1: egg with closed eyes
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="42" rx="20" ry="26" fill="${C.fur}"/>
        <ellipse cx="32" cy="42" rx="18" ry="24" fill="${C.furLight}"/>
        <ellipse cx="32" cy="50" rx="12" ry="10" fill="${C.face}"/>
        <rect x="25" y="47" width="5" height="2" rx="1" fill="${C.eyeDark}"/>
        <rect x="34" y="47" width="5" height="2" rx="1" fill="${C.eyeDark}"/>
        <ellipse cx="32" cy="54" rx="3" ry="1.5" fill="${C.furDark}" opacity="0.5"/>
      </svg>`,
      // Frame 2: egg with sparkle
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="42" rx="20" ry="26" fill="${C.fur}"/>
        <ellipse cx="32" cy="42" rx="18" ry="24" fill="${C.furLight}"/>
        <ellipse cx="32" cy="50" rx="12" ry="10" fill="${C.face}"/>
        <rect x="25" y="47" width="5" height="2" rx="1" fill="${C.eyeDark}"/>
        <rect x="34" y="47" width="5" height="2" rx="1" fill="${C.eyeDark}"/>
        <text x="48" y="24" font-size="10" fill="${C.gold}" opacity="0.8">✦</text>
        <ellipse cx="32" cy="54" rx="3" ry="1.5" fill="${C.furDark}" opacity="0.5"/>
      </svg>`,
    ],
    thinking: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="42" rx="20" ry="26" fill="${C.fur}"/>
        <ellipse cx="32" cy="42" rx="18" ry="24" fill="${C.furLight}"/>
        <ellipse cx="32" cy="50" rx="12" ry="10" fill="${C.face}"/>
        <circle cx="27" cy="47" r="2.5" fill="${C.eyeDark}"/>
        <circle cx="37" cy="47" r="2.5" fill="${C.eyeDark}"/>
        <text x="44" y="26" font-size="8" fill="${C.blue}">?</text>
        <text x="48" y="20" font-size="6" fill="${C.blue}" opacity="0.5">?</text>
      </svg>`,
    ],
    speaking: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="42" rx="20" ry="26" fill="${C.fur}"/>
        <ellipse cx="32" cy="42" rx="18" ry="24" fill="${C.furLight}"/>
        <ellipse cx="32" cy="50" rx="12" ry="10" fill="${C.face}"/>
        <circle cx="27" cy="47" r="2.5" fill="${C.eyeDark}"/>
        <circle cx="37" cy="47" r="2.5" fill="${C.eyeDark}"/>
        <ellipse cx="32" cy="54" rx="3" ry="2" fill="${C.pink}"/>
      </svg>`,
    ],
    celebrating: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <text x="6" y="20" font-size="8" fill="${C.gold}">✦</text>
        <text x="48" y="20" font-size="8" fill="${C.gold}">✦</text>
        <ellipse cx="32" cy="42" rx="20" ry="26" fill="${C.fur}"/>
        <ellipse cx="32" cy="42" rx="18" ry="24" fill="${C.furLight}"/>
        <ellipse cx="32" cy="50" rx="12" ry="10" fill="${C.face}"/>
        <path d="M25 46 Q27 50 29 46" stroke="${C.eyeDark}" stroke-width="2" fill="none"/>
        <path d="M35 46 Q37 50 39 46" stroke="${C.eyeDark}" stroke-width="2" fill="none"/>
        <path d="M28 54 Q32 58 36 54" stroke="${C.pink}" stroke-width="2" fill="none"/>
      </svg>`,
    ],
    eating: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="42" rx="20" ry="26" fill="${C.fur}"/>
        <ellipse cx="32" cy="42" rx="18" ry="24" fill="${C.furLight}"/>
        <ellipse cx="32" cy="50" rx="12" ry="10" fill="${C.face}"/>
        <circle cx="27" cy="47" r="3" fill="${C.eyeDark}"/>
        <circle cx="37" cy="47" r="3" fill="${C.eyeDark}"/>
        <ellipse cx="32" cy="54" rx="4" ry="3" fill="${C.pink}"/>
        <text x="10" y="24" font-size="7" fill="${C.pink}">nom</text>
      </svg>`,
    ],
  },

  hatchling: {
    idle: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <!-- Body -->
        <ellipse cx="32" cy="54" rx="14" ry="16" fill="${C.fur}"/>
        <!-- Head -->
        <circle cx="32" cy="30" r="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="14" fill="${C.furLight}"/>
        <!-- Face patch -->
        <ellipse cx="32" cy="33" rx="9" ry="7" fill="${C.face}"/>
        <!-- Eyes -->
        <circle cx="27" cy="30" r="3" fill="${C.eyeDark}"/>
        <circle cx="37" cy="30" r="3" fill="${C.eyeDark}"/>
        <circle cx="28" cy="29" r="1" fill="white"/>
        <circle cx="38" cy="29" r="1" fill="white"/>
        <!-- Mouth -->
        <path d="M28 36 Q32 39 36 36" stroke="${C.furDark}" stroke-width="1.5" fill="none"/>
        <!-- Ears -->
        <ellipse cx="18" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(15,46,18)"/>
        <ellipse cx="18" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(15,46,18)"/>
        <!-- Arms suggestion -->
        <ellipse cx="17" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(-20,17,60)"/>
        <ellipse cx="47" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(20,47,60)"/>
      </svg>`,
      // Frame 2: blink
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="54" rx="14" ry="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="14" fill="${C.furLight}"/>
        <ellipse cx="32" cy="33" rx="9" ry="7" fill="${C.face}"/>
        <!-- Blinking eyes -->
        <rect x="24" y="29" width="6" height="2" rx="1" fill="${C.eyeDark}"/>
        <rect x="34" y="29" width="6" height="2" rx="1" fill="${C.eyeDark}"/>
        <path d="M28 36 Q32 39 36 36" stroke="${C.furDark}" stroke-width="1.5" fill="none"/>
        <ellipse cx="18" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(15,46,18)"/>
        <ellipse cx="18" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(15,46,18)"/>
        <ellipse cx="17" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(-20,17,60)"/>
        <ellipse cx="47" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(20,47,60)"/>
      </svg>`,
    ],
    thinking: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="54" rx="14" ry="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="14" fill="${C.furLight}"/>
        <ellipse cx="32" cy="33" rx="9" ry="7" fill="${C.face}"/>
        <circle cx="27" cy="30" r="3" fill="${C.eyeDark}"/>
        <circle cx="37" cy="30" r="3" fill="${C.eyeDark}"/>
        <circle cx="28" cy="29" r="1" fill="white"/>
        <circle cx="38" cy="29" r="1" fill="white"/>
        <path d="M29 36 Q32 37 35 36" stroke="${C.furDark}" stroke-width="1.5" fill="none"/>
        <ellipse cx="18" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(15,46,18)"/>
        <ellipse cx="18" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(15,46,18)"/>
        <!-- Thought bubbles -->
        <circle cx="46" cy="12" r="2" fill="${C.blue}" opacity="0.6"/>
        <circle cx="50" cy="7" r="3" fill="${C.blue}" opacity="0.7"/>
        <circle cx="54" cy="3" r="1.5" fill="${C.blue}" opacity="0.5"/>
        <ellipse cx="17" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(-20,17,60)"/>
        <ellipse cx="47" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(20,47,60)"/>
      </svg>`,
    ],
    speaking: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <ellipse cx="32" cy="54" rx="14" ry="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="14" fill="${C.furLight}"/>
        <ellipse cx="32" cy="33" rx="9" ry="7" fill="${C.face}"/>
        <circle cx="27" cy="30" r="3" fill="${C.eyeDark}"/>
        <circle cx="37" cy="30" r="3" fill="${C.eyeDark}"/>
        <circle cx="28" cy="29" r="1" fill="white"/>
        <circle cx="38" cy="29" r="1" fill="white"/>
        <!-- Open mouth speaking -->
        <ellipse cx="32" cy="37" rx="4" ry="3" fill="${C.pink}"/>
        <ellipse cx="18" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(15,46,18)"/>
        <ellipse cx="18" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(15,46,18)"/>
        <ellipse cx="17" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(-20,17,60)"/>
        <ellipse cx="47" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(20,47,60)"/>
      </svg>`,
    ],
    celebrating: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <text x="4" y="12" font-size="8" fill="${C.gold}">✦</text>
        <text x="52" y="12" font-size="8" fill="${C.gold}">✦</text>
        <text x="8" y="72" font-size="8" fill="${C.pink}">✦</text>
        <text x="48" y="72" font-size="8" fill="${C.pink}">✦</text>
        <ellipse cx="32" cy="54" rx="14" ry="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="14" fill="${C.furLight}"/>
        <ellipse cx="32" cy="33" rx="9" ry="7" fill="${C.face}"/>
        <path d="M24 29 Q27 34 30 29" stroke="${C.eyeDark}" stroke-width="2" fill="none"/>
        <path d="M34 29 Q37 34 40 29" stroke="${C.eyeDark}" stroke-width="2" fill="none"/>
        <path d="M27 37 Q32 42 37 37" stroke="${C.pink}" stroke-width="2" fill="${C.pink}" opacity="0.4"/>
        <ellipse cx="18" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(15,46,18)"/>
        <ellipse cx="18" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(15,46,18)"/>
        <!-- Arms up celebrating -->
        <ellipse cx="12" cy="50" rx="5" ry="8" fill="${C.fur}" transform="rotate(-50,12,50)"/>
        <ellipse cx="52" cy="50" rx="5" ry="8" fill="${C.fur}" transform="rotate(50,52,50)"/>
      </svg>`,
    ],
    eating: [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">
        <text x="10" y="8" font-size="7" fill="${C.mint}">nom</text>
        <ellipse cx="32" cy="54" rx="14" ry="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="16" fill="${C.fur}"/>
        <circle cx="32" cy="30" r="14" fill="${C.furLight}"/>
        <ellipse cx="32" cy="33" rx="9" ry="7" fill="${C.face}"/>
        <circle cx="27" cy="29" r="3.5" fill="${C.eyeDark}"/>
        <circle cx="37" cy="29" r="3.5" fill="${C.eyeDark}"/>
        <circle cx="28" cy="28" r="1.2" fill="white"/>
        <circle cx="38" cy="28" r="1.2" fill="white"/>
        <ellipse cx="32" cy="38" rx="5" ry="4" fill="${C.pink}"/>
        <ellipse cx="18" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="5" ry="8" fill="${C.fur}" transform="rotate(15,46,18)"/>
        <ellipse cx="18" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(-15,18,18)"/>
        <ellipse cx="46" cy="18" rx="3" ry="5" fill="${C.pink}" opacity="0.6" transform="rotate(15,46,18)"/>
        <ellipse cx="17" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(-20,17,60)"/>
        <ellipse cx="47" cy="60" rx="5" ry="8" fill="${C.fur}" transform="rotate(20,47,60)"/>
      </svg>`,
    ],
  },

  // For higher stages (adolescent / evolved / transcended), we use hatchling sprites
  // with visual enhancements added in the rendering layer (crown, aura, etc.)
  adolescent: { idle: [], thinking: [], speaking: [], celebrating: [], eating: [] },
  evolved: { idle: [], thinking: [], speaking: [], celebrating: [], eating: [] },
  transcended: { idle: [], thinking: [], speaking: [], celebrating: [], eating: [] },
}

// Fill in higher stages with hatchling base + enhancement markers
for (const stage of ['adolescent', 'evolved', 'transcended'] as const) {
  for (const mood of ['idle', 'thinking', 'speaking', 'celebrating', 'eating'] as const) {
    SPRITES[stage][mood] = SPRITES.hatchling[mood]
  }
}

/** Given a mood mapping from companionStore to MonoMood sprites */
export function mapCompanionMoodToMono(
  mood: 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'eating'
): MonoMood {
  return mood as MonoMood
}

/** Extract traits from DNA themes/influences */
export function traitsFromDNA(themes: string[], influences: string[]): MonoTrait[] {
  const combined = [...themes, ...influences].map((s) => s.toLowerCase())
  const seen = new Set<string>()
  const result: MonoTrait[] = []
  for (const word of combined) {
    for (const key of Object.keys(DNA_TRAIT_MAP)) {
      if (word.includes(key) && !seen.has(DNA_TRAIT_MAP[key].id)) {
        seen.add(DNA_TRAIT_MAP[key].id)
        result.push(DNA_TRAIT_MAP[key])
        if (result.length >= 2) return result
      }
    }
  }
  return result
}
