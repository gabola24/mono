import type { ComponentType } from 'react'
import LinkGame from '../LinkGame/LinkGame'
import { AlienAttack } from './AlienAttack'
import { KaleidoView } from './KaleidoView'
import { BeatMaker } from './BeatMaker'
import { Synth } from './Synth'

export interface GameDef {
  id: string
  name: string
  tagline: string
  glyph: string[]  // 3-line ASCII icon
  Component: ComponentType<{ onClose: () => void; onAfterPlay?: () => void }>
}

export const GAMES: GameDef[] = [
  {
    id: 'link',
    name: 'LINK // CREATIVE SPARK',
    tagline: 'Connect two ideas. Forge a Mind Graph node.',
    glyph: [
      ' ◇—◇ ',
      '  |  ',
      ' ◆—◆ ',
    ],
    Component: LinkGame,
  },
  {
    id: 'alien-attack',
    name: 'ALIEN ATTACK',
    tagline: 'Defend your creative space. Shoot first.',
    glyph: [
      ' /W\\ ',
      '|   |',
      ' \\=/ ',
    ],
    Component: AlienAttack as ComponentType<{ onClose: () => void; onAfterPlay?: () => void }>,
  },
  {
    id: 'kaleido',
    name: 'KALEIDOSCOPE',
    tagline: 'Watch ASCII fold into endless symmetry.',
    glyph: [
      '❋ · ✦ · ❋',
      '·  ✸  ·',
      '❋ · ✦ · ❋',
    ],
    Component: KaleidoView as ComponentType<{ onClose: () => void; onAfterPlay?: () => void }>,
  },
  {
    id: 'beat-maker',
    name: 'BEAT MAKER',
    tagline: '16-step drum machine. Find your groove.',
    glyph: [
      '█·█·█·█·',
      '··█···█·',
      '·█·█·█·█',
    ],
    Component: BeatMaker as ComponentType<{ onClose: () => void; onAfterPlay?: () => void }>,
  },
  {
    id: 'synth',
    name: 'SYNTH // MONO',
    tagline: 'Play. Tweak. Watch the waveform breathe.',
    glyph: [
      ' ∿∿∿∿∿ ',
      '[●●●●●]',
      ' ▓▓▓▓▓ ',
    ],
    Component: Synth as ComponentType<{ onClose: () => void; onAfterPlay?: () => void }>,
  },
]
