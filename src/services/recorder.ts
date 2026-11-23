// ============================================================================
// SHADOW SYSTEMS — Scenario Recorder
// Listens to the shared event bus and writes a replayable tape of what the
// operator did. A recording is a list of BusEvents with timestamps relative to
// the moment recording started, plus a snapshot of the seed so a replay can be
// reproduced against an identical world.
//
// Nothing here executes anything on a real machine: a "replay" re-emits the
// same fictional events through the same reducer path the live app uses.
// ============================================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEngine } from './engine'
import type { BusEvent, Severity } from '@/types'

export interface TapeFrame {
  /** Milliseconds since the recording started. */
  at: number
  topic: string
  payload: Record<string, unknown>
  severity?: Severity
  /** Filled in on import so the log keeps stable ids. */
  id: string
}

export interface Recording {
  id: string
  name: string
  created: string
  seed: number
  /** Wall-clock length of the take. */
  durationMs: number
  frames: TapeFrame[]
  /** Notified when a frame is dropped because the bus overflowed. */
  truncated: boolean
}

export type PlaybackSpeed = 0.5 | 1 | 2 | 4

interface RecorderState {
  recording: boolean
  startedAt: number
  /** Live take, held in memory; committed to `recordings` on stop. */
  live: TapeFrame[]
  recordings: Recording[]
  selectedId: string | null

  // playback
  playing: boolean
  paused: boolean
  playhead: number
  speed: PlaybackSpeed
  playingId: string | null

  start: () => void
  stop: () => Recording | null
  cancel: () => void
  capture: (evt: BusEvent) => void

  select: (id: string | null) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  clearAll: () => void
  importTape: (json: string) => Recording | null
  exportTape: (id: string) => string | null

  play: (id: string) => void
  pausePlayback: () => void
  resumePlayback: () => void
  stopPlayback: () => void
  setPlayhead: (ms: number) => void
  setSpeed: (s: PlaybackSpeed) => void
  /** Emit every frame up to `upTo`, used by scrub-to-here. */
  replayFrame: (frame: TapeFrame) => void
}

const TOPIC_MODULE: Record<string, string> = {
  FINANCE: 'finance',
  CYBER: 'cyber',
  GEOINT: 'geoint',
  SURVEILLANCE: 'surveillance',
  NETWORK: 'network',
  MISSION: 'missions',
  CRISIS: 'crisis',
  COMMS: 'communications',
  AI: 'ai',
  SYSTEM: 'system',
}

/** Re-emit a recorded frame through the same paths the live app uses. */
function applyFrame(frame: TapeFrame) {
  const s = useEngine.getState()
  const module = TOPIC_MODULE[frame.topic.split('.')[0]] ?? 'system'
  s.emit(frame.topic, frame.payload, frame.severity)
  s.logActivity({
    module: module as never,
    actor: 'RECORDER',
    action: `Replay · ${frame.topic}`,
    detail: String(frame.payload.label ?? frame.payload.code ?? frame.payload.id ?? ''),
    level: frame.severity === 'critical' ? 'warning' : 'info',
  })
}

const newId = () =>
  `REC-${Math.random().toString(36).slice(2, 6).toUpperCase()}${String(Date.now()).slice(-4)}`

