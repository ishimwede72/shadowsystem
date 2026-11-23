import { useMemo, useState } from 'react'
import {
  PackageSearch, Download, Search, Lock, Unlock, FileText, Hash, ShieldCheck,
  ClipboardCheck, FolderLock, Plus, Check,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Progress, Tag, Modal, Tabs } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { Donut, PALETTE } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'

export default function Evidence() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string | null>(s.evidence[0]?.id ?? null)
  const [tab, setTab] = useState('detail')
  const [sealed, setSealed] = useState<Record<string, boolean>>({})
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ description: '', category: 'DOCUMENT', notes: '', caseId: s.cases[0]?.id ?? '' })

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.evidence.filter((e) => {
      if (t && !`${e.description} ${e.id} ${e.hash} ${e.category}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && e.status !== status) return false
      return true
    })
  }, [s.evidence, q, status])

  const record = s.evidence.find((e) => e.id === selected)
  const isSealed = (id: string) => sealed[id] ?? record?.status === 'sealed'

  const categoryDist = useMemo(() => {
    const m = new Map<string, number>()
    s.evidence.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.evidence])

  const add = () => {
    if (!form.description.trim()) return
    s.addEvidence({
      caseId: form.caseId,
      description: form.description,
      category: form.category as 'DOCUMENT',
      collected: new Date().toISOString(),
      status: 'pending',
      notes: form.notes || 'Operator-created simulated evidence record.',
    })
    setAddOpen(false)
    setForm({ description: '', category: 'DOCUMENT', notes: '', caseId: s.cases[0]?.id ?? '' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FORENSICS · EVIDENCE"
        title="Evidence Register"
        subtitle="Sealed and released simulated evidence with a simple custody workflow and exportable register."
        icon={PackageSearch}
        meta={
          <>
            <span className="badge badge-cyan">{s.evidence.length} RECORDS</span>
            <span className="badge badge-red">{s.evidence.filter((e) => e.status === 'sealed').length} SEALED</span>
            <span className="badge badge-green">{s.evidence.filter((e) => e.status === 'analyzed').length} ANALYSED</span>
            <span className="badge badge-grey">SIMULATED</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-evidence-${Date.now()}.csv`, toCSV(s.evidence.map(({ id, caseId, description, category, status, collected, hash }) => ({ id, caseId, description, category, status, collected, hash }))), 'text/csv')}><Download size={11} /> Export register</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setAddOpen(true)}><Plus size={11} /> Log evidence</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Records" value={s.evidence.length} icon={PackageSearch} accent="cyan" />
        <StatCard label="Sealed" value={s.evidence.filter((e) => e.status === 'sealed').length} icon={FolderLock} accent="red" />
        <StatCard label="Analyzed" value={s.evidence.filter((e) => e.status === 'analyzed').length} icon={ClipboardCheck} accent="green" />
        <StatCard label="Released" value={s.evidence.filter((e) => e.status === 'released').length} icon={Unlock} accent="amber" />
      </div>

      <Panel title="Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Description, id, category or hash…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-36" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any status' }, { value: 'sealed', label: 'Sealed' }, { value: 'pending', label: 'Pending' }, { value: 'analyzed', label: 'Analyzed' }, { value: 'released', label: 'Released' }]} /></div>
          <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setStatus('all') }}>Reset</button>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <Panel title="Register" icon={PackageSearch} bodyClassName="p-0">
            <div className="max-h-[50vh] overflow-auto">
              <table className="data-table min-w-[740px]">
                <thead><tr><th>ID</th><th>Category</th><th>Description</th><th>Case</th><th>Collected</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="cursor-pointer" onClick={() => setSelected(e.id)} data-selected={selected === e.id}>
                      <td className="mono text-[9.5px] text-[var(--accent)]">{e.id}</td>
                      <td><span className="badge badge-grey">{e.category}</span></td>
                      <td className="max-w-[260px] truncate text-[10.5px] text-ink-2">{e.description}</td>
                      <td className="mono text-[8.5px] text-ink-3">{s.cases.find((c) => c.id === e.caseId)?.code ?? e.caseId}</td>
                      <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{relTime(e.collected)}</td>
                      <td><StatusPill value={isSealed(e.id) ? 'sealed' : e.status} dot={false} /></td>
                      <td><span className={cn('mono text-[8px] uppercase', isSealed(e.id) ? 'text-red' : 'text-green')}>{isSealed(e.id) ? 'LOCKED' : 'OPEN'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <EmptyState icon={PackageSearch} title="No evidence matches" />}
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Category Mix" icon={PackageSearch}>
              <Donut data={categoryDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))} height={180} centerLabel="RECORDS" centerValue={String(s.evidence.length)} />
            </Panel>
            <Panel title="Custody Workflow" icon={ClipboardCheck}>
              <ol className="space-y-1.5 text-[10px] text-ink-2">
                <li><span className="badge badge-amber mr-1">1</span> Pending — collected, awaiting analysis.</li>
                <li><span className="badge badge-cyan mr-1">2</span> Analyzed — reviewed and fingerprinted.</li>
                <li><span className="badge badge-red mr-1">3</span> Sealed — locked for integrity.</li>
                <li><span className="badge badge-green mr-1">4</span> Released — cleared for demonstration export.</li>
              </ol>
              <Divider />
              <KeyValue items={[{ k: 'Total', v: String(s.evidence.length) }, { k: 'Sealed', v: String(s.evidence.filter((e) => e.status === 'sealed').length) }, { k: 'Released', v: String(s.evidence.filter((e) => e.status === 'released').length) }]} />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {record ? (
            <Panel title={record.id} subtitle={record.category} icon={PackageSearch} actions={<StatusPill value={record.status} />}>
              <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'detail', label: 'Detail' }, { id: 'custody', label: 'Custody' }]} />
              {tab === 'detail' ? (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] leading-relaxed text-ink-2">{record.description}</p>
                  <KeyValue
                    cols={1}
                    items={[
                      { k: 'Case', v: s.cases.find((c) => c.id === record.caseId)?.code ?? record.caseId },
                      { k: 'Collected', v: fmtDateTime(record.collected) },
                      { k: 'Category', v: record.category },
                      { k: 'Status', v: record.status.toUpperCase() },
                      { k: 'Seal', v: isSealed(record.id) ? 'ACTIVE' : 'OPEN' },
                    ]}
                  />
                  <div>
                    <p className="label-xs mb-1">HASH (SIM)</p>
                    <p className="break-all font-mono text-[8.5px] text-ink-3">{record.hash}</p>
                  </div>
                  <div>
                    <p className="label-xs mb-1">NOTES</p>
                    <p className="text-[10px] leading-relaxed text-ink-2">{record.notes}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="btn btn-sm flex-1" onClick={() => setSealed((x) => ({ ...x, [record.id]: !isSealed(record.id) }))}>
                      {isSealed(record.id) ? <Unlock size={10} /> : <Lock size={10} />} {isSealed(record.id) ? 'Unseal' : 'Seal'}
                    </button>
                    <button type="button" className="btn btn-sm flex-1" onClick={() => { void navigator.clipboard?.writeText(record.hash) }}><Hash size={10} /> Copy hash</button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <Doc label="CUSTODY LOG">{`EVIDENCE ${record.id}
case        : ${record.caseId}
category    : ${record.category}
collected   : ${record.collected}
status      : ${record.status}
seal        : ${isSealed(record.id) ? 'ACTIVE' : 'OPEN'}
custodian   : SHADOW SYSTEMS FORENSICS (SIM)

STEPS
01  intake recorded
02  fingerprint generated (illustrative)
03  reviewed by demo analyst
04  ${isSealed(record.id) ? 'sealed for integrity' : 'held open for analysis'}
05  awaiting release decision

No real evidence item exists.`}</Doc>
                  <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">SIMULATED</Tag><Tag tone="#f5b942">{record.status.toUpperCase()}</Tag></div>
                </div>
              )}
            </Panel>
          ) : <Panel title="Evidence"><EmptyState icon={PackageSearch} title="Select a record" /></Panel>}

          <Panel title="Register Health" icon={ShieldCheck}>
            <div className="space-y-1.5">
              {['pending', 'analyzed', 'sealed', 'released'].map((st, i) => {
                const n = s.evidence.filter((e) => e.status === st).length
                return (
                  <div key={st}>
                    <div className="flex justify-between">
                      <span className="text-[10px] capitalize text-ink-2">{st}</span>
                      <span className="mono text-[9px] text-ink-3">{n}</span>
                    </div>
                    <Progress value={(n / Math.max(1, s.evidence.length)) * 100} height={2} color={['#f5b942', '#28d8ea', '#f14e61', '#38db91'][i]} />
                  </div>
                )
              })}
            </div>
            <Divider />
            <div className="flex items-center gap-1.5 text-[9.5px] text-ink-3"><ShieldCheck size={10} /> All values generated locally.</div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional evidence">
        Records are invented for the demonstration. Nothing here refers to a real case, seizure or legal proceeding.
      </InlineAlert>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Log Simulated Evidence" subtitle="Appends a record to the demo register" icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setAddOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={add} disabled={!form.description.trim()}><Check size={11} /> Log record</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="e-desc">Description</label>
            <input id="e-desc" className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Chain-of-custody form (fictional)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={['DOCUMENT', 'DEVICE', 'COMMS', 'FINANCIAL', 'PHOTO', 'DATA'].map((c) => ({ value: c, label: c }))} />
            <Select label="Case" value={form.caseId} onChange={(v) => setForm({ ...form, caseId: v })} options={s.cases.map((c) => ({ value: c.id, label: c.code }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="e-notes">Notes</label>
            <textarea id="e-notes" className="field min-h-[70px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Analyst notes (simulated)…" />
          </div>
          <div className="flex items-center gap-1.5 border border-line bg-bg p-2 font-mono text-[9px] text-ink-3">
            <FileText size={11} /> A simulated hash will be generated on creation.
          </div>
        </div>
      </Modal>
    </Screen>
  )
}

