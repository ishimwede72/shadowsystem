// ============================================================================
// SHADOW SYSTEMS — Cinematic sound engine
// All audio is synthesised locally with the Web Audio API: no external assets,
// no autoplay. The engine stays silent until the operator enables sound.
// ============================================================================

export type SoundKey =
  | 'startup'
  | 'keystroke'
  | 'granted'
  | 'denied'
  | 'mission'
  | 'alert'
  | 'txnComplete'
  | 'txnReject'
  | 'notify'
  | 'camera'
  | 'shutdown'

type Ctx = AudioContext & { __shadowMaster?: GainNode }

let ctx: Ctx | null = null
let master: GainNode | null = null
let enabled = true
let volume = 0.4

function ensure(): boolean {
  if (typeof window === 'undefined') return false
  if (!enabled) return false
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return false
    ctx = new AC() as Ctx
    master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  if (master) master.gain.value = volume
  return true
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.25,
  delay = 0,
  slideTo?: number,
) {
  if (!ensure() || !ctx || !master) return
  const t0 = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, duration * 0.2))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noiseBurst(duration: number, gain = 0.12, delay = 0, highpass = 800) {
  if (!ensure() || !ctx || !master) return
  const t0 = ctx.currentTime + delay
  const frames = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filt = ctx.createBiquadFilter()
  filt.type = 'highpass'
  filt.frequency.value = highpass
  const g = ctx.createGain()
  g.gain.value = gain
  src.connect(filt)
  filt.connect(g)
  g.connect(master)
  src.start(t0)
}

export const audio = {
  setEnabled(v: boolean) {
    enabled = v
    if (v) ensure()
  },
  setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v))
    if (master) master.gain.value = volume
  },
  play(key: SoundKey) {
    if (!enabled) return
    switch (key) {
      case 'startup':
        tone(220, 0.18, 'sine', 0.16, 0)
        tone(330, 0.22, 'sine', 0.13, 0.14)
        tone(495, 0.4, 'triangle', 0.1, 0.3)
        noiseBurst(0.25, 0.05, 0.02, 2000)
        break
      case 'keystroke':
        noiseBurst(0.022, 0.035, 0, 2200)
        break
      case 'granted':
        tone(520, 0.1, 'sine', 0.16, 0)
        tone(780, 0.16, 'sine', 0.14, 0.09)
        tone(1040, 0.26, 'triangle', 0.1, 0.19)
        break
      case 'denied':
        tone(180, 0.16, 'sawtooth', 0.12, 0)
        tone(120, 0.28, 'sawtooth', 0.12, 0.14)
        break
      case 'mission':
        tone(140, 0.3, 'triangle', 0.14, 0)
        tone(280, 0.24, 'triangle', 0.12, 0.2)
        tone(420, 0.5, 'sine', 0.09, 0.42)
        break
      case 'alert':
        tone(880, 0.12, 'square', 0.1, 0)
        tone(660, 0.12, 'square', 0.1, 0.16)
        tone(880, 0.12, 'square', 0.1, 0.32)
        break
      case 'txnComplete':
        tone(660, 0.08, 'sine', 0.14, 0)
        tone(990, 0.2, 'sine', 0.12, 0.07)
        break
      case 'txnReject':
        tone(300, 0.1, 'square', 0.1, 0)
        tone(200, 0.22, 'square', 0.1, 0.1)
        break
      case 'notify':
        tone(1180, 0.06, 'sine', 0.1, 0)
        tone(1560, 0.1, 'sine', 0.08, 0.05)
        break
      case 'camera':
        tone(420, 0.05, 'square', 0.06, 0)
        tone(620, 0.07, 'square', 0.05, 0.05)
        break
      case 'shutdown':
        tone(320, 0.2, 'sine', 0.12, 0)
        tone(210, 0.24, 'sine', 0.11, 0.16)
        tone(120, 0.5, 'triangle', 0.1, 0.34)
        break
    }
  },
}

export const SOUND_LABELS: Record<SoundKey, string> = {
  startup: 'System startup',
  keystroke: 'Terminal keystrokes',
  granted: 'Access granted',
  denied: 'Access denied',
  mission: 'Mission activation',
  alert: 'Emergency alerts',
  txnComplete: 'Transaction completion',
  txnReject: 'Transaction rejection',
  notify: 'Notification received',
  camera: 'Camera status change',
  shutdown: 'System shutdown',
}
