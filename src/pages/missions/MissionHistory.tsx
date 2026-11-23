import { useMemo, useState } from 'react'
import {
  History, Download, Search, Filter, CheckCircle2, XCircle, Square, Clock, Layers,
  FileText, RotateCcw, Eye, Trash2, TrendingUp, Award, PieChart,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, EmptyState, InlineAlert, Divider, KeyValue, Tag, Progress, Modal, Tabs, Timestamp } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, PALETTE, ChartLegend, HeatStrip } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, pad, relTime, toCSV } from '@/lib/utils'

export default function MissionHistory() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [tab, setTab] = useState('all')
  const [sel, setSel] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const finished = s.missions.filter((m) => ['completed', 'failed', 'stopped'].includes(m.status))

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return finished.filter((m) => {
      if (t && !`${m.name} ${m.code} ${m.category}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && m.status !== status) return false
      if (tab === 'completed' && m.status !== 'completed') return false
      if (tab === 'unsuccessful' && m.status === 'completed') return false
      return true
    })
  }, [finished, q, status, tab])

  const mission = s.missions.find((m) => m.id === sel)

  const successRate = Math.round((finished.filter((m) => m.status === 'completed').length / Math.max(1, finished.length)) * 100)

  const monthly = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      t: `${pad(i + 1)}`,
      completed: 2 + Math.round(Math.abs(Math.sin(i / 1.9)) * 5),
      stopped: Math.round(Math.abs(Math.cos(i / 2.4)) * 2),
    })),
    [],
  )

  const byCategory = useMemo(() => {
    const m = new Map<string, number>()
    finished.forEach((x) => m.set(x.category, (m.get(x.category) ?? 0) + 1))
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }))
  }, [finished])

  const heat = useMemo(() => Array.from({ length: 26 }, (_, i) => 1 + Math.round(Math.abs(Math.sin(i / 3)) * 8)), [])

  const exportHistory = () => {
    downloadFile('shadow-mission-history.csv', toCSV(finished.map(({ id, code, name, category, severity, status, progress, etaMinutes, startedAt, operatorId }) => ({ id, code, name, category, severity, status, progress, eta: etaMinutes, startedAt, operatorId }))), 'text/csv')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="MISSIONS · HISTORY"
        title="Mission Archive"
        subtitle="Completed, failed and stopped simulated missions with per-event records."
        icon={History}
        meta={
          <>
            <span className="badge badge-green">{finished.filter((m) => m.status === 'completed').length} COMPLETED</span>
            <span className="badge badge-red">{finished.filter((m) => m.status !== 'completed').length} UNSUCCESSFUL</span>
            <span className="badge badge-cyan">{successRate}% SUCCESS</span>
            <span className="badge badge-grey">ARCHIVE</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={exportHistory} disabled={!finished.length}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm" onClick={() => s.resetSimulation(true)}><RotateCcw size={11} /> Reset world</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Archived" value={finished.length} icon={History} accent="cyan" />
        <StatCard label="Success rate" value={`${successRate}%`} icon={Award} accent={successRate > 60 ? 'green' : 'amber'} />
        <StatCard label="Avg progress" value={`${Math.round(finished.reduce((a, m) => a + m.progress, 0) / Math.max(1, finished.length))}%`} icon={TrendingUp} accent="blue" />
        <StatCard label="Total events" value={finished.reduce((a, m) => a + m.events.length, 0)} icon={Layers} accent="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Completion Trend" icon={TrendingUp} className="lg:col-span-2" subtitle="Generated archive trend">
          <AreaTrend data={monthly} keys={[{ key: 'completed', color: PALETTE.green, label: 'Completed' }, { key: 'stopped', color: PALETTE.red, label: 'Stopped' }]} height={180} />
          <ChartLegend items={[{ label: 'Completed', color: PALETTE.green }, { label: 'Stopped', color: PALETTE.red }]} />
        </Panel>
        <Panel title="Outcomes" icon={PieChart}>
          <Donut
            data={[
              { name: 'completed', value: finished.filter((m) => m.status === 'completed').length, color: PALETTE.green },
              { name: 'stopped', value: finished.filter((m) => m.status === 'stopped').length, color: PALETTE.amber },
              { name: 'failed', value: finished.filter((m) => m.status === 'failed').length, color: PALETTE.red },
            ].filter((d) => d.value > 0)}
            height={160}
            centerLabel="ARCHIVE"
            centerValue={String(finished.length)}
          />
        </Panel>
      </div>

      <Panel title="Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mission name, code or category…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any' }, { value: 'completed', label: 'Completed' }, { value: 'stopped', label: 'Stopped' }, { value: 'failed', label: 'Failed' }]} /></div>
        </div>
      </Panel>

      <Panel title="Archive" icon={History} bodyClassName="p-0"
        actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: finished.length }, { id: 'completed', label: 'Completed', count: finished.filter((m) => m.status === 'completed').length }, { id: 'unsuccessful', label: 'Other', count: finished.filter((m) => m.status !== 'completed').length }]} />}
      >
        <div className="max-h-[46vh] overflow-auto">
          <table className="data-table min-w-[820px]">
            <thead><tr><th>Mission</th><th>Category</th><th>Severity</th><th>Status</th><th>Progress</th><th>Events</th><th>Started</th><th /></tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="cursor-pointer" data-selected={sel === m.id} onClick={() => setSel(m.id)}>
                  <td>
                    <span className="mono block text-[8px] text-[var(--accent)]">{m.code}</span>
                    <span className="block max-w-[240px] truncate text-[10px] text-ink">{m.name}</span>
                  </td>
                  <td className="text-[9px] uppercase text-ink-3">{m.category}</td>
                  <td><SeverityPill value={m.severity} /></td>
                  <td>
                    <span className="flex items-center gap-1">
                      {m.status === 'completed' ? <CheckCircle2 size={9} className="text-green" /> : m.status === 'stopped' ? <Square size={9} className="text-amber" /> : <XCircle size={9} className="text-red" />}
                      <StatusPill value={m.status} dot={false} />
                    </span>
                  </td>
                  <td><span className="flex items-center gap-1"><Progress value={m.progress} height={2} className="w-12" /><span className="mono text-[8px] text-ink-3">{m.progress}%</span></span></td>
                  <td className="mono text-[9px] text-ink-3">{m.events.length}</td>
                  <td className="mono whitespace-nowrap text-[8px] text-ink-3">{fmtDateTime(m.startedAt)}</td>
                  <td><button type="button" className="icon-btn" title="View mission record" aria-label={`View ${m.name}`} onClick={(e) => { e.stopPropagation(); setSel(m.id) }}><Eye size={9} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={History} title="Nothing archived" message="Complete or stop a mission to populate the archive." />}
        </div>
      </Panel>

      {mission && (
        <Panel title={mission.name} subtitle={`${mission.code} · archived`} icon={FileText}
          actions={<>
            <button type="button" className="btn btn-sm" onClick={() => { setSel(null) }}><XCircle size={10} /> Close</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={10} /> Delete</button>
          </>}
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusPill value={mission.status} />
                <SeverityPill value={mission.severity} />
                <span className="badge badge-grey">{mission.category}</span>
                <span className="badge badge-cyan">{mission.progress}%</span>
              </div>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-2">{mission.description}</p>
              <Divider />
              <KeyValue
                items={[
                  { k: 'Started', v: fmtDateTime(mission.startedAt) },
                  { k: 'ETA', v: `${mission.etaMinutes} min` },
                  { k: 'Operator', v: s.operators.find((o) => o.id === mission.operatorId)?.callsign ?? mission.operatorId },
                  { k: 'Modules', v: mission.modules.join(', ') },
                  { k: 'Template', v: mission.templateId ?? 'custom' },
                ]}
              />
            </div>
            <div>
              <p className="label-xs mb-1">EVENT LOG</p>
              <ol className="max-h-[180px] space-y-1 overflow-y-auto">
                {mission.events.map((e) => (
                  <li key={e.id} className="flex items-center gap-1.5 border-b border-line-soft/40 pb-0.5 text-[9.5px]">
                    <span className="mono w-10 shrink-0 text-ink-3">T+{e.at}s</span>
                    <span className="badge badge-grey shrink-0">{e.module}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-2">{e.label}</span>
                    <SeverityPill value={e.severity ?? 'low'} />
                  </li>
                ))}
              </ol>
              <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">ARCHIVED</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="By Category" icon={Layers} className="lg:col-span-2">
          <BarsTrend data={byCategory} keys={[{ key: 'value', color: PALETTE.cyan, label: 'Missions' }]} height={170} xKey="name" />
          <ChartLegend items={[{ label: 'Archived missions', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Activity Heat" icon={Clock}>
          <HeatStrip data={heat} />
          <div className="mt-1 flex justify-between font-mono text-[7.5px] text-ink-3"><span>older</span><span>recent</span></div>
          <Divider />
          <KeyValue items={[{ k: 'Peak', v: `${Math.max(...heat)} runs` }, { k: 'Buckets', v: String(heat.length) }]} />
        </Panel>
      </div>

      <Panel title="Operators" icon={Award} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Operator</th><th>Missions</th><th>Completed</th><th>Success rate</th><th>Last mission</th></tr></thead>
          <tbody>
            {s.operators.map((o) => {
              const list = finished.filter((m) => m.operatorId === o.id)
              if (list.length === 0) return null
              const comp = list.filter((m) => m.status === 'completed').length
              const rate = Math.round((comp / list.length) * 100)
              return (
                <tr key={o.id}>
                  <td className="text-[10px] text-ink">{o.callsign}</td>
                  <td className="mono text-[9.5px] text-ink-3">{list.length}</td>
                  <td className="mono text-[9.5px] text-green">{comp}</td>
                  <td className="mono text-[9.5px] text-ink-3">{rate}%</td>
                  <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(list[0].startedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <InlineAlert tone="cyan" title="Simulated archive">
        Mission records are generated and archived locally for the demonstration. No real operation was planned, approved or
        executed.
      </InlineAlert>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Archive Entry" subtitle={mission?.code} icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { if (mission) s.deleteMission(mission.id); setSel(null); setConfirmDelete(false) }}><Trash2 size={11} /> Delete</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">This removes the mission from the local store. A simulation reset re-seeds the archive.</p>
        <div className="mt-2"><Timestamp ts={new Date().toISOString()} /></div>
      </Modal>

    </Screen>
  )
}
