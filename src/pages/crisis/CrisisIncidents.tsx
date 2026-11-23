import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldAlert, Plus, Search, Download, Siren, ChevronRight, Check, Activity,
  TriangleAlert, Clock, Radio, ArrowUpRight,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tabs, Modal, Tag, Progress, CountUp } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'
import { PALETTE } from '@/components/charts'

const STEPS = ['monitoring', 'escalated', 'contained', 'resolved'] as const

export default function CrisisIncidents() {
  const [params, setParams] = useSearchParams()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [sev, setSev] = useState('all')
  const [status, setStatus] = useState('all')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState<string | null>(params.get('q') ?? s.crisisIncidents[0]?.id ?? null)
  const [newOpen, setNewOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<'low' | 'elevated' | 'critical'>('elevated')
  const [desc, setDesc] = useState('')
  const [affected, setAffected] = useState<string[]>([])

  useEffect(() => {
    const id = params.get('q')
    if (id) { setSelected(id); setParams({}, { replace: true }) }
  }, [params, setParams])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.crisisIncidents.filter((c) => {
      if (t && !`${c.title} ${c.description} ${c.id}`.toLowerCase().includes(t)) return false
      if (sev !== 'all' && c.severity !== sev) return false
      if (status !== 'all' && c.status !== status) return false
      if (tab === 'active' && c.status === 'resolved') return false
      if (tab === 'escalated' && c.status !== 'escalated') return false
      return true
    })
  }, [s.crisisIncidents, q, sev, status, tab])

  const inc = s.crisisIncidents.find((c) => c.id === selected)

  const advance = () => {
    if (!inc) return
    const idx = STEPS.indexOf(inc.status)
    const next = STEPS[Math.min(STEPS.length - 1, idx + 1)]
    s.updateCrisisIncident(inc.id, {
      status: next,
      timeline: inc.timeline.map((t, i) => ({ ...t, done: i <= Math.min(inc.timeline.length - 1, idx + 1) ? true : t.done })),
    })
    s.logActivity({ module: 'crisis', actor: 'OPERATOR', action: `Incident ${inc.id} moved to ${next}`, detail: inc.title, level: next === 'resolved' ? 'success' : 'warning' })
  }

  const create = () => {
    if (!title.trim()) return
    s.addCrisisIncident({
      title,
      severity,
      status: 'monitoring',
      affected,
      description: desc || 'Operator-created simulated crisis incident.',
      timeline: [
        { ts: new Date().toISOString(), label: 'Incident reported', done: true },
        { ts: new Date().toISOString(), label: 'Team assigned', done: false },
        { ts: new Date().toISOString(), label: 'Containment plan drafted', done: false },
        { ts: new Date().toISOString(), label: 'Resolved', done: false },
      ],
    })
    setNewOpen(false)
    setTitle('')
    setDesc('')
    setAffected([])
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRISIS · INCIDENTS"
        title="Incident Response"
        subtitle="Track simulated incidents through monitoring, escalation, containment and resolution."
        icon={ShieldAlert}
        meta={
          <>
            <span className="badge badge-red">{s.crisisIncidents.filter((c) => c.status === 'escalated').length} ESCALATED</span>
            <span className="badge badge-amber">{s.crisisIncidents.filter((c) => c.status === 'monitoring').length} MONITORING</span>
            <span className="badge badge-green">{s.crisisIncidents.filter((c) => c.status === 'resolved').length} RESOLVED</span>
            <span className="badge badge-grey">SYNTHETIC</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-crisis-${Date.now()}.csv`, toCSV(s.crisisIncidents.map(({ id, title, severity, status, affected, reported }) => ({ id, title, severity, status, affected: affected.join('|'), reported }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setNewOpen(true)}><Plus size={11} /> New incident</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={s.crisisIncidents.length} icon={ShieldAlert} accent="cyan" />
        <StatCard label="Escalated" value={s.crisisIncidents.filter((c) => c.status === 'escalated').length} icon={TriangleAlert} accent="red" />
        <StatCard label="Contained" value={s.crisisIncidents.filter((c) => c.status === 'contained').length} icon={Check} accent="green" />
        <StatCard label="Mean progress" value={`${Math.round(s.crisisIncidents.reduce((a, c) => a + (c.timeline.filter((t) => t.done).length / Math.max(1, c.timeline.length)) * 100, 0) / Math.max(1, s.crisisIncidents.length))}%`} icon={Activity} accent="amber" />
      </div>

      <Panel title="Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Incident title, id or description…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">SEVERITY</p><Select className="w-28" value={sev} onChange={setSev} options={[{ value: 'all', label: 'Any' }, { value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} /></div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any' }, { value: 'monitoring', label: 'Monitoring' }, { value: 'escalated', label: 'Escalated' }, { value: 'contained', label: 'Contained' }, { value: 'resolved', label: 'Resolved' }]} /></div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <Panel title="Incident Board" icon={ShieldAlert} bodyClassName="p-0"
          actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: s.crisisIncidents.length }, { id: 'active', label: 'Active' }, { id: 'escalated', label: 'Escalated' }]} />}
        >
          <div className="max-h-[52vh] overflow-auto">
            <table className="data-table min-w-[700px]">
              <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Affected</th><th>Reported</th><th>Stage</th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)} data-selected={selected === c.id}>
                    <td className="mono text-[9px] text-[var(--accent)]">{c.id}</td>
                    <td className="max-w-[220px] truncate text-[10.5px] text-ink">{c.title}</td>
                    <td><SeverityPill value={c.severity} /></td>
                    <td><StatusPill value={c.status} dot={false} /></td>
                    <td className="max-w-[170px] truncate text-[9px] text-ink-3">{c.affected.join(', ') || '—'}</td>
                    <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(c.reported)}</td>
                    <td>
                      <span className="flex items-center gap-1">
                        {STEPS.map((st, i) => (
                          <span key={st} className={cn('h-1 w-4', STEPS.indexOf(c.status) >= i ? 'bg-[var(--accent)]' : 'bg-[#1c2a36]')} />
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={ShieldAlert} title="No incidents match" message="Adjust the filters or log a new simulated incident." />}
          </div>
        </Panel>

        <div className="space-y-3">
          {inc ? (
            <>
              <Panel title={inc.title} subtitle={inc.id} icon={ShieldAlert} actions={<SeverityPill value={inc.severity} />}>
                <div className="flex items-center justify-between">
                  <StatusPill value={inc.status} />
                  <span className="mono text-[8.5px] text-ink-3">reported {relTime(inc.reported)}</span>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-ink-2">{inc.description}</p>
                <Divider label="AFFECTED" />
                <div className="flex flex-wrap gap-1">
                  {inc.affected.length ? inc.affected.map((a) => <Tag key={a} tone="#f5b942">{a}</Tag>) : <span className="text-[10px] text-ink-3">No assets listed.</span>}
                </div>
                <Divider label="TIMELINE" />
                <ol className="space-y-1.5">
                  {inc.timeline.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', t.done ? 'border-green bg-[#0a2a20] text-green' : 'border-line text-ink-3')}>
                        {t.done ? <Check size={7} /> : <span className="h-1 w-1 rounded-full bg-ink-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[10px]', t.done ? 'text-ink' : 'text-ink-3')}>{t.label}</span>
                        <span className="mono text-[7.5px] text-ink-3">{fmtDateTime(t.ts)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <button type="button" className="btn btn-sm w-full mt-2" onClick={advance} disabled={inc.status === 'resolved'}>
                  <ChevronRight size={10} /> {inc.status === 'resolved' ? 'Resolved' : `Advance to ${STEPS[STEPS.indexOf(inc.status) + 1]}`}
                </button>
                <button type="button" className="btn btn-sm btn-danger w-full mt-1.5" onClick={() => s.enterEmergency(inc.id)}><Siren size={10} /> Enter emergency mode</button>
              </Panel>

              <Panel title="Containment" icon={Activity}>
                <div className="flex items-center justify-between">
                  <span className="label-xs">PROGRESS</span>
                  <span className="mono text-[9.5px] text-ink-3"><CountUp value={(inc.timeline.filter((t) => t.done).length / Math.max(1, inc.timeline.length)) * 100} />%</span>
                </div>
                <Progress value={(inc.timeline.filter((t) => t.done).length / Math.max(1, inc.timeline.length)) * 100} height={4} color={inc.severity === 'critical' ? PALETTE.red : PALETTE.amber} />
                <Divider />
                <KeyValue
                  items={[
                    { k: 'Status', v: inc.status.toUpperCase() },
                    { k: 'Severity', v: inc.severity.toUpperCase() },
                    { k: 'Steps done', v: `${inc.timeline.filter((t) => t.done).length}/${inc.timeline.length}` },
                    { k: 'Updated', v: relTime(inc.updated) },
                  ]}
                />
              </Panel>
            </>
          ) : <Panel title="Incident"><EmptyState icon={ShieldAlert} title="Select an incident" /></Panel>}

          <Panel title="Response Roles" icon={Radio}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Monitoring — watch and gather context.</li>
              <li>• Escalated — senior review required.</li>
              <li>• Contained — impact limited (simulated).</li>
              <li>• Resolved — closed for the demo.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Incident Notes" icon={Clock} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Incident</th><th>Steps complete</th><th>Progress</th><th>Last update</th><th>Status</th></tr></thead>
          <tbody>
            {s.crisisIncidents.map((c) => (
              <tr key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                <td className="mono text-[9px] text-[var(--accent)]">{c.id}</td>
                <td className="mono text-[10px]">{c.timeline.filter((t) => t.done).length}/{c.timeline.length}</td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <Progress value={(c.timeline.filter((t) => t.done).length / Math.max(1, c.timeline.length)) * 100} height={2} className="w-16" />
                    <span className="mono text-[8.5px] text-ink-3">{Math.round((c.timeline.filter((t) => t.done).length / Math.max(1, c.timeline.length)) * 100)}%</span>
                  </span>
                </td>
                <td className="mono text-[8.5px] text-ink-3">{relTime(c.updated)}</td>
                <td><StatusPill value={c.status} dot={false} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <InlineAlert tone="amber" title="Fictional crises">
        Every incident is generated for the demonstration. No real emergency, breach or outage has occurred and no response
        service is involved.
      </InlineAlert>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Log Crisis Incident"
        subtitle="Adds a simulated incident to the board"
        icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setNewOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={create} disabled={!title.trim()}><Plus size={11} /> Create incident</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="ci-title">Title</label>
            <input id="ci-title" value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="e.g. SIMULATED GRID FLUCTUATION" />
          </div>
          <Select label="Severity" value={severity} onChange={(v) => setSeverity(v as typeof severity)} options={[{ value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} />
          <div>
            <label className="field-label" htmlFor="ci-desc">Description</label>
            <textarea id="ci-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className="field min-h-[80px]" placeholder="Short fictional description…" />
          </div>
          <div>
            <p className="field-label">Affected infrastructure</p>
            <div className="grid max-h-[120px] grid-cols-2 gap-1 overflow-y-auto">
              {s.infrastructure.map((i) => (
                <button key={i.id} type="button" onClick={() => setAffected((a) => (a.includes(i.name) ? a.filter((x) => x !== i.name) : [...a, i.name]))}
                  className={cn('border px-1.5 py-1 text-left text-[9px]', affected.includes(i.name) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-ink' : 'border-line text-ink-3')}
                >
                  {i.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><ArrowUpRight size={9} /> A four-step timeline is created automatically.</div>
        </div>
      </Modal>
    </Screen>
  )
}
