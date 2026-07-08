import { lazy, type ComponentType } from 'react'

export interface GameDef {
  id: string
  name: string
  tagline: string
  glyph: string[]  // 3-line ASCII icon
  Component: ComponentType<{ onClose: () => void; onAfterPlay?: () => void }>
}

type GP = { onClose: () => void; onAfterPlay?: () => void }

const LinkGame = lazy(() => import('../LinkGame/LinkGame'))
const AlienAttack = lazy(() => import('./AlienAttack').then(m => ({ default: m.AlienAttack })))
const KaleidoView = lazy(() => import('./KaleidoView').then(m => ({ default: m.KaleidoView })))
const BeatMaker = lazy(() => import('./BeatMaker').then(m => ({ default: m.BeatMaker })))
const Synth = lazy(() => import('./Synth').then(m => ({ default: m.Synth })))
const Stargaze = lazy(() => import('./Stargaze').then(m => ({ default: m.Stargaze })))

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
    Component: LinkGame as ComponentType<GP>,
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
    Component: AlienAttack as ComponentType<GP>,
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
    Component: KaleidoView as ComponentType<GP>,
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
    Component: BeatMaker as ComponentType<GP>,
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
    Component: Synth as ComponentType<GP>,
  },
  {
    id: 'stargaze',
    name: 'STARGAZE',
    tagline: 'Draw lines between stars. Name what calls.',
    glyph: [
      '✦ · ❋',
      ' ╲ ╱ ',
      '  ✺  ',
    ],
    Component: Stargaze as ComponentType<GP>,
  },
]
