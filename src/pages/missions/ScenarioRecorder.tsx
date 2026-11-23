import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Circle, Square, Play, Pause, RotateCcw, Download, Upload, Trash2, Radio, Clock,
  Gauge, ListOrdered, Film, SkipBack, AlertTriangle, CheckCircle2, Layers, Wand2,
} from 'lucide-react'
import {
  Panel, PageHeader, Screen, StatCard, StatusPill, EmptyState, KeyValue, Modal,
  InlineAlert, Divider, Select, Tabs,
} from '@/components/ui'
import { useRecorder, type TapeFrame } from '@/services/recorder'
import { useEngine } from '@/services/engine'
import { audio } from '@/services/audio'
import { usePrefs } from '@/services/prefs'
import { cn, downloadFile, relTime } from '@/lib/utils'
import type { Severity } from '@/types'

const TOPIC_COLOURS: Record<string, string> = {
  FINANCE: 'var(--color-green)',
  CYBER: 'var(--color-blue)',
  GEOINT: 'var(--color-cyan)',
  SURVEILLANCE: 'var(--color-amber)',
  NETWORK: 'var(--color-violet)',
  MISSION: 'var(--accent)',
  CRISIS: 'var(--color-red)',
  COMMS: 'var(--color-blue)',
  AI: 'var(--color-violet)',
  SYSTEM: 'var(--color-ink-3)',
  RECORDER: 'var(--color-amber)',
}

const topicColour = (topic: string) => TOPIC_COLOURS[topic.split('.')[0]] ?? 'var(--color-ink-3)'
const EMPTY_FRAMES: TapeFrame[] = []

