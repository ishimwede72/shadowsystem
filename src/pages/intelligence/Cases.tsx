import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FolderOpen, Plus, Search, Users, Building2, FileText, Download,
  ClipboardList, Kanban, Clock, Check,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, Tabs, EmptyState, InlineAlert, KeyValue, Divider, Progress, Modal, Tag, Avatar } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'

const COLUMNS: { id: 'open' | 'active' | 'cold' | 'closed'; label: string; tone: string }[] = [
  { id: 'open', label: 'Open', tone: '#28d8ea' },
  { id: 'active', label: 'Active', tone: '#38db91' },
  { id: 'cold', label: 'Cold', tone: '#f5b942' },
  { id: 'closed', label: 'Closed', tone: '#65788b' },
]

export default function Cases() {
  const [params, setParams] = useSearchParams()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [view, setView] = useState('board')
  const [selected, setSelected] = useState<string | null>(params.get('q') ?? s.cases[0]?.id ?? null)
  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'elevated' | 'critical'>('elevated')
  const [newSummary, setNewSummary] = useState('')

  useEffect(() => {
    const id = params.get('q')
    if (id) {
      setSelected(id)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.cases.filter((c) => !t || `${c.title} ${c.code} ${c.summary} ${c.lead}`.toLowerCase().includes(t))
  }, [s.cases, q])

  const posted = s.cases.find((c) => c.id === selected)
  const casePeople = s.identities.filter((i) => posted?.profileIds.includes(i.id))
  const caseOrgs = s.organizations.filter((o) => posted?.orgIds.includes(o.id))
  const caseEvidence = s.evidence.filter((e) => posted?.evidenceIds.includes(e.id))

  const create = () => {
    if (!newTitle.trim()) return
    const id = `CASE-${String(s.cases.length + 1).padStart(3, '0')}`
    s.addCase({
      title: newTitle.toUpperCase(),
      code: `OPS-${String(700 + s.cases.length)}`,
      status: 'open',
      priority: newPriority,
      lead: 'UNASSIGNED',
      opened: new Date().toISOString(),
      updated: new Date().toISOString(),
      summary: newSummary || 'Operator-created simulated case.',
      evidenceIds: [],
      profileIds: [],
      orgIds: [],
      progress: 0,
    })
    setNewOpen(false)
    setNewTitle('')
    setNewSummary('')
    setSelected(id)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · CASES"
        title="Investigation Cases"
        subtitle="A kanban board of simulated cases with linked profiles, organisations, evidence and progress."
        icon={FolderOpen}
        meta={
          <>
            <span className="badge badge-cyan">{s.cases.filter((c) => c.status === 'open' || c.status === 'active').length} LIVE</span>
            <span className="badge badge-red">{s.cases.filter((c) => c.priority === 'critical').length} CRITICAL</span>
            <span className="badge badge-grey">{s.cases.length} TOTAL</span>
            <span className="badge badge-amber">FICTIONAL</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={view} onChange={setView} tabs={[{ id: 'board', label: 'Board', icon: Kanban }, { id: 'list', label: 'List', icon: ClipboardList }]} />
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-cases-${Date.now()}.csv`, toCSV(s.cases.map(({ id, code, title, status, priority, lead, progress }) => ({ id, code, title, status, priority, lead, progress }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setNewOpen(true)}><Plus size={11} /> New case</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COLUMNS.map((c) => (
          <StatCard key={c.id} label={c.label} value={s.cases.filter((x) => x.status === c.id).length} icon={FolderOpen} accent={c.id === 'closed' ? 'cyan' : c.id === 'cold' ? 'amber' : c.id === 'open' ? 'blue' : 'green'} />
        ))}
      </div>

      <Panel title="Case Search" icon={Search}>
        <div className="relative max-w-md">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases by title, code, lead or summary…" className="field pl-7" />
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {view === 'board' ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((col) => {
                const cards = filtered.filter((c) => c.status === col.id)
                return (
                  <div key={col.id} className="panel">
                    <div className="flex items-center justify-between border-b border-line px-2 py-1.5">
                      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-ink-2">
                        <span className="h-1.5 w-1.5" style={{ background: col.tone }} /> {col.label}
                      </span>
                      <span className="mono text-[9px] text-ink-3">{cards.length}</span>
                    </div>
                    <div className="space-y-1.5 p-1.5">
                      {cards.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelected(c.id)}
                          className={cn('w-full border bg-panel p-2 text-left transition-colors', selected === c.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line hover:border-line-strong')}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="mono text-[8px] text-[var(--accent)]">{c.code}</span>
                            <SeverityPill value={c.priority} />
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-ink">{c.title}</p>
                          <p className="mt-1 truncate font-mono text-[8px] text-ink-3">{c.lead}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Progress value={c.progress} height={2} className="flex-1" color={col.tone} />
                            <span className="mono text-[8px] text-ink-3">{c.progress}%</span>
                          </div>
                        </button>
                      ))}
                      {cards.length === 0 && <p className="px-1 py-3 text-center font-mono text-[8.5px] text-ink-3">EMPTY</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Panel title="Case List" icon={ClipboardList} bodyClassName="p-0">
              <div className="max-h-[60vh] overflow-auto">
                <table className="data-table min-w-[760px]">
                  <thead><tr><th>Code</th><th>Title</th><th>Status</th><th>Priority</th><th>Lead</th><th>Opened</th><th>Progress</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} data-selected={selected === c.id}>
                        <td className="mono text-[9.5px] text-[var(--accent)]">{c.code}</td>
                        <td className="text-[10.5px] text-ink">{c.title}</td>
                        <td onClick={() => setSelected(c.id)}><StatusPill value={c.status} dot={false} /></td>
                        <td><SeverityPill value={c.priority} /></td>
                        <td className="mono text-[9px]">{c.lead}</td>
                        <td className="mono text-[8.5px] text-ink-3">{fmtDateTime(c.opened).split(' ')[0]}</td>
                        <td>
                          <span className="flex items-center gap-1.5">
                            <Progress value={c.progress} height={2} className="w-14" />
                            <span className="mono text-[8.5px] text-ink-3">{c.progress}%</span>
                          </span>
                        </td>
                        <td>
                          <select
                            className="field h-5 !px-1 text-[8.5px]"
                            value={c.status}
                            onChange={(e) => { s.updateCase(c.id, { status: e.target.value as 'open' | 'active' | 'cold' | 'closed' }); setSelected(c.id) }}
                            aria-label="Change status"
                          >
                            {COLUMNS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <EmptyState icon={FolderOpen} title="No cases match" />}
              </div>
            </Panel>
          )}

          <Panel title="Case Pipeline" icon={Clock} subtitle="Simulated case age and workload">
            <div className="space-y-1.5">
              {s.cases.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="mono w-16 shrink-0 text-[8.5px] text-[var(--accent)]">{c.code}</span>
                  <span className="w-32 shrink-0 truncate text-[10px] text-ink-2">{c.title}</span>
                  <Progress value={c.progress} height={2} className="flex-1" color={c.status === 'closed' ? '#65788b' : 'var(--accent)'} />
                  <span className="mono w-10 shrink-0 text-right text-[8.5px] text-ink-3">{relTime(c.updated)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          {posted ? (
            <>
              <Panel title={posted.title} subtitle={`${posted.code} · ${posted.id}`} icon={FolderOpen}
                actions={<SeverityPill value={posted.priority} />}
              >
                <div className="flex items-center gap-2">
                  <StatusPill value={posted.status} />
                  <span className="mono text-[9px] text-ink-3">opened {fmtDateTime(posted.opened)}</span>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-ink-2">{posted.summary}</p>
                <Divider />
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Lead', v: posted.lead },
                    { k: 'Profiles', v: String(posted.profileIds.length) },
                    { k: 'Organisations', v: String(posted.orgIds.length) },
                    { k: 'Evidence', v: String(posted.evidenceIds.length) },
                    { k: 'Progress', v: `${posted.progress}%` },
                    { k: 'Updated', v: relTime(posted.updated) },
                  ]}
                />
                <Divider label="ADVANCE CASE" />
                <div className="flex flex-wrap gap-1">
                  <button type="button" className="btn btn-sm" onClick={() => s.updateCase(posted.id, { progress: Math.min(100, posted.progress + 10) })}>+10% progress</button>
                  <button type="button" className="btn btn-sm" onClick={() => s.updateCase(posted.id, { status: 'active' })}>Activate</button>
                  <button type="button" className="btn btn-sm" onClick={() => s.updateCase(posted.id, { status: 'cold' })}>Mark cold</button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => s.updateCase(posted.id, { status: 'closed', progress: 100 })}><Check size={9} /> Close</button>
                </div>
              </Panel>

              <Panel title="Linked Profiles" icon={Users} bodyClassName="p-0">
                <ul className="max-h-[160px] divide-y divide-line-soft overflow-y-auto">
                  {casePeople.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 px-2.5 py-1.5">
                      <Avatar seed={p.avatarSeed} size={20} />
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink">{p.name}</span>
                      <SeverityPill value={p.risk} />
                    </li>
                  ))}
                  {casePeople.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No profiles linked.</li>}
                </ul>
              </Panel>

              <Panel title="Linked Organisations" icon={Building2} bodyClassName="p-0">
                <ul className="divide-y divide-line-soft">
                  {caseOrgs.map((o) => (
                    <li key={o.id} className="flex items-center justify-between px-2.5 py-1.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[10.5px] text-ink">{o.name}</span>
                        <span className="block font-mono text-[8px] text-ink-3">{o.category}</span>
                      </span>
                      <SeverityPill value={o.risk} />
                    </li>
                  ))}
                  {caseOrgs.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No organisations linked.</li>}
                </ul>
              </Panel>

              <Panel title="Evidence" icon={FileText} bodyClassName="p-0" actions={<span className="badge badge-grey">{caseEvidence.length}</span>}>
                <ul className="max-h-[150px] divide-y divide-line-soft overflow-y-auto">
                  {caseEvidence.map((e) => (
                    <li key={e.id} className="px-2.5 py-1">
                      <span className="mono text-[8px] text-[var(--accent)]">{e.category}</span>
                      <p className="truncate text-[10px] text-ink-2">{e.description}</p>
                    </li>
                  ))}
                  {caseEvidence.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No evidence attached.</li>}
                </ul>
              </Panel>
            </>
          ) : (
            <Panel title="Case Detail"><EmptyState icon={FolderOpen} title="Select a case" /></Panel>
          )}
        </div>
      </div>

      <InlineAlert tone="cyan" title="Fictional investigations">
        Cases, leads and evidence are procedurally generated and carry no real-world meaning.
      </InlineAlert>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Open New Case"
        subtitle="Adds a simulated investigation to the board"
        icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setNewOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={create} disabled={!newTitle.trim()}><Plus size={11} /> Create case</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="case-title">Case title</label>
            <input id="case-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="field" placeholder="e.g. HARBOUR LEDGER ANOMALY" />
          </div>
          <Select label="Priority" value={newPriority} onChange={(v) => setNewPriority(v as typeof newPriority)} options={[{ value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} />
          <div>
            <label className="field-label" htmlFor="case-summary">Summary</label>
            <textarea id="case-summary" value={newSummary} onChange={(e) => setNewSummary(e.target.value)} className="field min-h-[70px]" placeholder="Short fictional synopsis…" />
          </div>
          <div className="flex flex-wrap gap-1">
            <Tag tone="#28d8ea">SIMULATED</Tag><Tag>{newPriority.toUpperCase()}</Tag>
          </div>
        </div>
      </Modal>
    </Screen>
  )
}

