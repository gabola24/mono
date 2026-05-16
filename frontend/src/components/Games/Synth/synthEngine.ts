import type { Patch } from './presets'

export class SynthEngine {
  private ctx: AudioContext
  private osc1: OscillatorNode | null = null
  private osc2: OscillatorNode | null = null
  private relOsc1: OscillatorNode | null = null
  private relOsc2: OscillatorNode | null = null
  private envGain: GainNode
  private filter: BiquadFilterNode
  private masterGain: GainNode
  analyser: AnalyserNode
  private patch: Patch
  private _isPlaying = false

  constructor(ctx: AudioContext, patch: Patch) {
    this.ctx = ctx
    this.patch = patch

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0

    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = patch.volume

    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = patch.filterCutoff
    this.filter.Q.value = patch.filterQ

    this.envGain = ctx.createGain()
    this.envGain.gain.value = 0

    this.envGain.connect(this.filter)
    this.filter.connect(this.masterGain)
    this.masterGain.connect(ctx.destination)
    this.masterGain.connect(this.analyser)
  }

  setPatch(patch: Patch) {
    this.patch = patch
    const t = this.ctx.currentTime
    this.filter.frequency.setValueAtTime(patch.filterCutoff, t)
    this.filter.Q.setValueAtTime(patch.filterQ, t)
    this.masterGain.gain.setValueAtTime(patch.volume, t)
    if (this.osc1) this.osc1.type = patch.waveform
    if (this.osc2) {
      this.osc2.type = patch.waveform
      this.osc2.detune.setValueAtTime(patch.detune, t)
    }
  }

  noteOn(freq: number) {
    const { ctx, patch } = this
    const t = ctx.currentTime

    // Kill any release-phase oscs immediately to prevent clutter
    try { this.relOsc1?.stop() } catch (_) {}
    try { this.relOsc2?.stop() } catch (_) {}
    this.relOsc1 = null
    this.relOsc2 = null

    // Kill current oscs immediately (mono retrigger)
    try { this.osc1?.stop() } catch (_) {}
    try { this.osc2?.stop() } catch (_) {}

    // Create fresh oscillators
    this.osc1 = ctx.createOscillator()
    this.osc1.type = patch.waveform
    this.osc1.frequency.setValueAtTime(freq, t)
    this.osc1.connect(this.envGain)
    this.osc1.start(t)

    if (patch.detune !== 0) {
      this.osc2 = ctx.createOscillator()
      this.osc2.type = patch.waveform
      this.osc2.frequency.setValueAtTime(freq, t)
      this.osc2.detune.setValueAtTime(patch.detune, t)
      this.osc2.connect(this.envGain)
      this.osc2.start(t)
    } else {
      this.osc2 = null
    }

    // Ramp from current gain to avoid click on legato
    const curGain = this.envGain.gain.value
    this.envGain.gain.cancelScheduledValues(t)
    this.envGain.gain.setValueAtTime(curGain, t)
    this.envGain.gain.linearRampToValueAtTime(1, t + patch.attack)
    this.envGain.gain.linearRampToValueAtTime(patch.sustain, t + patch.attack + patch.decay)

    this._isPlaying = true
  }

  noteOff() {
    if (!this._isPlaying) return
    const { ctx, patch } = this
    const t = ctx.currentTime
    const stopAt = t + patch.release + 0.05

    this.envGain.gain.cancelScheduledValues(t)
    this.envGain.gain.setValueAtTime(this.envGain.gain.value, t)
    this.envGain.gain.linearRampToValueAtTime(0.0001, t + patch.release)

    // Move to release tracking so noteOn can kill them if needed
    this.relOsc1 = this.osc1
    this.relOsc2 = this.osc2
    try { this.relOsc1?.stop(stopAt) } catch (_) {}
    try { this.relOsc2?.stop(stopAt) } catch (_) {}

    this.osc1 = null
    this.osc2 = null
    this._isPlaying = false
  }

  dispose() {
    try { this.osc1?.stop() } catch (_) {}
    try { this.osc2?.stop() } catch (_) {}
    try { this.relOsc1?.stop() } catch (_) {}
    try { this.relOsc2?.stop() } catch (_) {}
    this.ctx.close().catch(() => {})
  }
}