export const useRecorder = create<RecorderState>()(
  persist(
    (set, get) => ({
      recording: false,
      startedAt: 0,
      live: [],
      recordings: [],
      selectedId: null,

      playing: false,
      paused: false,
      playhead: 0,
      speed: 1,
      playingId: null,

      start: () =>
        set({
          recording: true,
          startedAt: Date.now(),
          live: [],
          playing: false,
          paused: false,
          playhead: 0,
          playingId: null,
          selectedId: null,
        }),

      stop: () => {
        const { recording, startedAt, live } = get()
        if (!recording) return null
        const rec: Recording = {
          id: newId(),
          name: `Take ${new Date(startedAt).toLocaleTimeString('en-GB', { hour12: false })}`,
          created: new Date().toISOString(),
          seed: useEngine.getState().seed,
          durationMs: Math.max(1, Date.now() - startedAt),
          frames: live,
          truncated: false,
        }
        set({ recording: false, live: [], recordings: [rec, ...get().recordings].slice(0, 40), selectedId: rec.id })
        return rec
      },

      cancel: () => set({ recording: false, live: [], startedAt: 0 }),

      capture: (evt) => {
        const { recording, startedAt, live } = get()
        if (!recording) return
        // Ignore the recorder's own replay traffic so a replay never records
        // itself back into a tape.
        if (evt.topic.startsWith('RECORDER.')) return
        const frame: TapeFrame = {
          at: Date.now() - startedAt,
          topic: evt.topic,
          payload: evt.payload,
          severity: evt.severity,
          id: evt.id,
        }
        set({ live: [...live, frame].slice(0, 4000) })
      },

      select: (id) => set({ selectedId: id }),

      rename: (id, name) =>
        set({ recordings: get().recordings.map((r) => (r.id === id ? { ...r, name } : r)) }),

      remove: (id) =>
        set({
          recordings: get().recordings.filter((r) => r.id !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
          ...(get().playingId === id ? { playing: false, paused: false, playingId: null, playhead: 0 } : {}),
        }),

      clearAll: () => set({ recordings: [], selectedId: null, playing: false, paused: false, playingId: null, playhead: 0 }),

      exportTape: (id) => {
        const rec = get().recordings.find((r) => r.id === id)
        if (!rec) return null
        return JSON.stringify({ format: 'shadow-tape', version: 1, ...rec }, null, 2)
      },

      importTape: (json) => {
        try {
          const raw = JSON.parse(json) as Partial<Recording> & { format?: string; version?: number }
          if (raw.format !== undefined && raw.format !== 'shadow-tape') return null
          if (!Array.isArray(raw.frames)) return null
          const rec: Recording = {
            id: newId(),
            name: raw.name ? `${raw.name} (imported)` : 'Imported take',
            created: new Date().toISOString(),
            seed: Number(raw.seed) || useEngine.getState().seed,
            durationMs: Number(raw.durationMs) || (raw.frames.at(-1)?.at ?? 0),
            frames: raw.frames
              .filter((f) => f && typeof f.topic === 'string' && typeof f.at === 'number')
              .map((f, i) => ({
                at: Number(f.at),
                topic: String(f.topic),
                payload: (f.payload ?? {}) as Record<string, unknown>,
                severity: f.severity as Severity | undefined,
                id: `IMP-${i}`,
              }))
              .sort((a, b) => a.at - b.at),
            truncated: false,
          }
          set({ recordings: [rec, ...get().recordings].slice(0, 40), selectedId: rec.id })
          return rec
        } catch {
          return null
        }
      },

      play: (id) => {
        const rec = get().recordings.find((r) => r.id === id)
        if (!rec) return
        set({ playing: true, paused: false, playhead: 0, playingId: id })
        startPlaybackClock()
        useEngine.getState().emit('RECORDER.PLAYBACK_STARTED', { id, name: rec.name, frames: rec.frames.length })
      },

      pausePlayback: () => {
        if (!get().playing) return
        set({ paused: true })
        useEngine.getState().emit('RECORDER.PAUSED', { at: get().playhead })
      },

      resumePlayback: () => {
        if (!get().playing) return
        set({ paused: false })
        useEngine.getState().emit('RECORDER.RESUMED', { at: get().playhead })
      },

      stopPlayback: () => {
        const { playingId, playhead } = get()
        set({ playing: false, paused: false, playingId: null, playhead: 0 })
        useEngine.getState().emit('RECORDER.PLAYBACK_STOPPED', { id: playingId, at: playhead })
      },

      setPlayhead: (ms) => set({ playhead: ms }),

      setSpeed: (speed) => set({ speed }),

      replayFrame: (frame) => applyFrame(frame),
    }),
    {
      name: 'shadow-systems-recorder',
      version: 1,
      // A take survives a reload; an in-flight recording does not.
      partialize: (s) =>
        ({
          recordings: s.recordings,
          selectedId: s.selectedId,
          speed: s.speed,
        }) as unknown as RecorderState,
    },
  ),
)

// ---------------------------------------------------------------------------
// Bus subscription. Kept outside React so recording works no matter which page
// is mounted. The bus is newest-first and bounded, so we remember the id of the
// newest event we have seen and treat everything above it as new.
let unsub: (() => void) | null = null

export function attachRecorder() {
  if (unsub) return unsub
  let lastSeenId: string | null = null
  unsub = useEngine.subscribe((s) => {
    const bus = s.bus
    if (!bus.length) return
    const head = bus[0]
    if (!head || head.id === lastSeenId) return

    if (!useRecorder.getState().recording) {
      // While idle we still advance the cursor so arming mid-session does not
      // replay the entire backlog into the new take.
      lastSeenId = head.id
      return
    }

    const idx = lastSeenId ? bus.findIndex((e) => e.id === lastSeenId) : -1
    const fresh = idx === -1 ? bus.slice(0, 1) : bus.slice(0, idx)
    lastSeenId = head.id
    for (const evt of fresh) useRecorder.getState().capture(evt)
  })
  return unsub
}

// ---------------------------------------------------------------------------
// Playback clock. One interval drives the tape; it reads speed and pause from
// the store each tick so the controls stay responsive mid-playback.
let timer: ReturnType<typeof setInterval> | null = null

export function startPlaybackClock() {
  if (timer) return
  let last = Date.now()
  timer = setInterval(() => {
    const rec = useRecorder.getState()
    if (!rec.playing || rec.paused) {
      last = Date.now()
      return
    }
    const tape = rec.recordings.find((r) => r.id === rec.playingId)
    if (!tape) {
      stopPlaybackClock()
      return
    }
    const now = Date.now()
    const delta = (now - last) * rec.speed
    last = now
    let head = rec.playhead + delta
    const due = tape.frames.filter((f) => f.at > rec.playhead && f.at <= head)
    for (const f of due) applyFrame(f)
    const end = tape.durationMs
    if (head >= end && tape.frames.every((f) => f.at <= head)) {
      useRecorder.setState({ playing: false, paused: false, playingId: null, playhead: 0 })
      useEngine.getState().emit('RECORDER.PLAYBACK_COMPLETED', { id: tape.id, name: tape.name })
      audioCue('playbackStop')
      stopPlaybackClock()
      return
    }
    if (head > end) head = end
    useRecorder.setState({ playhead: head })
  }, 250)
}

function audioCue(k: 'playbackStop' | 'playbackStart') {
  // Imported lazily to keep this module free of circular init order issues.
  void import('./audio').then(({ audio }) => audio.play(k))
}

export function stopPlaybackClock() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
