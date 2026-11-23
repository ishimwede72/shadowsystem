import { useMemo, useState } from 'react'
import {
  Clock, Download, Play, Pause, RotateCcw, Search, Siren, Check,
  ChevronDown, ChevronRight, CalendarClock, ListFilter, GitBranch,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, InlineAlert, Divider, KeyValue, Tag, EmptyState, Toggle, Slider, Timestamp } from '@/components/ui'
import { AreaTrend, PALETTE, ChartLegend, HeatStrip } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, pad, relTime } from '@/lib/utils'

interface Step {
  id: string
  ts: string
  label: string
  detail: string
  module: string
  severity: 'low' | 'elevated' | 'critical'
  done: boolean
}

export default function CrisisTimeline() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('all')
  const [sev, setSev] = useState('all')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(true)

  const steps = useMemo<Step[]>(() => {
    const list: Step[] = []
    s.crisisIncidents.forEach((c) => {
      c.timeline.forEach((t, i) => {
        list.push({
          id: `${c.id}-${i}`,
          ts: t.ts,
          label: t.label,
          detail: `${c.title} — ${c.description}`,
          module: 'CRISIS',
          severity: c.severity,
          done: t.done,
        })
      })
    })
    s.bus
      .filter((b) => b.topic.startsWith('CRISIS.') || b.topic.startsWith('MISSION.') || b.topic.startsWith('SYSTEM.'))
      .forEach((b) => {
        list.push({
          id: b.id,
          ts: b.ts,
          label: b.topic,
          detail: JSON.stringify(b.payload).slice(0, 120),
          module: b.topic.split('.')[0],
          severity: b.severity ?? 'low',
          done: true,
        })
      })
    return list.sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
  }, [s.crisisIncidents, s.bus])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return steps.filter((st) => {
      if (t && !`${st.label} ${st.detail}`.toLowerCase().includes(t)) return false
      if (sel !== 'all' && st.module !== sel) return false
      if (sev !== 'all' && st.severity !== sev) return false
      if (!showDone && !st.done) return false
      return true
    })
  }, [steps, q, sel, sev, showDone])

  const modules = Array.from(new Set(steps.map((x) => x.module)))

  const buckets = useMemo(() => {
    const m = new Map<string, number>()
    filtered.forEach((st) => {
      const key = st.ts.slice(11, 16)
      m.set(key, (m.get(key) ?? 0) + 1)
    })
    return Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-22)
      .map(([name, value]) => ({ name, value }))
  }, [filtered])

  const series = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        t: `${pad(i * 3)}:00`,
        crisis: Math.round(2 + Math.abs(Math.sin(i / 2.5)) * 5),
        missions: Math.round(1 + Math.abs(Math.cos(i / 3.3)) * 4),
      })),
    [],
  )

  const exportTimeline = () => {
    const rows = filtered.map(({ id, ts, label, module, severity, done }) => ({ id, ts, label, module, severity, done }))
    downloadFile(`shadow-crisis-timeline-${Date.now()}.csv`, [ 'id,ts,label,module,severity,done', ...rows.map((r) => `${r.id},${r.ts},${r.label.replace(/,/g, ';')},${r.module},${r.severity},${r.done}`) ].join('\n'), 'text/csv')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRISIS · TIMELINE"
        title="Crisis Timeline"
        subtitle="Replay incident steps and bus events chronologically. The scrubber controls playback of local data only."
        icon={Clock}
        meta={
          <>
            <span className="badge badge-cyan">{steps.length} EVENTS</span>
            <span className="badge badge-red">{steps.filter((x) => x.severity === 'critical').length} CRITICAL</span>
            <span className="badge badge-grey">{modules.length} SOURCES</span>
            <span className="badge badge-amber">RECONSTRUCTION</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={exportTimeline}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm" onClick={() => { setPlaying(false); setSel('all'); setSev('all'); setQ('') }}><RotateCcw size={11} /> Reset</button>
            <button type="button" className={cn('btn btn-sm', playing && 'btn-primary')} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={11} /> : <Play size={11} />} {playing ? 'Pause' : 'Replay'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Events" value={steps.length} icon={Clock} accent="cyan" />
        <StatCard label="First" value={steps.length ? relTime(steps[steps.length - 1].ts) : '—'} icon={CalendarClock} accent="blue" />
        <StatCard label="Latest" value={steps.length ? relTime(steps[0].ts) : '—'} icon={Siren} accent="red" />
        <StatCard label="Sources" value={modules.length} icon={GitBranch} accent="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Event Volume" icon={ListFilter} className="lg:col-span-2" subtitle="Events per minute bucket">
          <AreaTrend data={series} keys={[{ key: 'crisis', color: PALETTE.red, label: 'Crisis' }, { key: 'missions', color: PALETTE.blue, label: 'Missions' }]} height={180} />
          <ChartLegend items={[{ label: 'Crisis events', color: PALETTE.red }, { label: 'Mission events', color: PALETTE.blue }]} />
        </Panel>
        <Panel title="Playback" icon={playing ? Pause : Play}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-xs">PLAYBACK</span>
              <StatusPill value={playing ? 'active' : 'paused'} label={playing ? 'RUNNING' : 'STOPPED'} />
            </div>
            <Slider label="Speed" min={0.5} max={4} step={0.5} value={speed} onChange={setSpeed} suffix="×" />
            <Toggle label="Include completed steps" checked={showDone} onChange={setShowDone} />
            <Divider />
            <KeyValue
              items={[
                { k: 'Filtered', v: String(filtered.length) },
                { k: 'All events', v: String(steps.length) },
                { k: 'Speed', v: `${speed}×` },
                { k: 'Loop', v: 'OFF' },
              ]}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Event label or detail…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">SOURCE</p><Select className="w-32" value={sel} onChange={setSel} options={[{ value: 'all', label: 'All sources' }, ...modules.map((m) => ({ value: m, label: m }))]} /></div>
          <div><p className="label-xs mb-1">SEVERITY</p><Select className="w-32" value={sev} onChange={setSev} options={[{ value: 'all', label: 'Any' }, { value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} /></div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <Panel title="Event Stream" icon={Clock} bodyClassName="p-0"
          actions={<span className="mono text-[8.5px] text-ink-3">{filtered.length} of {steps.length}</span>}
        >
          <ol className="relative max-h-[52vh] overflow-y-auto pl-6 pr-2.5 py-2">
            <span className="absolute left-3 top-2 bottom-2 w-px bg-line" />
            {filtered.slice(0, 120).map((st) => {
              const open = expanded === st.id
              return (
                <li key={st.id} className="relative py-1.5">
                  <span className={cn('absolute -left-3.5 top-2.5 h-2 w-2 rounded-full border', st.severity === 'critical' ? 'border-red bg-red/30' : st.severity === 'elevated' ? 'border-amber bg-amber/20' : 'border-green bg-green/20')} />
                  <button type="button" onClick={() => setExpanded(open ? null : st.id)} className="flex w-full items-start justify-between gap-2 text-left">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="mono text-[8.5px] text-ink-3">{fmtDateTime(st.ts)}</span>
                        <span className="badge badge-grey">{st.module}</span>
                        <SeverityPill value={st.severity} />
                        {st.done && <span className="mono text-[8px] text-green">DONE</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-ink">{st.label}</span>
                    </span>
                    {open ? <ChevronDown size={11} className="mt-1 shrink-0 text-ink-3" /> : <ChevronRight size={11} className="mt-1 shrink-0 text-ink-3" />}
                  </button>
                  {open && (
                    <div className="mt-1.5 border border-line bg-bg p-2">
                      <p className="mono whitespace-pre-wrap break-words text-[8.5px] leading-relaxed text-ink-2">{st.detail}</p>
                      <div className="mt-1 flex gap-1"><Tag tone="#28d8ea">LOCAL EVENT</Tag><Tag tone="#65788b">{st.id}</Tag></div>
                    </div>
                  )}
                </li>
              )
            })}
            {filtered.length === 0 && <EmptyState icon={Clock} title="No events match" message="Clear the filters to see the full timeline." />}
          </ol>
        </Panel>

        <div className="space-y-3">
          <Panel title="Event Density" icon={CalendarClock}>
            <HeatStrip data={buckets.map((b) => b.value)} />
            <div className="mt-1 flex justify-between font-mono text-[7.5px] text-ink-3"><span>{buckets[0]?.name ?? '--:--'}</span><span>{buckets[buckets.length - 1]?.name ?? '--:--'}</span></div>
            <Divider label="BURSTS" />
            <ul className="space-y-1">
              {buckets.slice().sort((a, b) => b.value - a.value).slice(0, 4).map((b) => (
                <li key={b.name} className="flex items-center justify-between text-[10px]"><span className="text-ink-2">{b.name}</span><span className="mono text-[9px] text-ink-3">{b.value} events</span></li>
              ))}
            </ul>
          </Panel>

          <Panel title="Step States" icon={Check}>
            <div className="space-y-1.5">
              {['monitoring', 'escalated', 'contained', 'resolved'].map((st) => {
                const n = s.crisisIncidents.filter((c) => c.status === st).length
                return (
                  <div key={st} className="flex items-center justify-between">
                    <StatusPill value={st} dot={false} />
                    <span className="mono text-[9px] text-ink-3">{n}</span>
                  </div>
                )
              })}
            </div>
            <Divider />
            <Timestamp ts={s.crisisIncidents[0]?.updated ?? new Date().toISOString()} />
          </Panel>

          <Panel title="Legend" icon={GitBranch}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li>• CRISIS — incident steps</li>
              <li>• MISSION — mission runner events</li>
              <li>• SYSTEM — boot, reset, preferences</li>
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Reconstructed timeline">
        The stream merges generated incident steps with local event-bus history. It is a demonstration of chronology, not an
        audit log of real activity.
      </InlineAlert>
    </Screen>
  )
}
