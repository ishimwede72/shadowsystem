import { useMemo, useState } from 'react'
import {
  Clock, Download, Filter, Search, ZoomIn, ZoomOut, Play, Pause, Plus,
  ArrowRight, FileText, ShieldAlert,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, SeverityPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tag, Modal } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, toCSV } from '@/lib/utils'
import { PALETTE } from '@/components/charts'

const CATEGORIES = ['FILE_ACCESS', 'AUTH', 'NETWORK', 'EXFIL', 'DEVICE', 'COMMS', 'EVIDENCE'] as const

export default function Timeline() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [sev, setSev] = useState('all')
  const [zoom, setZoom] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [cursor, setCursor] = useState(70)
  const [open, setOpen] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState<string>('AUTH')
  const [newSev, setNewSev] = useState<'low' | 'elevated' | 'critical'>('low')
  const [selected, setSelected] = useState<string | null>(s.forensicTimeline[0]?.id ?? null)

  const events = useMemo(() => {
    const t = q.toLowerCase()
    return [...s.forensicTimeline]
      .filter((e) => {
        if (t && !`${e.description} ${e.category} ${e.evidenceId}`.toLowerCase().includes(t)) return false
        if (cat !== 'all' && e.category !== cat) return false
        if (sev !== 'all' && e.severity !== sev) return false
        return true
      })
      .sort((a, b) => +new Date(a.ts) - +new Date(b.ts))
  }, [s.forensicTimeline, q, cat, sev])

  const times = events.map((e) => +new Date(e.ts))
  const min = Math.min(...times, Date.now())
  const max = Math.max(...times, Date.now())
  const span = Math.max(1, max - min)

  const add = () => {
    if (!newDesc.trim()) return
    s.addTimelineEvent({
      ts: new Date().toISOString(),
      category: newCat,
      evidenceId: s.evidence[0]?.id ?? 'EV-000',
      caseId: s.forensicsCases[0]?.id ?? 'LAB-001',
      description: newDesc,
      severity: newSev,
    })
    setOpen(false)
    setNewDesc('')
  }

  const event = s.forensicTimeline.find((e) => e.id === selected)

  const density = useMemo(() => {
    const bins = new Array(24).fill(0)
    events.forEach((e) => {
      const idx = Math.min(23, Math.floor(((+new Date(e.ts) - min) / span) * 24))
      bins[idx] += 1
    })
    return bins
  }, [events, min, span])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FORENSICS · RECONSTRUCTION"
        title="Forensic Timeline"
        subtitle="Ordered simulated artefacts plotted on a zoomable timeline to reconstruct a demonstration incident."
        icon={Clock}
        meta={
          <>
            <span className="badge badge-cyan">{events.length} EVENTS</span>
            <span className="badge badge-red">{events.filter((e) => e.severity === 'critical').length} CRITICAL</span>
            <span className="badge badge-grey">ZOOM {(zoom * 100).toFixed(0)}%</span>
            <span className="badge badge-amber">SIMULATED</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={11} /> : <Play size={11} />} {playing ? 'Pause' : 'Play'}</button>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-timeline-${Date.now()}.csv`, toCSV(events.map(({ id, ts, category, severity, description, evidenceId }) => ({ id, ts, category, severity, description, evidenceId }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(true)}><Plus size={11} /> Add event</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Events" value={s.forensicTimeline.length} icon={Clock} accent="cyan" />
        <StatCard label="Critical" value={s.forensicTimeline.filter((e) => e.severity === 'critical').length} icon={ShieldAlert} accent="red" />
        <StatCard label="Categories" value={new Set(s.forensicTimeline.map((e) => e.category)).size} icon={Filter} accent="blue" />
        <StatCard label="Coverage" value={`${Math.max(1, Math.round(span / 3_600_000))}h`} icon={Clock} accent="amber" />
      </div>

      <Panel title="Timeline Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Description or evidence id…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">CATEGORY</p><Select className="w-36" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} /></div>
          <div><p className="label-xs mb-1">SEVERITY</p><Select className="w-28" value={sev} onChange={setSev} options={[{ value: 'all', label: 'Any' }, { value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} /></div>
          <div className="ml-auto flex items-center gap-1 pb-0.5">
            <button type="button" className="icon-btn" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><ZoomOut size={12} /></button>
            <span className="mono w-10 text-center text-[9px] text-ink-3">{(zoom * 100).toFixed(0)}%</span>
            <button type="button" className="icon-btn" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}><ZoomIn size={12} /></button>
          </div>
        </div>
      </Panel>

      <Panel title="Reconstruction" icon={Clock} bodyClassName="p-0" subtitle="Density histogram and event rail">
        <div className="border-b border-line bg-[#0a1117] p-2">
          <div className="flex h-16 items-end gap-[2px]">
            {density.map((n, i) => (
              <span key={i} title={`Window ${i}: ${n} events`} className="flex-1" style={{ height: `${Math.max(4, (n / Math.max(1, ...density)) * 100)}%`, background: n > 4 ? PALETTE.red : n > 2 ? PALETTE.amber : PALETTE.cyan, opacity: 0.8 }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[8px] text-ink-3">
            <span>{fmtDateTime(new Date(min))}</span>
            <span>{fmtDateTime(new Date(max))}</span>
          </div>
        </div>

        <div className="relative max-h-[46vh] overflow-y-auto" style={{ zoom: `1` }}>
          {playing && (
            <span className="sticky top-0 z-10 flex items-center gap-1 border-l-2 border-[var(--accent)] bg-[#0c2830] px-2 py-0.5 font-mono text-[8.5px] text-[#7ff0fb]">
              ▶ Playback cursor at {cursor}% · SIMULATION
            </span>
          )}
          <ol className="relative ml-4 border-l border-line py-2">
            {events.map((e) => {
              const tone = e.severity === 'critical' ? PALETTE.red : e.severity === 'elevated' ? PALETTE.amber : PALETTE.green
              return (
                <li key={e.id} className="relative px-3 py-1.5">
                  <span className="absolute -left-[4.5px] top-3 h-2 w-2 rounded-full border border-bg" style={{ background: tone }} />
                  <button type="button" onClick={() => setSelected(e.id)} className={cn('w-full text-left', selected === e.id && 'bg-[var(--accent-soft)]')}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mono text-[8.5px] text-ink-3" style={{ fontSize: `${8.5 * zoom}px` }}>{fmtDateTime(e.ts)}</span>
                      <SeverityPill value={e.severity} />
                      <span className="badge badge-grey">{e.category}</span>
                      <span className="mono text-[8px] text-ink-3">{e.evidenceId}</span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-ink-2" style={{ fontSize: `${10.5 * Math.min(1.4, zoom)}px` }}>{e.description}</p>
                  </button>
                </li>
              )
            })}
          </ol>
          {events.length === 0 && <EmptyState icon={Clock} title="No events match" message="Adjust filters or add a synthetic event." />}
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-[#0d151d] px-2 py-1.5">
          <button type="button" className="btn btn-sm !px-1.5" title={playing ? 'Pause replay' : 'Play replay'} aria-label={playing ? 'Pause replay' : 'Play replay'} onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={9} /> : <Play size={9} />}</button>
          <input type="range" min={0} max={100} value={cursor} onChange={(e) => setCursor(Number(e.target.value))} className="h-1 flex-1 accent-[var(--accent)]" aria-label="Playback cursor" />
          <span className="mono text-[8.5px] text-ink-3">{cursor}%</span>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <Panel title="Event Table" icon={FileText} bodyClassName="p-0">
          <div className="max-h-[36vh] overflow-auto">
            <table className="data-table min-w-[700px]">
              <thead><tr><th>Timestamp</th><th>Category</th><th>Severity</th><th>Evidence</th><th>Description</th></tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="cursor-pointer" onClick={() => setSelected(e.id)} data-selected={selected === e.id}>
                    <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{fmtDateTime(e.ts)}</td>
                    <td><span className="badge badge-grey">{e.category}</span></td>
                    <td><SeverityPill value={e.severity} /></td>
                    <td className="mono text-[8.5px] text-[var(--accent)]">{e.evidenceId}</td>
                    <td className="text-[10px] text-ink-2">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Event Detail" icon={FileText}>
          {event ? (
            <div className="space-y-2">
              <div>
                <p className="label-xs">{event.id}</p>
                <p className="text-[11px] text-ink">{event.description}</p>
              </div>
              <KeyValue
                cols={1}
                items={[
                  { k: 'Timestamp', v: fmtDateTime(event.ts) },
                  { k: 'Category', v: event.category },
                  { k: 'Severity', v: event.severity.toUpperCase() },
                  { k: 'Evidence', v: event.evidenceId },
                  { k: 'Case', v: event.caseId },
                  { k: 'Order', v: `${events.findIndex((x) => x.id === event.id) + 1} of ${events.length}` },
                ]}
              />
              <div className="flex items-center gap-1 font-mono text-[8.5px] text-ink-3">
                {events.slice(Math.max(0, events.findIndex((x) => x.id === event.id) - 1), events.findIndex((x) => x.id === event.id) + 2).map((x, i) => (
                  <span key={x.id} className="flex items-center gap-1">
                    {i > 0 && <ArrowRight size={8} />}
                    <span className={cn('truncate', x.id === event.id ? 'text-[var(--accent)]' : '')}>{x.category}</span>
                  </span>
                ))}
              </div>
              <Divider />
              <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">RECONSTRUCTED</Tag><Tag tone="#f5b942">{event.severity.toUpperCase()}</Tag></div>
            </div>
          ) : <EmptyState icon={Clock} title="Select an event" />}
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Simulated reconstruction">
        The timeline orders generated artefacts. It does not represent a real incident, investigation or evidence chain.
      </InlineAlert>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Timeline Event" subtitle="Appends a synthetic artefact to the reconstruction" icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={add} disabled={!newDesc.trim()}><Plus size={11} /> Add event</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="t-desc">Description</label>
            <input id="t-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="field" placeholder="e.g. Transfer record modified" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select label="Category" value={newCat} onChange={setNewCat} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Select label="Severity" value={newSev} onChange={(v) => setNewSev(v as typeof newSev)} options={[{ value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} />
          </div>
          <p className="font-mono text-[9px] text-ink-3">Timestamp is set to now (simulated).</p>
        </div>
      </Modal>
    </Screen>
  )
}

