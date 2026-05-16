/**
 * WebAudio-synthesized drum voices.
 *
 * Each function schedules a one-shot drum hit at the given audio-clock time.
 * No external samples — pure oscillator + filtered noise. Swap for buffer
 * samples later by replacing each function with a `BufferSource` player.
 */

type Voice = (ctx: AudioContext, time: number, gain?: number) => void

function makeNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * durationSec)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

export const playKick: Voice = (ctx, time, gain = 0.9) => {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.frequency.setValueAtTime(160, time)
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.18)

  env.gain.setValueAtTime(gain, time)
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.32)

  osc.connect(env).connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.35)
}

export const playSnare: Voice = (ctx, time, gain = 0.55) => {
  // Noise component
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, 0.25)

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1200

  const noiseEnv = ctx.createGain()
  noiseEnv.gain.setValueAtTime(gain, time)
  noiseEnv.gain.exponentialRampToValueAtTime(0.0001, time + 0.18)

  noise.connect(hp).connect(noiseEnv).connect(ctx.destination)
  noise.start(time)
  noise.stop(time + 0.2)

  // Body tone (triangle)
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(220, time)
  osc.frequency.exponentialRampToValueAtTime(130, time + 0.08)

  const oscEnv = ctx.createGain()
  oscEnv.gain.setValueAtTime(gain * 0.6, time)
  oscEnv.gain.exponentialRampToValueAtTime(0.0001, time + 0.1)

  osc.connect(oscEnv).connect(ctx.destination)
  osc.start(time)
  osc.stop(time + 0.12)
}

export const playHihat: Voice = (ctx, time, gain = 0.3) => {
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, 0.08)

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7500

  const env = ctx.createGain()
  env.gain.setValueAtTime(gain, time)
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)

  noise.connect(hp).connect(env).connect(ctx.destination)
  noise.start(time)
  noise.stop(time + 0.06)
}

export const playCrash: Voice = (ctx, time, gain = 0.35) => {
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, 1.2)

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 4200

  const env = ctx.createGain()
  env.gain.setValueAtTime(gain, time)
  env.gain.exponentialRampToValueAtTime(0.0001, time + 1.1)

  noise.connect(hp).connect(env).connect(ctx.destination)
  noise.start(time)
  noise.stop(time + 1.2)
}

export const VOICES = {
  kick: playKick,
  snare: playSnare,
  hihat: playHihat,
  crash: playCrash,
} as const

export type VoiceId = keyof typeof VOICES
