export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle'

export interface Patch {
  waveform: Waveform
  detune: number       // cents on osc2; 0 = single osc
  filterCutoff: number // Hz
  filterQ: number
  attack: number       // s
  decay: number        // s
  sustain: number      // 0–1
  release: number      // s
  volume: number       // 0–1
}

export const PRESETS: Record<string, Patch> = {
  LEAD: {
    waveform: 'sawtooth', detune: 7,
    filterCutoff: 3500, filterQ: 4,
    attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.3, volume: 0.5,
  },
  BASS: {
    waveform: 'square', detune: 0,
    filterCutoff: 600, filterQ: 2,
    attack: 0.001, decay: 0.1, sustain: 0.9, release: 0.05, volume: 0.6,
  },
  BELL: {
    waveform: 'sine', detune: 0,
    filterCutoff: 8000, filterQ: 1,
    attack: 0.001, decay: 0.6, sustain: 0.1, release: 1.8, volume: 0.5,
  },
  PLUCK: {
    waveform: 'triangle', detune: 0,
    filterCutoff: 2000, filterQ: 3,
    attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1, volume: 0.55,
  },
  PAD: {
    waveform: 'sawtooth', detune: 12,
    filterCutoff: 1200, filterQ: 1.5,
    attack: 0.8, decay: 0.5, sustain: 0.8, release: 2.5, volume: 0.45,
  },
}