const fmtMs = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}.${String(Math.floor((ms % 1000) / 100))}`

export default function ScenarioRecorder() {
  const rec = useRecorder()
  const recording = rec.recording
  const soundEnabled = usePrefs((s) => s.soundEnabled)
  const seed = useEngine((s) => s.seed)
  const bus = useEngine((s) => s.bus)

  const [now, setNow] = useState(Date.now())
  const [confirmClear, setConfirmClear] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [tab, setTab] = useState('frames')
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Live timer for the armed state + the elapsed readout.
  useEffect(() => {
    if (!rec.recording) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [rec.recording])

  const selected = rec.recordings.find((r) => r.id === rec.selectedId) ?? null
  const armedMs = rec.recording ? now - rec.startedAt : 0
  const playTape = rec.recordings.find((r) => r.id === rec.playingId) ?? null

  const startRec = () => {
    if (soundEnabled) audio.play('recordArm')
    rec.start()
  }
  const stopRec = () => {
    const take = rec.stop()
    if (soundEnabled) audio.play('playbackStop')
    if (take) {
      useEngine.getState().emit('RECORDER.TAKE_SAVED', { id: take.id, frames: take.frames.length })
      useEngine.getState().logActivity({
        module: 'missions' as never,
        actor: 'RECORDER',
        action: 'Take captured',
        detail: `${take.name} · ${take.frames.length} frames`,
        level: 'info',
      })
    }
  }
  const play = () => {
    if (!selected) return
    if (soundEnabled) audio.play('playbackStart')
    rec.play(selected.id)
  }

  // Frames of whichever tape is "current": the armed take, the playing tape, or
  // the selected tape — in that order of relevance. Memoised on its inputs so
  // the derived tallies below get a stable dependency.
  const liveFrames = rec.live
  const playFrames = playTape?.frames
  const selectedFrames = selected?.frames
  // EMPTY_FRAMES is a module constant so the empty case has a stable identity
  // and the tallies below do not recompute on every render.
  const frames: TapeFrame[] = recording ? liveFrames : playFrames ?? selectedFrames ?? EMPTY_FRAMES
  const duration = rec.recording ? armedMs : playTape?.durationMs ?? selected?.durationMs ?? 0
  const head = rec.recording ? armedMs : rec.playhead

  // These are linear single-pass aggregations over at most a few thousand
  // frames; plain derivations are simpler than memoising a value the React
  // Compiler cannot prove stable, and the cost is unmeasurable here.
  const topicCounts: [string, number][] = (() => {
    const m = new Map<string, number>()
    for (const f of frames) {
      const k = f.topic.split('.')[0]
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  })()

  const severityCounts: Record<string, number> = (() => {
    const m: Record<string, number> = { low: 0, elevated: 0, critical: 0 }
    for (const f of frames) if (f.severity) m[f.severity] = (m[f.severity] ?? 0) + 1
    return m
  })()

  // The engine bus keeps the last 220 events; show it as a "what would be
  // captured if you armed right now" preview.
  const upcoming = useMemo(() => bus.slice(0, 12), [bus])

  const doImport = () => {
    const out = rec.importTape(importText)
    if (!out) {
      setImportError('That does not look like a SHADOW tape. Expected { format: "shadow-tape", frames: [...] }.')
      return
    }
    setImportError(null)
    setImportOpen(false)
    setImportText('')
    useEngine.getState().notify({ type: 'success', title: 'Tape imported', body: `${out.frames.length} frames from ${out.name}.`, severity: 'low' })
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    setImportText(text)
    setImportOpen(true)
  }

  const isLiveTape = rec.recording || Boolean(playTape)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="MISSION CONTROL · SCENARIO RECORDER"
        title="Scenario Recorder"
        subtitle="Arm the recorder, operate the console, then replay the whole session as a scripted scenario. Recordings capture the shared event bus — every module's actions land on the same tape."
        icon={Film}
        meta={
          <>
            <span className={cn('badge', rec.recording ? 'badge-red' : 'badge-grey')}>
              {rec.recording ? 'ARMED' : 'IDLE'}
            </span>
            <span className="badge badge-cyan">{rec.recordings.length} TAPES</span>
            <span className="badge badge-grey">SEED {seed}</span>
          </>
        }
        actions={
          <>
            {rec.recording ? (
              <>
                <button type="button" className="btn btn-sm btn-danger" onClick={stopRec}><Square size={11} /> Stop &amp; save</button>
                <button type="button" className="btn btn-sm" onClick={() => { rec.cancel(); if (soundEnabled) audio.play('modalClose') }}><Trash2 size={11} /> Discard</button>
              </>
            ) : (
              <button type="button" className="btn btn-sm btn-primary" onClick={startRec}><Circle size={11} className="fill-current" /> Arm recorder</button>
            )}
            <button type="button" className="btn btn-sm" onClick={() => setImportOpen(true)}><Upload size={11} /> Import</button>
          </>
        }
      />

      {rec.recording ? (
        <div className="anim-sweep">
          <InlineAlert
            tone="red"
            icon={Radio}
            title={`Recording · ${fmtMs(armedMs)} elapsed · ${rec.live.length} frames captured`}
          >
            Operate any module now — navigation, missions, transfers, alerts — and every event is written to this take.
            The recorder ignores its own replay traffic, so a replay can never be re-recorded.
          </InlineAlert>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Recorder" value={rec.recording ? 'ARMED' : rec.playing ? 'PLAYING' : 'IDLE'} icon={rec.recording ? Radio : Film} accent={rec.recording ? 'red' : rec.playing ? 'green' : 'cyan'} />
        <StatCard label="Frames" value={frames.length} icon={ListOrdered} accent="blue" sub={rec.recording ? 'live capture' : 'current tape'} />
        <StatCard label="Duration" value={fmtMs(duration)} icon={Clock} accent="amber" />
        <StatCard label="Tapes" value={rec.recordings.length} icon={Layers} accent="blue" sub={`seed ${seed}`} />
      </div>

      <div className="grid gap-2.5 xl:grid-cols-[1.55fr_1fr]">
        {/* ------------------------------------------------ transport + tape */}
        <Panel
          title="Transport"
          icon={Gauge}
          subtitle={rec.recording ? 'Native speed while recording' : `Playback at ${rec.speed}×`}
          actions={isLiveTape ? <StatusPill value={rec.recording ? 'live' : rec.paused ? 'paused' : 'active'} label={rec.recording ? 'REC' : rec.paused ? 'PAUSED' : 'PLAY'} /> : undefined}
          className="flex min-h-0 flex-col"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button type="button" className="btn btn-sm" title="Jump to start" aria-label="Jump to start" disabled={!playTape} onClick={() => { if (playTape) rec.setPlayhead(0) }}><SkipBack size={11} /></button>
              {rec.playing ? (
                <>
                  {rec.paused
                    ? <button type="button" className="btn btn-sm btn-primary" onClick={() => { rec.resumePlayback(); if (soundEnabled) audio.play('playbackStart') }}><Play size={11} /> Resume</button>
                    : <button type="button" className="btn btn-sm" onClick={() => { rec.pausePlayback(); if (soundEnabled) audio.play('toggle') }}><Pause size={11} /> Pause</button>}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => { rec.stopPlayback(); if (soundEnabled) audio.play('playbackStop') }}><Square size={11} /> Stop</button>
                </>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" disabled={!selected || !selected.frames.length} onClick={play}><Play size={11} /> Replay take</button>
              )}
              <button type="button" className="btn btn-sm" title="Replay from the start" aria-label="Replay from the start" disabled={!selected || !selected.frames.length} onClick={() => { if (selected) { rec.play(selected.id); if (soundEnabled) audio.play('playbackStart') } }}><RotateCcw size={11} /></button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="label-xs">Speed</span>
              <Select
                className="w-20"
                ariaLabel="Playback speed"
                value={String(rec.speed)}
                onChange={(v) => rec.setSpeed(Number(v) as 0.5 | 1 | 2 | 4)}
                options={[{ value: '0.5', label: '0.5×' }, { value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '4', label: '4×' }]}
              />
            </div>
          </div>

          {/* scrubber */}
          <div className="mb-1 flex items-center justify-between font-mono text-[9px] text-ink-3">
            <span>{fmtMs(head)}</span>
            <span>{fmtMs(duration)}</span>
          </div>
          <div className="relative mb-3 h-6">
            <input
              type="range"
              min={0}
              max={Math.max(1, duration)}
              value={Math.min(head, duration)}
              aria-label="Playhead"
              onChange={(e) => {
                const v = Number(e.target.value)
                rec.setPlayhead(v)
              }}
              className="w-full accent-[var(--accent)]"
              disabled={rec.recording || !playTape}
            />
            {/* event pips along the timeline */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5">
              {frames.map((f, i) => {
                const pct = duration ? (f.at / duration) * 100 : 0
                return (
                  <span
                    key={`${f.id}-${i}`}
                    className="absolute top-0 h-1.5 w-[2px] rounded-full"
                    style={{ left: `${Math.min(100, pct)}%`, background: topicColour(f.topic), opacity: f.at <= head ? 0.95 : 0.3 }}
                  />
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="border border-line-soft bg-bg/40 p-2">
              <p className="label-xs">Low</p>
              <p className="mono text-sm text-green">{severityCounts.low}</p>
            </div>
            <div className="border border-line-soft bg-bg/40 p-2">
              <p className="label-xs">Elevated</p>
              <p className="mono text-sm text-amber">{severityCounts.elevated}</p>
            </div>
            <div className="border border-line-soft bg-bg/40 p-2">
              <p className="label-xs">Critical</p>
              <p className="mono text-sm text-red">{severityCounts.critical}</p>
            </div>
            <div className="border border-line-soft bg-bg/40 p-2">
              <p className="label-xs">Modules</p>
              <p className="mono text-sm text-[var(--accent)]">{topicCounts.length}</p>
            </div>
          </div>

          <Divider />

          <Tabs
            value={tab}
            onChange={setTab}
            size="sm"
            tabs={[
              { id: 'frames', label: 'Captured frames', count: frames.length, icon: ListOrdered },
              { id: 'mix', label: 'Event mix', icon: Layers },
              { id: 'upcoming', label: 'Bus preview', count: upcoming.length, icon: Radio },
            ]}
          />

          <div className="mt-2 max-h-[300px] overflow-auto">
            {tab === 'frames' && (
              frames.length === 0 ? (
                <EmptyState
                  icon={Film}
                  title={rec.recording ? 'Armed — waiting for the first event' : 'No frames yet'}
                  message={rec.recording ? 'Navigate, open a module, launch a mission or send a transfer. Every bus event lands here.' : 'Arm the recorder or select a saved take to inspect its frames.'}
                />
              ) : (
                <ul className="divide-y divide-line-soft">
                  {[...frames].reverse().map((f, i) => {
                    const active = f.at <= head
                    return (
                      <li
                        key={`${f.id}-${i}`}
                        className={cn('anim-ticker flex items-start gap-2 py-1.5', !active && 'opacity-40')}
                        style={{ animationDelay: `${Math.min(i * 8, 160)}ms` }}
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: topicColour(f.topic) }} />
                        <span className="mono w-14 shrink-0 text-[9px] text-ink-3">{fmtMs(f.at)}</span>
                        <span className="mono shrink-0 text-[9px] text-[var(--accent)]">{f.topic}</span>
                        <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink-2">
                          {String(f.payload.label ?? f.payload.code ?? f.payload.id ?? f.payload.name ?? '—')}
                        </span>
                        {f.severity && <SeverityTag severity={f.severity} />}
                      </li>
                    )
                  })}
                </ul>
              )
            )}

            {tab === 'mix' && (
              topicCounts.length === 0 ? (
                <EmptyState icon={Layers} title="Nothing to chart" message="Capture or select a take to see which modules it touches." />
              ) : (
                <ul className="space-y-1.5">
                  {topicCounts.map(([topic, n], i) => (
                    <li key={topic} className="flex items-center gap-2">
                      <span className="mono w-24 shrink-0 text-[9px] uppercase text-ink-2">{topic}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-bg-2">
                        <div
                          className="anim-bar h-full"
                          style={{
                            width: `${(n / frames.length) * 100}%`,
                            background: topicColour(topic),
                            animationDelay: `${i * 40}ms`,
                          }}
                        />
                      </div>
                      <span className="mono w-8 shrink-0 text-right text-[9px] text-ink-3">{n}</span>
                    </li>
                  ))}
                </ul>
              )
            )}

            {tab === 'upcoming' && (
              <ul className="divide-y divide-line-soft">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 py-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink-3)]" />
                    <span className="mono shrink-0 text-[9px] text-[var(--accent)]">{e.topic}</span>
                    <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink-3">{relTime(e.ts)}</span>
                  </li>
                ))}
                {upcoming.length === 0 && <li className="py-4 text-center text-[10px] text-ink-3">The bus is quiet. Interact with any module.</li>}
              </ul>
            )}
          </div>
        </Panel>

        {/* ------------------------------------------------------- tape library */}
        <Panel
          title="Tape library"
          icon={Layers}
          subtitle="Saved takes persist in this browser"
          actions={
            rec.recordings.length > 0
              ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(true)}><Trash2 size={10} /> Clear</button>
              : undefined
          }
          bodyClassName="p-0"
          scroll
          className="max-h-[640px]"
        >
          {rec.recordings.length === 0 ? (
            <div className="p-3">
              <EmptyState icon={Film} title="No takes yet" message="Arm the recorder, use the console, then stop to save your first scenario tape." />
            </div>
          ) : (
            <ul className="divide-y divide-line-soft">
              {rec.recordings.map((r) => {
                const active = r.id === rec.selectedId
                return (
                  <li key={r.id} className={cn('p-2.5 transition-colors', active && 'bg-[var(--accent-soft)]')}>
                    <button type="button" className="block w-full text-left" onClick={() => rec.select(r.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-ink">{r.name}</span>
                        <span className="mono shrink-0 text-[8.5px] text-ink-3">{r.frames.length}f</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[8px] text-ink-3">
                        <span>{fmtMs(r.durationMs)}</span>
                        <span>·</span>
                        <span>seed {r.seed}</span>
                        <span>·</span>
                        <span>{relTime(r.created)}</span>
                      </div>
                    </button>
                    <div className="mt-1.5 flex items-center gap-1">
                      <button type="button" className="btn btn-sm !px-1.5" title="Replay" aria-label={`Replay ${r.name}`} onClick={() => { rec.select(r.id); rec.play(r.id); if (soundEnabled) audio.play('playbackStart') }}><Play size={9} /></button>
                      <button
                        type="button"
                        className="btn btn-sm !px-1.5"
                        title="Export tape"
                        aria-label={`Export ${r.name}`}
                        onClick={() => {
                          const json = rec.exportTape(r.id)
                          if (json) downloadFile(`shadow-tape-${r.id}.json`, json, 'application/json')
                        }}
                      ><Download size={9} /></button>
                      <button
                        type="button"
                        className="btn btn-sm !px-1.5"
                        title="Delete take"
                        aria-label={`Delete ${r.name}`}
                        onClick={() => rec.remove(r.id)}
                      ><Trash2 size={9} /></button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      {selected && (
        <div className="grid gap-2.5 xl:grid-cols-2">
          <Panel title="Take detail" icon={CheckCircle2}>
            <KeyValue
              items={[
                { k: 'Name', v: selected.name },
                { k: 'Id', v: selected.id },
                { k: 'Frames', v: String(selected.frames.length) },
                { k: 'Duration', v: fmtMs(selected.durationMs) },
                { k: 'Seed', v: String(selected.seed) },
                { k: 'Created', v: relTime(selected.created) },
                { k: 'Modules touched', v: String(new Set(selected.frames.map((f) => f.topic.split('.')[0])).size) },
                { k: 'Critical events', v: String(selected.frames.filter((f) => f.severity === 'critical').length) },
              ]}
            />
            <Divider />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => { rec.play(selected.id); if (soundEnabled) audio.play('playbackStart') }}
              ><Play size={10} /> Replay</button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  // Promote a take into a reusable mission template.
                  const s = useEngine.getState()
                  const name = `REPLAY ${selected.name.toUpperCase()}`
                  const events = selected.frames.slice(0, 24).map((f, i) => ({
                    id: `EVT-R-${i + 1}`,
                    at: Math.round(f.at / 1000),
                    module: (f.topic.split('.')[0].toLowerCase() === 'comms' ? 'communications' : f.topic.split('.')[0].toLowerCase()) as never,
                    action: f.topic.split('.').slice(1).join('.').toLowerCase() || 'event',
                    label: String(f.payload.label ?? f.topic),
                    duration: 6,
                    severity: (f.severity ?? 'low') as Severity,
                  }))
                  s.createMission({
                    name,
                    code: `OP-REC-${selected.id.slice(-4)}`,
                    category: 'CYBER',
                    severity: 'elevated',
                    status: 'draft',
                    objective: `Replay of recorded take ${selected.id}`,
                    progress: 0,
                    etaMinutes: Math.max(2, Math.round(selected.durationMs / 60000)),
                    modules: Array.from(new Set(events.map((e) => e.module))) as never,
                    events: events as never,
                    operatorId: s.currentOperatorId,
                    startedAt: null,
                    completedAt: null,
                    templateId: 'tpl-recorder',
                  } as never)
                  s.notify({ type: 'success', title: 'Take promoted to mission', body: `${name} created as a draft with ${events.length} scripted events.`, severity: 'low' })
                }}
              ><Wand2 size={10} /> Promote to mission</button>
              <button type="button" className="btn btn-sm" onClick={() => { const j = rec.exportTape(selected.id); if (j) downloadFile(`shadow-tape-${selected.id}.json`, j, 'application/json') }}><Download size={10} /> Export</button>
            </div>
          </Panel>

          <Panel title="Replay preview" icon={Play} subtitle="Frames that will be re-emitted, in order">
            <div className="max-h-[220px] overflow-auto">
              <ul className="space-y-1">
                {selected.frames.slice(0, 40).map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="mono w-12 shrink-0 text-[9px] text-ink-3">{fmtMs(f.at)}</span>
                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: topicColour(f.topic) }} />
                    <span className="mono truncate text-[9px] text-ink-2">{f.topic}</span>
                  </li>
                ))}
              </ul>
              {selected.frames.length > 40 && <p className="mt-1 text-center font-mono text-[8.5px] text-ink-3">+{selected.frames.length - 40} more frames</p>}
            </div>
          </Panel>
        </div>
      )}

      {!rec.recording && (
        <Panel title="How it works" icon={AlertTriangle}>
          <div className="grid gap-2 text-[10.5px] leading-relaxed text-ink-2 sm:grid-cols-3">
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)]">1 · Arm</p>
              <p>The recorder subscribes to the shared engine bus. Arming starts a take; nothing about the running simulation changes.</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)]">2 · Operate</p>
              <p>Use any module. Transfers, firewall changes, mission launches, alerts and AI reports all reach the bus and are timestamped.</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)]">3 · Replay</p>
              <p>Takes replay at 0.5–4×, can be exported as JSON and imported elsewhere, or promoted into a mission draft with scripted events.</p>
            </div>
          </div>
        </Panel>
      )}

      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportError(null) }}
        title="Import a scenario tape"
        subtitle="Paste JSON, or choose a .json file exported from another session"
        icon={Upload}
        footer={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setImportOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={doImport}><Upload size={11} /> Import tape</button>
          </>
        }
      >
        <div className="space-y-2">
          {importError && <InlineAlert tone="red" title={importError} />}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            aria-label="Choose a tape file"
            onChange={(e) => void onFile(e.target.files?.[0])}
            className="field"
          />
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"format":"shadow-tape","frames":[]}'
            aria-label="Tape JSON"
            className="field h-40 font-mono text-[10px]"
          />
          <p className="text-[9.5px] text-ink-3">
            Only fictional event metadata is imported. Frames are replayed through the same demo reducers the live console uses.
          </p>
        </div>
      </Modal>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear the tape library?"
        subtitle={`${rec.recordings.length} takes will be deleted from this browser`}
        icon={Trash2}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setConfirmClear(false)}>Cancel</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => { rec.clearAll(); setConfirmClear(false) }}><Trash2 size={11} /> Delete all</button>
          </>
        }
      >
        <p className="text-[11px] text-ink-2">Export any take you want to keep first. This removes only the recordings — the simulation and its records are untouched.</p>
      </Modal>
    </Screen>
  )
}

function SeverityTag({ severity }: { severity: Severity }) {
  const cls = severity === 'critical' ? 'text-red border-red/40' : severity === 'elevated' ? 'text-amber border-amber/40' : 'text-green border-green/40'
  return <span className={cn('shrink-0 border px-1 py-0.5 font-mono text-[7.5px] uppercase', cls)}>{severity}</span>
}
