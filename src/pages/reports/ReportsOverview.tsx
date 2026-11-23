import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Search, Download, Filter, Plus, ArrowUpRight, ShieldAlert, Wallet,
  Network, BrainCircuit, Rocket, Camera, Trash2, ChevronRight, Layers, CalendarClock, PieChart, BarChart3,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, Divider, KeyValue, Tag, Tabs, Modal as Dialog } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, BarsTrend } from '@/components/charts'
import { useReports, REPORT_TYPES, reportToText } from '@/services/reports'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, relTime } from '@/lib/utils'
import type { GeneratedReport } from '@/types'

export const TYPE_ICON: Record<GeneratedReport['type'], typeof FileText> = {
  intelligence: BrainCircuit,
  incident: ShieldAlert,
  financial: Wallet,
  network: Network,
  mission: Rocket,
  surveillance: Camera,
}

export const TYPE_COLOR: Record<GeneratedReport['type'], string> = {
  intelligence: PALETTE.cyan,
  incident: PALETTE.red,
  financial: PALETTE.green,
  network: PALETTE.blue,
  mission: PALETTE.amber,
  surveillance: '#a78bfa',
}

export default function ReportsOverview() {
  const navigate = useNavigate()
  const { reports, remove } = useReports()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [tab, setTab] = useState('all')
  const [sel, setSel] = useState<GeneratedReport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GeneratedReport | null>(null)
  const [compileOpen, setCompileOpen] = useState(false)
  const [compileType, setCompileType] = useState<GeneratedReport['type']>('intelligence')
  const [title, setTitle] = useState('')

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return reports.filter((r) => {
      if (term && !`${r.title} ${r.number} ${r.summary} ${r.department}`.toLowerCase().includes(term)) return false
      if (type !== 'all' && r.type !== type) return false
      if (tab === 'week' && +new Date(r.generated) < Date.now() - 7 * 86_400_000) return false
      if (tab === 'today' && +new Date(r.generated) < Date.now() - 86_400_000) return false
      return true
    })
  }, [reports, q, type, tab])

  const byType = useMemo(
    () => REPORT_TYPES.map((t) => ({ name: t.label, value: reports.filter((r) => r.type === t.id).length })).filter((x) => x.value),
    [reports],
  )

  const weekly = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        t: `D${i + 1}`,
        v: 1 + Math.round(Math.abs(Math.sin(i / 2.2)) * 4) + (i % 5 === 0 ? 2 : 0),
      })),
    [],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="REPORTS · ARCHIVE"
        title="Report Library"
        subtitle="Locally compiled, fictional reports. Every export carries a simulated-content notice."
        icon={FileText}
        meta={
          <>
            <span className="badge badge-cyan">{reports.length} REPORTS</span>
            <span className="badge badge-grey">{REPORT_TYPES.length} TYPES</span>
            <span className="badge badge-green">LOCAL ONLY</span>
            <span className="badge badge-amber">FICTIONAL · INTERNAL</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-reports.json', JSON.stringify(reports, null, 2), 'application/json')}><Download size={11} /> Export all</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setCompileOpen(true)}><Plus size={11} /> Compile report</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Reports" value={reports.length} icon={FileText} accent="cyan" />
        <StatCard label="This week" value={reports.filter((r) => +new Date(r.generated) > Date.now() - 7 * 86_400_000).length} icon={CalendarClock} accent="green" />
        <StatCard label="Restricted" value={reports.filter((r) => r.classification.includes('RESTRICTED')).length} icon={ShieldAlert} accent="red" />
        <StatCard label="Types used" value={new Set(reports.map((r) => r.type)).size} icon={Layers} accent="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Compilation Volume" icon={FileText} className="lg:col-span-2" subtitle="Fictional reports per simulated day">
          <AreaTrend data={weekly} keys={[{ key: 'v', color: PALETTE.cyan, label: 'Reports' }]} height={180} />
          <ChartLegend items={[{ label: 'Reports compiled', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Type Mix" icon={PieChart}>
          <Donut data={byType.map((t) => ({ name: t.name, value: t.value, color: TYPE_COLOR[REPORT_TYPES.find((x) => x.label === t.name)?.id ?? 'network'] }))} height={170} centerLabel="REPORTS" centerValue={String(reports.length)} />
        </Panel>
      </div>

      <Panel title="Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Report title, number or summary…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">TYPE</p><Select className="w-40" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...REPORT_TYPES.map((t) => ({ value: t.id, label: t.label }))]} /></div>
          <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: reports.length }, { id: 'week', label: '7 days' }, { id: 'today', label: '24h' }]} />
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <Panel title="Reports" icon={FileText} bodyClassName="p-0"
          actions={<span className="mono text-[8.5px] text-ink-3">{filtered.length} shown</span>}
        >
          <div className="max-h-[54vh] overflow-auto">
            <table className="data-table min-w-[760px]">
              <thead><tr><th>Number</th><th>Title</th><th>Type</th><th>Classification</th><th>Author</th><th>Generated</th><th /></tr></thead>
              <tbody>
                {filtered.map((r) => {
                  const Icon = TYPE_ICON[r.type]
                  return (
                    <tr key={r.id} className="cursor-pointer" onClick={() => setSel(r)}>
                      <td className="mono text-[8.5px] text-[var(--accent)]">{r.number}</td>
                      <td>
                        <span className="flex items-center gap-1">
                          <Icon size={9} style={{ color: TYPE_COLOR[r.type] }} />
                          <span className="max-w-[260px] truncate text-[10px] text-ink">{r.title}</span>
                        </span>
                      </td>
                      <td className="text-[8.5px] uppercase text-ink-3">{r.type}</td>
                      <td><span className="badge badge-amber">{r.classification.replace('FICTIONAL · ', '')}</span></td>
                      <td className="text-[9px] text-ink-3">{r.author}</td>
                      <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(r.generated)}</td>
                      <td>
                        <span className="flex gap-0.5">
                          <button type="button" className="icon-btn" title="Open" onClick={(e) => { e.stopPropagation(); navigate(`/reports/${r.id}`) }}><ArrowUpRight size={9} /></button>
                          <button type="button" className="icon-btn" title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r) }}><Trash2 size={9} /></button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={FileText} title="No reports match" message="Adjust filters or compile a new report." />}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Quick Compile" icon={Plus}>
            <div className="grid grid-cols-2 gap-1">
              {REPORT_TYPES.map((t) => {
                const Icon = TYPE_ICON[t.id]
                return (
                  <button key={t.id} type="button" className="flex items-center gap-1 border border-line px-1.5 py-1 text-left text-[9.5px] text-ink-2 hover:bg-elevated"
                    onClick={() => { setCompileType(t.id); setTitle(`${t.label} brief — ${new Date().toISOString().slice(0, 10)}`); setCompileOpen(true) }}
                  >
                    <Icon size={9} style={{ color: TYPE_COLOR[t.id] }} /> {t.label}
                  </button>
                )
              })}
            </div>
            <Divider />
            <p className="font-mono text-[8px] leading-relaxed text-ink-3">Reports are assembled from live store values and saved to this browser.</p>
          </Panel>

          <Panel title="Latest" icon={FileText} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {reports.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSel(r)} className="w-full px-2.5 py-1.5 text-left hover:bg-elevated">
                    <span className="mono block text-[8px] text-[var(--accent)]">{r.number}</span>
                    <span className="block truncate text-[10px] text-ink-2">{r.title}</span>
                    <span className="mono block text-[7.5px] text-ink-3">{relTime(r.generated)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Departments" icon={Layers}>
            {Array.from(new Set(reports.map((r) => r.department))).map((d) => {
              const n = reports.filter((r) => r.department === d).length
              return (
                <div key={d} className="flex items-center justify-between border-b border-line-soft/50 py-0.5 last:border-0">
                  <span className="truncate text-[9.5px] text-ink-2">{d}</span>
                  <span className="mono text-[8.5px] text-ink-3">{n}</span>
                </div>
              )
            })}
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Reports by Type" icon={BarChart3}>
          <BarsTrend horizontal data={byType} keys={[{ key: 'value', color: PALETTE.cyan, label: 'Reports' }]} height={170} xKey="name" />
          <ChartLegend items={[{ label: 'Reports', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Generator Status" icon={ShieldAlert}>
          <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Compilation engine</span><StatusPill value="active" label="READY" /></div>
          <Divider />
          <KeyValue
            items={[
              { k: 'Next number', v: `RPT-${4404 + reports.length}` },
              { k: 'Storage', v: 'LOCAL BROWSER' },
              { k: 'Operator', v: s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? '—' },
              { k: 'Simulated time', v: fmtDateTime(new Date(s.simulatedTime).toISOString()) },
            ]}
          />
          <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">DETERMINISTIC</Tag><Tag tone="#f5b942">SIMULATED</Tag><Tag tone="#38db91">NO UPLOAD</Tag></div>
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Fictional documents">
        Every report in this archive is generated from demonstration data. None describes a real person, account, network or
        event, and none is a real intelligence product.
      </InlineAlert>

      <Dialog open={!!sel} onClose={() => setSel(null)} title={sel?.number ?? ''} subtitle={sel?.title} icon={FileText} size="lg"
        footer={<>
          <button type="button" className="btn" onClick={() => setSel(null)}>Close</button>
          <button type="button" className="btn" onClick={() => sel && downloadFile(`${sel.number}.txt`, reportToText(sel), 'text/plain')}><Download size={11} /> Export txt</button>
          <button type="button" className="btn btn-primary" onClick={() => sel && navigate(`/reports/${sel.id}`)}>Open full <ChevronRight size={11} /></button>
        </>}
      >
        {sel && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="badge badge-amber">{sel.classification}</span>
              <span className="badge badge-grey">{sel.type.toUpperCase()}</span>
              <span className="badge badge-grey">{sel.department}</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-ink-2">{sel.summary}</p>
            <pre className="terminal-window max-h-[220px] overflow-auto whitespace-pre-wrap p-2 font-terminal text-[8.5px] leading-relaxed text-ink-3">{reportToText(sel).split('\n').slice(0, 26).join('\n')}</pre>
            <div className="flex justify-end"><span className="border border-amber/50 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-amber">FICTIONAL · SIMULATED</span></div>
          </div>
        )}
      </Dialog>

      <Dialog open={compileOpen} onClose={() => setCompileOpen(false)} title="Compile Report" subtitle="Builds a report from live demonstration data" icon={FileText}
        footer={<>
          <button type="button" className="btn" onClick={() => setCompileOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { navigate('/ai/reports') }}>Open AI reports <ArrowUpRight size={11} /></button>
        </>}
      >
        <div className="space-y-2">
          <Select label="Type" value={compileType} onChange={(v) => { setCompileType(v as GeneratedReport['type']); setTitle(`${REPORT_TYPES.find((t) => t.id === v)?.label} brief — ${new Date().toISOString().slice(0, 10)}`) }} options={REPORT_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <div>
            <label className="field-label" htmlFor="rp-title">Title</label>
            <input id="rp-title" value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder={`${REPORT_TYPES.find((t) => t.id === compileType)?.label} brief`} />
          </div>
          <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
            The AI Reports page compiles from the same engine fields and saves into this library with an auto-issued number.
          </p>
        </div>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Report" subtitle={deleteTarget?.number} icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { if (deleteTarget) remove(deleteTarget.id); setDeleteTarget(null) }}><Trash2 size={11} /> Delete</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">Removing a report deletes it from this browser's local storage. It cannot be recovered unless you recompile it.</p>
      </Dialog>
    </Screen>
  )
}
