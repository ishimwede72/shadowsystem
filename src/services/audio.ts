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
  // ---- second pass: navigation + interaction feedback ----
  | 'navigate'
  | 'panelOpen'
  | 'modalClose'
  | 'toggle'
  | 'hoverTick'
  | 'recordArm'
  | 'playbackStart'
  | 'playbackStop'
  | 'lockOn'
  | 'scan'
  | 'uplink'

type Ctx = AudioContext & { __shadowMaster?: GainNode }

let ctx: Ctx | null = null
let master: GainNode | null = null
let ambientGain: GainNode | null = null
let ambientNodes: { osc: OscillatorNode[]; lfo: OscillatorNode | null; noise: AudioBufferSourceNode | null } | null = null
let enabled = true
let volume = 0.4
let ambientOn = false
let muted = new Set<SoundKey>()

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

function noiseBurst(duration: number, gain = 0.12, delay = 0, highpass = 800, lowpass = 0) {
  if (!ensure() || !ctx || !master) return
  const t0 = ctx.currentTime + delay
  const frames = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const g = ctx.createGain()
  g.gain.value = gain
  let node: AudioNode = src
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = highpass
  node.connect(hp)
  node = hp
  if (lowpass) {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = lowpass
    node.connect(lp)
    node = lp
  }
  node.connect(g)
  g.connect(master)
  src.start(t0)
}

// Swept noise — the "scanning data" texture used by record/playback cues.
function sweepNoise(duration: number, from: number, to: number, gain = 0.08) {
  if (!ensure() || !ctx || !master) return
  const t0 = ctx.currentTime
  const frames = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * 0.7
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 6
  bp.frequency.setValueAtTime(from, t0)
  bp.frequency.exponentialRampToValueAtTime(to, t0 + duration)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + duration * 0.25)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  src.connect(bp)
  bp.connect(g)
  g.connect(master)
  src.start(t0)
}

export const audio = {
  setEnabled(v: boolean) {
    enabled = v
    if (v) ensure()
    else if (ambientGain && ctx) ambientGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2)
  },
  setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v))
    if (master) master.gain.value = volume
    if (ambientGain) ambientGain.gain.value = ambientOn ? volume * 0.16 : 0
  },
  muteCue(key: SoundKey, isMuted: boolean) {
    if (isMuted) muted.add(key)
    else muted.delete(key)
  },
  setMutedCues(keys: SoundKey[]) {
    muted = new Set(keys)
  },

  /** Low bed of filtered noise + detuned drones. Off by default, toggleable. */
  setAmbient(on: boolean) {
    ambientOn = on
    if (!on) {
      if (ambientGain && ctx) ambientGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3)
      if (ambientNodes) {
        const { osc, lfo, noise } = ambientNodes
        const t = ctx ? ctx.currentTime + 0.5 : 0
        osc.forEach((o) => { try { o.stop(t) } catch { /* already stopped */ } })
        try { lfo?.stop(t) } catch { /* already stopped */ }
        try { noise?.stop(t) } catch { /* already stopped */ }
        ambientNodes = null
      }
      return
    }
    if (!ensure() || !ctx || !master) return
    if (ambientNodes) return // already running

    ambientGain = ctx.createGain()
    ambientGain.gain.value = volume * 0.16
    ambientGain.connect(master)

    // Two detuned drones a fifth apart, slowly breathing.
    const osc: OscillatorNode[] = []
    for (const [f, g] of [[55, 0.5], [82.5, 0.28], [110, 0.16]] as const) {
      const o = ctx.createOscillator()
      const gain = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      gain.gain.value = g
      o.connect(gain)
      gain.connect(ambientGain)
      o.start()
      osc.push(o)
    }
    // Slow amplitude LFO so the bed never sits perfectly still.
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.06
    lfoGain.gain.value = 0.06
    lfo.connect(lfoGain)
    lfoGain.connect(ambientGain.gain)
    lfo.start()

    // Filtered noise floor for a room tone.
    const frames = Math.floor(ctx.sampleRate * 2)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = buffer
    noiseSrc.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 320
    const ng = ctx.createGain()
    ng.gain.value = 0.05
    noiseSrc.connect(lp)
    lp.connect(ng)
    ng.connect(ambientGain)
    noiseSrc.start()

    ambientNodes = { osc, lfo, noise: noiseSrc }
  },

  play(key: SoundKey) {
    if (!enabled) return
    if (muted.has(key)) return
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

      // ---- second pass ----
      case 'navigate':
        // Soft filtered click, like a relay switching.
        noiseBurst(0.04, 0.05, 0, 1200, 4000)
        tone(760, 0.05, 'sine', 0.045, 0.005)
        break
      case 'panelOpen':
        tone(520, 0.05, 'sine', 0.05, 0)
        tone(700, 0.09, 'sine', 0.035, 0.04)
        break
      case 'modalClose':
        tone(700, 0.05, 'sine', 0.04, 0)
        tone(480, 0.09, 'sine', 0.03, 0.04)
        break
      case 'toggle':
        tone(1180, 0.028, 'square', 0.045, 0)
        break
      case 'hoverTick':
        noiseBurst(0.014, 0.018, 0, 3200)
        break
      case 'recordArm':
        // Two rising blips then a held tone: "armed and listening".
        tone(440, 0.08, 'square', 0.07, 0)
        tone(660, 0.08, 'square', 0.07, 0.1)
        tone(880, 0.32, 'triangle', 0.05, 0.2)
        break
      case 'playbackStart':
        sweepNoise(0.45, 400, 2600, 0.06)
        tone(330, 0.12, 'triangle', 0.07, 0)
        tone(495, 0.16, 'triangle', 0.06, 0.1)
        break
      case 'playbackStop':
        sweepNoise(0.35, 2400, 380, 0.05)
        tone(495, 0.12, 'triangle', 0.05, 0)
        tone(330, 0.2, 'triangle', 0.045, 0.1)
        break
      case 'lockOn':
        tone(1400, 0.04, 'square', 0.05, 0)
        tone(1900, 0.05, 'square', 0.04, 0.045)
        break
      case 'scan':
        sweepNoise(0.6, 900, 3200, 0.045)
        break
      case 'uplink':
        // Data-handshake stutter.
        for (let i = 0; i < 6; i++) tone(600 + i * 90, 0.035, 'square', 0.04, i * 0.045)
        tone(1200, 0.2, 'sine', 0.05, 0.3)
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
  navigate: 'Route change',
  panelOpen: 'Panel / drawer open',
  modalClose: 'Dialog dismissed',
  toggle: 'Toggle switch',
  hoverTick: 'Hover tick',
  recordArm: 'Recorder armed',
  playbackStart: 'Playback start',
  playbackStop: 'Playback stop',
  lockOn: 'Target lock',
  scan: 'Scan sweep',
  uplink: 'Data uplink',
}

/** Grouping for the settings UI. */
export const SOUND_GROUPS: { group: string; keys: SoundKey[] }[] = [
  { group: 'System', keys: ['startup', 'shutdown', 'navigate', 'panelOpen', 'modalClose', 'toggle', 'keystroke'] },
  { group: 'Operations', keys: ['granted', 'denied', 'mission', 'alert', 'camera', 'uplink', 'lockOn', 'scan'] },
  { group: 'Records & playback', keys: ['recordArm', 'playbackStart', 'playbackStop', 'notify', 'txnComplete', 'txnReject'] },
  { group: 'Micro', keys: ['hoverTick'] },
]
