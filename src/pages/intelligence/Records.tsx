import { useMemo, useState } from 'react'
import {
  FileText, Search, Download, Lock, Fingerprint, ShieldCheck,
  FileWarning, Database, ScanLine,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, Tabs, EmptyState, InlineAlert, KeyValue, Divider, Progress, Tag, Modal } from '@/components/ui'
import { Donut, PALETTE, HeatStrip } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'

export default function Records() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [caseId, setCaseId] = useState('all')
  const [cat, setCat] = useState('all')
  const [tab, setTab] = useState('evidence')
  const [detail, setDetail] = useState<string | null>(null)

  const categories = useMemo(() => Array.from(new Set(s.evidence.map((e) => e.category))), [s.evidence])

  const evidence = useMemo(() => {
    const t = q.toLowerCase()
    return s.evidence.filter((e) => {
      if (t && !`${e.description} ${e.id} ${e.hash}`.toLowerCase().includes(t)) return false
      if (caseId !== 'all' && e.caseId !== caseId) return false
      if (cat !== 'all' && e.category !== cat) return false
      return true
    })
  }, [s.evidence, q, caseId, cat])

  const record = s.evidence.find((e) => e.id === detail)

  const catDist = useMemo(() => {
    const m = new Map<string, number>()
    s.evidence.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.evidence])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · RECORDS"
        title="Investigation Records"
        subtitle="Evidence catalogue and case documentation with simulated chain-of-custody hashes."
        icon={FileText}
        meta={
          <>
            <span className="badge badge-cyan">{s.evidence.length} RECORDS</span>
            <span className="badge badge-grey">{s.cases.length} CASES</span>
            <span className="badge badge-amber">{s.evidence.filter((e) => e.status === 'sealed').length} SEALED</span>
            <span className="badge badge-blue">SYNTHETIC</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadFile(`shadow-records-${Date.now()}.csv`, toCSV(s.evidence.map(({ id, caseId, description, category, collected, status, hash }) => ({ id, caseId, description, category, collected, status, hash }))), 'text/csv')}
          >
            <Download size={11} /> Export register
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total records" value={s.evidence.length} icon={FileText} accent="cyan" />
        <StatCard label="Analyzed" value={s.evidence.filter((e) => e.status === 'analyzed').length} icon={ScanLine} accent="green" />
        <StatCard label="Pending" value={s.evidence.filter((e) => e.status === 'pending').length} icon={FileWarning} accent="amber" />
        <StatCard label="Sealed" value={s.evidence.filter((e) => e.status === 'sealed').length} icon={Lock} accent="red" />
      </div>

      <Panel title="Record Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Description, id or hash…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">CASE</p><Select className="w-44" value={caseId} onChange={setCaseId} options={[{ value: 'all', label: 'All cases' }, ...s.cases.map((c) => ({ value: c.id, label: `${c.code} · ${c.title.slice(0, 18)}` }))]} /></div>
          <div><p className="label-xs mb-1">CATEGORY</p><Select className="w-32" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All' }, ...categories.map((c) => ({ value: c, label: c }))]} /></div>
          <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setCat('all'); setCaseId('all') }}>Reset</button>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Evidence Register" icon={Database} bodyClassName="p-0"
          actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'evidence', label: 'Evidence', count: evidence.length }, { id: 'cases', label: 'Cases', count: s.cases.length }]} />}
        >
          {tab === 'evidence' ? (
            <div className="max-h-[56vh] overflow-auto">
              <table className="data-table min-w-[760px]">
                <thead><tr><th>ID</th><th>Category</th><th>Description</th><th>Case</th><th>Collected</th><th>Hash</th><th>Status</th></tr></thead>
                <tbody>
                  {evidence.map((e) => (
                    <tr key={e.id} className="cursor-pointer" onClick={() => setDetail(e.id)}>
                      <td className="mono text-[9.5px] text-[var(--accent)]">{e.id}</td>
                      <td><span className="badge badge-grey">{e.category}</span></td>
                      <td className="max-w-[240px] truncate text-[10.5px] text-ink-2">{e.description}</td>
                      <td className="mono text-[9px] text-ink-3">{s.cases.find((c) => c.id === e.caseId)?.code ?? e.caseId}</td>
                      <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{relTime(e.collected)}</td>
                      <td className="mono text-[8.5px] text-ink-3">{e.hash.slice(0, 12)}…</td>
                      <td><StatusPill value={e.status} dot={false} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {evidence.length === 0 && <EmptyState icon={FileText} title="No records match" />}
            </div>
          ) : (
            <div className="max-h-[56vh] overflow-auto">
              <table className="data-table">
                <thead><tr><th>Code</th><th>Title</th><th>Status</th><th>Priority</th><th className="text-right">Evidence</th><th>Progress</th></tr></thead>
                <tbody>
                  {s.cases.map((c) => (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setCaseId(c.id)}>
                      <td className="mono text-[9.5px] text-[var(--accent)]">{c.code}</td>
                      <td className="text-[10.5px] text-ink">{c.title}</td>
                      <td><StatusPill value={c.status} dot={false} /></td>
                      <td className="mono text-[9px] uppercase text-ink-2">{c.priority}</td>
                      <td className="mono text-right text-[10px]">{c.evidenceIds.length}</td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          <Progress value={c.progress} height={2} className="w-16" />
                          <span className="mono text-[9px] text-ink-3">{c.progress}%</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Custody Overview" icon={ShieldCheck}>
            <KeyValue
              items={[
                { k: 'Records', v: String(s.evidence.length) },
                { k: 'Categories', v: String(categories.length) },
                { k: 'Cases covered', v: String(new Set(s.evidence.map((e) => e.caseId)).size) },
                { k: 'Released', v: String(s.evidence.filter((e) => e.status === 'released').length) },
                { k: 'Integrity', v: 'SHA-256 (sim)' },
                { k: 'Storage', v: 'LOCAL DEMO' },
              ]}
            />
            <Divider label="CATEGORY MIX" />
            <Donut
              data={catDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
              height={160}
              centerLabel="RECORDS"
              centerValue={String(s.evidence.length)}
            />
          </Panel>

          <Panel title="Collection Density" icon={Fingerprint} subtitle="Records per case">
            <HeatStrip data={s.cases.map((c) => s.evidence.filter((e) => e.caseId === c.id).length)} />
            <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3"><span>FEW</span><span>MANY</span></div>
            <Divider />
            <ul className="space-y-1">
              {s.cases.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span className="mono text-[9px] text-ink-3">{c.code}</span>
                  <span className="text-[10px] text-ink-2">{s.evidence.filter((e) => e.caseId === c.id).length} records</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Handling Rules" icon={Lock}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• All evidence is generated and lives only in memory.</li>
              <li>• Hashes are illustrative fingerprints, not real file proofs.</li>
              <li>• Sealed records cannot be exported from this demo view.</li>
              <li>• Nothing is uploaded; exports are generated in-browser.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Synthetic evidence">
        Descriptions, hashes, timestamps and cases are generated. No real evidence, device or document is referenced.
      </InlineAlert>

      <Modal
        open={!!record}
        onClose={() => setDetail(null)}
        title={record ? `${record.id} · ${record.category}` : 'Record'}
        subtitle={record?.description}
        icon={FileText}
        size="lg"
        footer={<button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>Close</button>}
      >
        {record && (
          <div className="space-y-3">
            <KeyValue
              items={[
                { k: 'Case', v: s.cases.find((c) => c.id === record.caseId)?.code ?? record.caseId },
                { k: 'Collected', v: fmtDateTime(record.collected) },
                { k: 'Status', v: record.status.toUpperCase() },
                { k: 'Category', v: record.category },
                { k: 'Hash', v: record.hash },
                { k: 'Source', v: 'SYNTHETIC' },
              ]}
            />
            <div>
              <p className="label-xs mb-1">ANALYST NOTES</p>
              <p className="text-[11px] leading-relaxed text-ink-2">{record.notes}</p>
            </div>
            <div className="border border-line bg-bg p-2 font-terminal text-[9px] leading-relaxed text-ink-3">
              <p className="text-ink-2">CHAIN OF CUSTODY (SIMULATED)</p>
              <p>1. Record generated by simulation engine</p>
              <p>2. Fingerprint computed locally: {record.hash.slice(0, 24)}…</p>
              <p>3. Status set to {record.status}</p>
              <p>4. No transfer, upload or external storage performed</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Tag tone="#28d8ea">SIMULATED</Tag>
              <Tag>{record.category}</Tag>
              <Tag tone="#f5b942">{record.status.toUpperCase()}</Tag>
            </div>
          </div>
        )}
      </Modal>
    </Screen>
  )
}

