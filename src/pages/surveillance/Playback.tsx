import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PlayCircle, Pause, SkipBack, SkipForward, Rewind, FastForward, Camera as CameraIcon,
  Download, Scissors, Bookmark, ZoomIn, Circle,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Select, Slider, KeyValue, InlineAlert, Divider, Toggle, EmptyState } from '@/components/ui'
import { SyntheticCamera } from '@/components/feeds/SyntheticCamera'
import { useEngine } from '@/services/engine'
import { cn, pad } from '@/lib/utils'

const SPEEDS = [0.5, 1, 2, 4]

export default function Playback() {
  const s = useEngine()
  const [cameraId, setCameraId] = useState(s.cameras[0]?.id ?? '')
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0) // seconds into a 900s (15m) window
  const [speed, setSpeed] = useState(1)
  const [marks, setMarks] = useState<number[]>([120, 380, 640])
  const [zoom, setZoom] = useState(1)
  const [bookmarks, setBookmarks] = useState<{ id: string; label: string; t: number; cam: string }[]>([
    { id: 'BM-01', label: 'Lobby handoff', t: 214, cam: s.cameras[0]?.id ?? '' },
    { id: 'BM-02', label: 'Loading bay activity', t: 512, cam: s.cameras[2]?.id ?? '' },
  ])
  const raf = useRef(0)
  const last = useRef(0)

  const WINDOW = 900
  const cam = s.cameras.find((c) => c.id === cameraId)

  useEffect(() => {
    if (!playing) return
    last.current = performance.now()
    const loop = (now: number) => {
      const dt = (now - last.current) / 1000
      last.current = now
      setTime((t) => {
        const next = t + dt * speed * 8
        return next >= WINDOW ? 0 : next
      })
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, speed])

  const clock = useMemo(() => {
    const total = 9 * 3600 + 41 * 60 + Math.floor(time) // 09:41:00 base
    const h = Math.floor(total / 3600) % 24
    const m = Math.floor((total % 3600) / 60)
    const sec = total % 60
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }, [time])

  const incidents = s.surveillanceIncidents.filter((i) => i.cameraId === cameraId)

  const seek = (t: number) => setTime(Math.max(0, Math.min(WINDOW, t)))

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SURVEILLANCE · PLAYBACK"
        title="Playback Review"
        subtitle="Scrub a synthetic 15-minute window, drop markers and create bookmarks for the fictional review board."
        icon={PlayCircle}
        meta={
          <>
            <span className="badge badge-cyan">{cam?.id ?? 'NO CAMERA'}</span>
            <span className="badge badge-grey">15 MIN WINDOW</span>
            <span className="badge badge-green">RENDERED OFFLINE</span>
            <span className="badge badge-amber">{marks.length} MARKERS</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setBookmarks((b) => [{ id: `BM-${pad(b.length + 1)}`, label: `Marker at ${clock}`, t: Math.round(time), cam: cameraId }, ...b])}
          >
            <Bookmark size={11} /> Bookmark frame
          </button>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <Panel
            title="Review Monitor"
            icon={CameraIcon}
            subtitle={cam ? `${cam.location} · ${cam.resolution} · ${cam.fps}fps` : undefined}
            bodyClassName="p-0"
            actions={cam ? <StatusPill value={cam.status} /> : undefined}
          >
            <div className="relative">
              <SyntheticCamera seed={`${cameraId}-${Math.floor(time / 12)}`} className="aspect-video" moving={playing} scan={playing} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-6">
                <span className="font-mono text-[9px] text-[#7ff0fb]">{clock}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-ink-3">{playing ? `PLAY ${speed}x` : 'PAUSED'} · SIMULATED ARCHIVE</span>
              </div>
            </div>

            {/* Timeline scrubber */}
            <div className="border-t border-line bg-[#0a1117] px-2.5 py-2">
              <div className="relative h-9 select-none border border-line bg-bg" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #1a2530 0 1px, transparent 1px 44px)' }}>
                {marks.map((m) => (
                  <span key={m} className="absolute top-0 h-full w-px bg-amber/70" style={{ left: `${(m / WINDOW) * 100}%` }} title={`Marker ${m}s`} />
                ))}
                {incidents.map((i, idx) => {
                  const pos = ((idx + 1) / (incidents.length + 1)) * 100
                  return <span key={i.id} className="absolute top-1 h-2 w-1 bg-red" style={{ left: `${pos}%` }} title={i.detail} />
                })}
                <span className="absolute inset-y-0 w-px bg-[var(--accent)]" style={{ left: `${(time / WINDOW) * 100}%` }}>
                  <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-[var(--accent)]" />
                </span>
                <input
                  type="range"
                  min={0}
                  max={WINDOW}
                  value={time}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[8.5px] text-ink-3">
                <span>09:41:00</span>
                <span className="text-[var(--accent)]">{clock}</span>
                <span>09:56:00</span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <button type="button" className="btn btn-sm" title="Jump to start" aria-label="Jump to start" onClick={() => seek(0)}><Rewind size={11} /></button>
                <button type="button" className="btn btn-sm" onClick={() => seek(time - 15)}><SkipBack size={11} /> 15s</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setPlaying((p) => !p)}>
                  {playing ? <Pause size={11} /> : <PlayCircle size={11} />} {playing ? 'Pause' : 'Play'}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => seek(time + 15)}>15s <SkipForward size={11} /></button>
                <button type="button" className="btn btn-sm" title="Jump to live edge" aria-label="Jump to live edge" onClick={() => seek(WINDOW)}><FastForward size={11} /></button>
                <span className="mx-1 h-4 w-px bg-line" />
                {SPEEDS.map((sp) => (
                  <button key={sp} type="button" onClick={() => setSpeed(sp)} className={cn('btn btn-sm !px-2', speed === sp && 'btn-primary')}>{sp}x</button>
                ))}
                <span className="mx-1 h-4 w-px bg-line" />
                <button type="button" className="btn btn-sm" onClick={() => { if (!marks.includes(Math.round(time))) setMarks((m) => [...m, Math.round(time)].sort((a, b) => a - b)) }}>
                  <Circle size={10} /> Drop marker
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setMarks([])}>Clear markers</button>
              </div>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Camera Source" icon={CameraIcon}>
              <Select value={cameraId} onChange={setCameraId} options={s.cameras.map((c) => ({ value: c.id, label: `${c.id} · ${c.label}` }))} />
              <Divider />
              <div className="grid grid-cols-3 gap-1">
                {s.cameras.slice(0, 6).map((c) => (
                  <button key={c.id} type="button" onClick={() => setCameraId(c.id)} className={cn('border p-1 text-left', cameraId === c.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line hover:border-line-strong')}>
                    <SyntheticCamera seed={c.id} className="aspect-video" moving={false} scan={false} label={false} noise={false} />
                    <span className="mt-0.5 block truncate font-mono text-[7.5px] text-ink-3">{c.id}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Review Notes" icon={Scissors}>
              <div className="space-y-2">
                <Slider label="Zoom" min={1} max={4} step={0.5} value={zoom} onChange={setZoom} suffix="x" />
                <div className="flex items-center justify-between">
                  <Toggle checked={playing} onChange={setPlaying} label="Autoplay" />
                  <button type="button" className="btn btn-sm" onClick={() => { setTime(0); setPlaying(false) }}>Reset window</button>
                </div>
                <div className="border border-line bg-bg p-2 font-mono text-[8.5px] leading-relaxed text-ink-3">
                  <p className="text-ink-2">REVIEW METADATA</p>
                  <p>camera={cameraId}</p>
                  <p>window=09:41:00–09:56:00</p>
                  <p>position={clock}</p>
                  <p>zoom={zoom.toFixed(1)}x</p>
                  <p>source=synthetic-render</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm w-full"
                  onClick={() => {
                    const blob = `SHADOW SYSTEMS — SIMULATED PLAYBACK EXPORT\ncamera: ${cameraId}\nwindow: 09:41:00-09:56:00\nposition: ${clock}\nzoom: ${zoom}x\nmarkers: ${marks.join(', ') || 'none'}\nnote: synthetic scene, no real footage.\n`
                    const url = URL.createObjectURL(new Blob([blob], { type: 'text/plain' }))
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `shadow-playback-${cameraId}-${Math.round(time)}.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download size={10} /> Export review sheet
                </button>
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          <Panel title="Playback Info" icon={PlayCircle}>
            <KeyValue
              items={[
                { k: 'Camera', v: cam?.label ?? '—' },
                { k: 'Zone', v: cam?.zone ?? '—' },
                { k: 'Position', v: clock },
                { k: 'Rate', v: `${speed}x` },
                { k: 'Zoom', v: `${zoom}x` },
                { k: 'Markers', v: String(marks.length) },
                { k: 'Incidents', v: String(incidents.length) },
                { k: 'Source', v: 'SYNTHETIC' },
              ]}
            />
          </Panel>

          <Panel title="Bookmarks" icon={Bookmark} bodyClassName="p-0" actions={<span className="badge badge-grey">{bookmarks.length}</span>}>
            <ul className="max-h-[280px] divide-y divide-line-soft overflow-y-auto">
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                  <button type="button" className="min-w-0 text-left" onClick={() => { setCameraId(b.cam); seek(b.t) }}>
                    <span className="block truncate text-[10.5px] text-ink hover:text-[var(--accent)]">{b.label}</span>
                    <span className="block font-mono text-[8.5px] text-ink-3">{b.cam} · t+{Math.floor(b.t / 60)}m{pad(b.t % 60)}s</span>
                  </button>
                  <button type="button" className="btn btn-sm !px-1.5" onClick={() => setBookmarks((x) => x.filter((y) => y.id !== b.id))}>✕</button>
                </li>
              ))}
              {bookmarks.length === 0 && <li className="px-2.5 py-3 text-[10.5px] text-ink-3">No bookmarks yet.</li>}
            </ul>
          </Panel>

          <Panel title="Markers" icon={ZoomIn} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {marks.sort((a, b) => a - b).map((m) => (
                <li key={m} className="flex items-center justify-between px-2.5 py-1">
                  <button type="button" className="mono text-[10px] text-[var(--accent)]" onClick={() => seek(m)}>t+{Math.floor(m / 60)}m{pad(Math.floor(m % 60))}s</button>
                  <button type="button" className="text-[9px] text-ink-3 hover:text-red" onClick={() => setMarks((x) => x.filter((y) => y !== m))}>remove</button>
                </li>
              ))}
              {marks.length === 0 && <li className="px-2.5 py-3 text-[10.5px] text-ink-3">No markers placed.</li>}
            </ul>
          </Panel>

          {incidents.length > 0 && (
            <Panel title="Linked Incidents" icon={Circle} bodyClassName="p-0">
              <ul className="divide-y divide-line-soft">
                {incidents.map((i) => (
                  <li key={i.id} className="px-2.5 py-1.5">
                    <p className="text-[10.5px] text-ink-2">{i.detail}</p>
                    <p className="mono text-[8px] uppercase text-ink-3">{i.type} · {i.severity}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {!cam && <Panel title="No source"><EmptyState icon={CameraIcon} title="Pick a camera" /></Panel>}
        </div>
      </div>

      <InlineAlert tone="cyan" title="Simulated archive">
        The scrubber drives a locally generated scene. Nothing here plays back recorded footage of any real place or person.
      </InlineAlert>
    </Screen>
  )
}
