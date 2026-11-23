import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Sparkles, Download, Printer, Trash2, Search, Plus, ArrowUpRight,
  ShieldCheck, Clock, Layers, Check,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tag, Modal, Tabs } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { useReports, REPORT_TYPES, reportToText, reportToCSV, type ReportType } from '@/services/reports'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, relTime } from '@/lib/utils'

export default function AIReports() {
  const navigate = useNavigate()
  const s = useEngine()
  const { reports, remove, clear, add } = useReports()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [selected, setSelected] = useState<string | null>(reports[0]?.id ?? null)
  const [genOpen, setGenOpen] = useState(false)
  const [genType, setGenType] = useState<ReportType>('intelligence')
  const [tab, setTab] = useState('preview')

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return reports.filter((r) => {
      if (t && !`${r.title} ${r.summary} ${r.number} ${r.author}`.toLowerCase().includes(t)) return false
      if (type !== 'all' && r.type !== type) return false
      return true
    })
  }, [reports, q, type])

  const report = reports.find((r) => r.id === selected) ?? filtered[0]

  const generate = () => {
    const meta = REPORT_TYPES.find((t) => t.id === genType)!
    const r = add({
      title: `${meta.label} Snapshot ${new Date().toISOString().slice(0, 10)}`,
      type: genType,
      department: meta.department,
      generated: new Date().toISOString(),
      author: s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? 'OPERATOR',
      summary: buildSummary(genType, s),
      analysis: buildAnalysis(genType, s),
      metrics: buildMetrics(genType, s),
      classification: 'FICTIONAL · DEMO',
    })
    setSelected(r.id)
    setGenOpen(false)
    s.notify({ type: 'success', title: 'Report compiled', body: r.number, severity: 'low', module: 'ai', href: '/reports' })
    s.emit('AI.REPORT_GENERATED', { id: r.id, type: r.type })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SHADOW AI · REPORTS"
        title="AI Report Compiler"
        subtitle="Compile structured reports from live simulation data, then export or print a fiction-flagged document."
        icon={Sparkles}
        meta={
          <>
            <span className="badge badge-cyan">{reports.length} REPORTS</span>
            <span className="badge badge-grey">{REPORT_TYPES.length} TYPES</span>
            <span className="badge badge-green">LOCAL COMPILE</span>
            <span className="badge badge-amber">SIMULATED</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/reports')}><Layers size={11} /> Reports hub</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setGenOpen(true)}><Plus size={11} /> Compile report</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Reports" value={reports.length} icon={FileText} accent="cyan" />
        <StatCard label="Types used" value={new Set(reports.map((r) => r.type)).size} icon={Layers} accent="blue" />
        <StatCard label="Latest" value={reports[0] ? relTime(reports[0].generated) : '—'} icon={Clock} accent="green" />
        <StatCard label="Persisted" value="localStorage" icon={ShieldCheck} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Panel title="Index" icon={Search} bodyClassName="p-0"
            actions={<span className="badge badge-grey">{filtered.length}</span>}
          >
            <div className="space-y-1.5 border-b border-line p-2">
              <div className="relative">
                <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" className="field h-6 pl-6 text-[10px]" />
              </div>
              <Select className="w-full" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...REPORT_TYPES.map((t) => ({ value: t.id, label: t.label }))]} />
            </div>
            <ul className="max-h-[48vh] divide-y divide-line-soft overflow-y-auto">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSelected(r.id)} data-selected={report?.id === r.id} className="w-full px-2.5 py-2 text-left hover:bg-elevated">
                    <div className="flex items-center justify-between gap-1">
                      <span className="mono text-[8px] text-[var(--accent)]">{r.number}</span>
                      <span className="badge badge-grey">{r.type}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink">{r.title}</p>
                    <p className="mono text-[7.5px] text-ink-3">{r.author} · {relTime(r.generated)}</p>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No reports match.</li>}
            </ul>
          </Panel>

          <Panel title="Actions" icon={ShieldCheck}>
            <div className="space-y-1.5">
              <button type="button" className="btn btn-sm w-full" onClick={() => report && downloadFile(`${report.number}.txt`, reportToText(report), 'text/plain')} disabled={!report}><Download size={10} /> Export .txt</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => report && downloadFile(`${report.number}.csv`, reportToCSV(report), 'text/csv')} disabled={!report}><Download size={10} /> Export .csv</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => window.print()} disabled={!report}><Printer size={10} /> Print</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => report && remove(report.id)} disabled={!report}><Trash2 size={10} /> Delete report</button>
              <button type="button" className="btn btn-sm w-full" onClick={clear} disabled={!reports.length}><Trash2 size={10} /> Clear all</button>
            </div>
            <Divider />
            <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
              Reports persist in this browser only. Clearing resets the index without touching simulation data.
            </p>
          </Panel>

          <Panel title="Type Mix" icon={Layers}>
            {REPORT_TYPES.map((t) => {
              const n = reports.filter((r) => r.type === t.id).length
              return (
                <div key={t.id} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-ink-2">{t.label}</span>
                  <span className="mono text-[9px] text-ink-3">{n}</span>
                </div>
              )
            })}
          </Panel>
        </div>

        <Panel
          title={report ? `${report.number} · ${report.title}` : 'Report Preview'}
          icon={FileText}
          subtitle={report ? `${report.department} · ${fmtDateTime(report.generated)}` : 'Compile or select a report'}
          actions={report ? (
            <div className="flex items-center gap-1.5">
              <Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'preview', label: 'Preview' }, { id: 'meta', label: 'Meta' }]} />
              <StatusPill value="active" label={report.classification.split('·')[1]?.trim() ?? 'DEMO'} dot={false} />
            </div>
          ) : undefined}
        >
          {report ? (
            tab === 'preview' ? (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <Tag tone="#28d8ea">SIMULATED</Tag>
                  <Tag tone="#f5b942">{report.classification}</Tag>
                  <Tag>{report.type.toUpperCase()}</Tag>
                  <span className="ml-auto mono text-[8.5px] text-ink-3">author {report.author}</span>
                </div>
                <Doc label="COMPILED REPORT">{reportToText(report)}</Doc>
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <KeyValue
                  items={[
                    { k: 'Number', v: report.number },
                    { k: 'Type', v: report.type.toUpperCase() },
                    { k: 'Department', v: report.department },
                    { k: 'Generated', v: fmtDateTime(report.generated) },
                    { k: 'Author', v: report.author },
                    { k: 'Classification', v: report.classification },
                  ]}
                />
                <div>
                  <p className="label-xs mb-1">METRICS</p>
                  <ul className="space-y-1">
                    {report.metrics.map((m) => (
                      <li key={m.label} className="flex items-center justify-between border-b border-line-soft/50 pb-0.5">
                        <span className="text-[10px] text-ink-2">{m.label}</span>
                        <span className="mono text-[10px] text-ink">{m.value}</span>
                      </li>
                    ))}
                  </ul>
                  <Divider label="ANALYSIS" />
                  <ul className="space-y-1">
                    {report.analysis.map((a, i) => (
                      <li key={i} className="flex gap-1.5 text-[10px] leading-relaxed text-ink-2">
                        <span className="mono text-[8px] text-ink-3">{String(i + 1).padStart(2, '0')}</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          ) : (
            <EmptyState icon={FileText} title="No report selected" message="Compile a new report or pick one from the index." action={<button type="button" className="btn btn-sm btn-primary" onClick={() => setGenOpen(true)}><Plus size={10} /> Compile</button>} />
          )}
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Generated fiction">
        Every report is assembled from simulated data. Exports carry an explicit "SIMULATED — NOT A REAL INTELLIGENCE PRODUCT"
        notice.
      </InlineAlert>

      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Compile Report"
        subtitle="Reads live data from the simulation store"
        icon={Sparkles}
        footer={<>
          <button type="button" className="btn" onClick={() => setGenOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={generate}><Check size={11} /> Compile</button>
        </>}
      >
        <div className="space-y-3">
          <Select label="Report type" value={genType} onChange={(v) => setGenType(v as ReportType)} options={REPORT_TYPES.map((t) => ({ value: t.id, label: `${t.label} — ${t.department}` }))} />
          <div className="border border-line bg-bg p-2">
            <p className="label-xs mb-1">SUMMARY PREVIEW</p>
            <p className="text-[10px] leading-relaxed text-ink-2">{buildSummary(genType, s)}</p>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {buildMetrics(genType, s).map((m) => (
              <div key={m.label} className="border border-line bg-bg p-1.5 text-center">
                <p className="mono text-[11px] text-[var(--accent)]">{m.value}</p>
                <p className="text-[8px] uppercase text-ink-3">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[9.5px] text-ink-3"><ArrowUpRight size={10} /> The compiled report appears in both AI Reports and Reports.</div>
        </div>
      </Modal>
    </Screen>
  )
}

function buildSummary(type: ReportType, s: ReturnType<typeof useEngine.getState>) {
  switch (type) {
    case 'financial':
      return `Simulated exposure stands at ${s.accounts.length} accounts across ${s.banks.length} institutions with ${s.transactions.filter((t) => t.status === 'pending').length} pending settlements. Wallet notional is tracked separately.`
    case 'network':
      return `${s.networkNodes.filter((n) => n.status === 'online').length} of ${s.networkNodes.length} hosts report online; ${s.networkLinks.filter((l) => l.status !== 'up').length} links are degraded or down.`
    case 'incident':
      return `${s.findings.filter((f) => f.severity === 'critical').length} critical security findings remain open across the generated estate, with ${s.firewall.filter((f) => f.enabled).length} active firewall rules.`
    case 'mission':
      return `${s.missions.filter((m) => m.status === 'active').length} missions are active and ${s.missions.filter((m) => m.status === 'paused').length} are paused out of ${s.missions.length} scenarios.`
    case 'surveillance':
      return `${s.cameras.filter((c) => c.status === 'online').length} of ${s.cameras.length} synthetic feeds are online with ${s.surveillanceIncidents.filter((i) => i.status === 'open').length} open incidents.`
    default:
      return `${s.identities.length} profiles and ${s.cases.length} cases are tracked across ${s.organizations.length} organisations, linked by ${s.graph.links.length} graph edges.`
  }
}

function buildAnalysis(type: ReportType, s: ReturnType<typeof useEngine.getState>) {
  switch (type) {
    case 'financial': return [
      'Account status mix shows a stable majority of active accounts.',
      `${s.cards.filter((c) => c.status === 'frozen').length} cards are frozen in the simulated estate.`,
      'Transfer volume is concentrated in a small number of high-value records.',
    ]
    case 'network': return [
      'Node load averages remain inside demonstration thresholds.',
      'Congested links are short-lived and recover within the sampling window.',
      'Storage nodes exhibit the highest steady utilisation.',
    ]
    case 'incident': return [
      'Critical findings cluster on a small set of simulated assets.',
      'Firewall rules carry uneven simulated match counts.',
      'Operator remediation actions are available per finding.',
    ]
    case 'mission': return [
      'Active missions progress on engine ticks and can be paused safely.',
      'Each scenario uses prebuilt deterministic event scripts.',
      'Templates cover six distinct narrative archetypes.',
    ]
    case 'surveillance': return [
      'Feed availability is stable with occasional simulated degradation.',
      'Open incidents require acknowledgement to clear.',
      'All media is procedurally rendered, never captured.',
    ]
    default: return [
      'Case progress is spread across open, active and cold states.',
      'The relationship graph shows a connected network with no isolated clusters.',
      'Evidence records remain synthetic and locally generated.',
    ]
  }
}

function buildMetrics(type: ReportType, s: ReturnType<typeof useEngine.getState>) {
  switch (type) {
    case 'financial': return [
      { label: 'Accounts', value: String(s.accounts.length) },
      { label: 'Banks', value: String(s.banks.length) },
      { label: 'Pending', value: String(s.transactions.filter((t) => t.status === 'pending').length) },
    ]
    case 'network': return [
      { label: 'Nodes', value: String(s.networkNodes.length) },
      { label: 'Links', value: String(s.networkLinks.length) },
      { label: 'Online', value: String(s.networkNodes.filter((n) => n.status === 'online').length) },
    ]
    case 'incident': return [
      { label: 'Findings', value: String(s.findings.length) },
      { label: 'Critical', value: String(s.findings.filter((f) => f.severity === 'critical').length) },
      { label: 'Rules', value: String(s.firewall.length) },
    ]
    case 'mission': return [
      { label: 'Missions', value: String(s.missions.length) },
      { label: 'Active', value: String(s.missions.filter((m) => m.status === 'active').length) },
      { label: 'Templates', value: String(s.templates.length) },
    ]
    case 'surveillance': return [
      { label: 'Cameras', value: String(s.cameras.length) },
      { label: 'Online', value: String(s.cameras.filter((c) => c.status === 'online').length) },
      { label: 'Incidents', value: String(s.surveillanceIncidents.length) },
    ]
    default: return [
      { label: 'Profiles', value: String(s.identities.length) },
      { label: 'Cases', value: String(s.cases.length) },
      { label: 'Orgs', value: String(s.organizations.length) },
    ]
  }
}
