import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Download, Plus, FileText, Printer, Trash2, ArrowUpRight, ShieldAlert,
  Filter, Layers, ChevronRight, BarChart3, PieChart,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, Divider, KeyValue, Tag, Tabs, Modal, Progress } from '@/components/ui'
import { AreaTrend, BarsTrend, ChartLegend } from '@/components/charts'
import { useReports, REPORT_TYPES, reportToText, reportToCSV } from '@/services/reports'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, pad, relTime } from '@/lib/utils'
import type { GeneratedReport } from '@/types'
import type { LucideIcon } from 'lucide-react'

export interface DeptConfig {
  type: GeneratedReport['type']
  title: string
  eyebrow: string
  subtitle: string
  icon: LucideIcon
  accent: 'cyan' | 'red' | 'green' | 'blue' | 'amber' | 'grey'
  color: string
  stats: (s: ReturnType<typeof useEngine.getState>) => { label: string; value: string | number; icon: LucideIcon; accent: 'cyan' | 'red' | 'green' | 'blue' | 'amber' | 'grey' }[]
  chart: (s: ReturnType<typeof useEngine.getState>) => { data: Record<string, number | string>[]; keys: { key: string; color: string; label: string }[]; xKey?: string; subtitle?: string }
  breakdown: (s: ReturnType<typeof useEngine.getState>) => { label: string; value: string }[]
  build: (s: ReturnType<typeof useEngine.getState>) => Pick<GeneratedReport, 'title' | 'summary' | 'analysis' | 'metrics' | 'classification'>
  notes: string[]
}

export function DepartmentReports({ cfg }: { cfg: DeptConfig }) {
  const navigate = useNavigate()
  const s = useEngine()
  const { reports, add, remove } = useReports()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('newest')
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(false)
  const [del, setDel] = useState<GeneratedReport | null>(null)
  const [preview, setPreview] = useState<GeneratedReport | null>(null)

  const own = useMemo(() => reports.filter((r) => r.type === cfg.type), [reports, cfg.type])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    const list = own.filter((r) => {
      if (t && !`${r.title} ${r.number} ${r.summary}`.toLowerCase().includes(t)) return false
      if (tab === 'week' && +new Date(r.generated) < Date.now() - 7 * 86_400_000) return false
      return true
    })
    return list.slice().sort((a, b) => (sort === 'newest' ? +new Date(b.generated) - +new Date(a.generated) : sort === 'oldest' ? +new Date(a.generated) - +new Date(b.generated) : a.number.localeCompare(b.number)))
  }, [own, q, tab, sort])

  const stats = cfg.stats(s)
  const chart = cfg.chart(s)
  const breakdown = cfg.breakdown(s)

  const compile = () => {
    const payload = cfg.build(s)
    const report = add({
      ...payload,
      type: cfg.type,
      department: REPORT_TYPES.find((t) => t.id === cfg.type)?.department ?? 'Operations',
      generated: new Date().toISOString(),
      author: 'SHADOW AI',
    })
    setOpen(false)
    setPreview(report)
    s.notify({ type: 'ai', title: 'Report compiled', body: `${report.number} — ${report.title}`, severity: 'low', module: 'reports', href: `/reports/${report.id}` })
    s.emit('AI.REPORT_GENERATED', { number: report.number, type: cfg.type })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow={cfg.eyebrow}
        title={cfg.title}
        subtitle={cfg.subtitle}
        icon={cfg.icon}
        meta={
          <>
            <span className="badge badge-cyan">{own.length} REPORTS</span>
            <span className={cn('badge', `badge-${cfg.accent}`)}>{cfg.type.toUpperCase()}</span>
            <span className="badge badge-grey">LOCAL</span>
            <span className="badge badge-amber">FICTIONAL</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-${cfg.type}-reports.csv`, own.map((r) => reportToCSV(r)).join('\n\n'), 'text/csv')} disabled={!own.length}><Download size={11} /> Export CSV</button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/reports')}><Layers size={11} /> All reports</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(true)}><Plus size={11} /> Compile</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.slice(0, 4).map((st) => <StatCard key={st.label} label={st.label} value={st.value} icon={st.icon} accent={st.accent} />)}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Trend" icon={cfg.icon} className="lg:col-span-2" subtitle={chart.subtitle}>
          <AreaTrend data={chart.data} keys={chart.keys} height={180} />
          <ChartLegend items={chart.keys.map((k) => ({ label: k.label, color: k.color }))} />
        </Panel>
        <Panel title="Breakdown" icon={PieChart}>
          <div className="space-y-1.5">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between border-b border-line-soft/50 py-0.5 last:border-0">
                <span className="truncate text-[10px] text-ink-2">{b.label}</span>
                <span className="mono text-[9px] text-ink-3">{b.value}</span>
              </div>
            ))}
          </div>
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
          <div><p className="label-xs mb-1">SORT</p><Select className="w-32" value={sort} onChange={setSort} options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'number', label: 'Number' }]} /></div>
          <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: own.length }, { id: 'week', label: '7 days' }]} />
        </div>
      </Panel>

      <Panel title={`${cfg.title}`} icon={cfg.icon} bodyClassName="p-0"
        actions={<span className="mono text-[8.5px] text-ink-3">{filtered.length} shown</span>}
      >
        <div className="max-h-[42vh] overflow-auto">
          <table className="data-table min-w-[700px]">
            <thead><tr><th>Number</th><th>Title</th><th>Classification</th><th>Author</th><th>Metrics</th><th>Generated</th><th /></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="cursor-pointer" onClick={() => setPreview(r)}>
                  <td className="mono text-[8.5px] text-[var(--accent)]">{r.number}</td>
                  <td><span className="block max-w-[300px] truncate text-[10px] text-ink">{r.title}</span></td>
                  <td><span className="badge badge-amber">{r.classification.replace('FICTIONAL · ', '')}</span></td>
                  <td className="text-[9px] text-ink-3">{r.author}</td>
                  <td className="mono text-[8.5px] text-ink-3">{r.metrics.length}</td>
                  <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(r.generated)}</td>
                  <td>
                    <span className="flex gap-0.5">
                      <button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); navigate(`/reports/${r.id}`) }} title="Open"><ArrowUpRight size={9} /></button>
                      <button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); setDel(r) }} title="Delete"><Trash2 size={9} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={cfg.icon} title="No reports yet" message="Compile a report from live demonstration data to populate this archive." action={<button type="button" className="btn btn-sm btn-primary" onClick={setOpen.bind(null, true)}><Plus size={10} /> Compile report</button>} />}
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Distribution" icon={BarChart3}>
          <BarsTrend
            horizontal
            data={filtered.slice(0, 8).map((r) => ({ name: r.number.replace('RPT-', ''), v: r.metrics.length }))}
            keys={[{ key: 'v', color: cfg.color, label: 'Metrics' }]}
            height={170}
            xKey="name"
          />
          <ChartLegend items={[{ label: 'Metrics per report', color: cfg.color }]} />
        </Panel>
        <Panel title="Department Notes" icon={ShieldAlert}>
          <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
            {cfg.notes.map((n, i) => <li key={i}>• {n}</li>)}
          </ul>
          <Divider />
          <KeyValue
            items={[
              { k: 'Department', v: REPORT_TYPES.find((t) => t.id === cfg.type)?.department ?? '—' },
              { k: 'Reports', v: String(own.length) },
              { k: 'Storage', v: 'LOCAL BROWSER' },
            ]}
          />
          <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone={cfg.color}>SIMULATED</Tag><Tag tone="#38db91">NO UPLOAD</Tag></div>
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Fictional reporting">
        Reports are compiled in-browser from generated demonstration data. Nothing here describes a real system, account or
        person, and no report is transmitted anywhere.
      </InlineAlert>

      <Modal open={open} onClose={() => setOpen(false)} title={`Compile ${cfg.type} report`} subtitle="Assembled from live store values" icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={compile}><Plus size={11} /> Compile</button>
        </>}
      >
        <div className="space-y-2">
          <div className="border border-line bg-bg p-2">
            <p className="label-xs mb-1">PREVIEW TITLE</p>
            <p className="text-[10.5px] text-ink">{cfg.build(s).title}</p>
          </div>
          <div className="flex flex-wrap gap-1"><Tag tone={cfg.color}>{cfg.type.toUpperCase()}</Tag><Tag tone="#f5b942">FICTIONAL</Tag></div>
          <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">The report is numbered automatically and saved to the local library.</p>
        </div>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.number ?? ''} subtitle={preview?.title} icon={FileText} size="lg"
        footer={<>
          <button type="button" className="btn" onClick={() => setPreview(null)}>Close</button>
          <button type="button" className="btn" onClick={() => preview && downloadFile(`${preview.number}.txt`, reportToText(preview), 'text/plain')}><Download size={11} /> txt</button>
          <button type="button" className="btn" onClick={() => preview && downloadFile(`${preview.number}.csv`, reportToCSV(preview), 'text/csv')}><Download size={11} /> csv</button>
          <button type="button" className="btn btn-primary" onClick={() => { setPreview(null); navigate(`/reports/${preview?.id}`) }}>Full view <ChevronRight size={11} /></button>
        </>}
      >
        {preview && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="badge badge-amber">{preview.classification}</span>
              <span className="badge badge-grey">{preview.department}</span>
              <span className="badge badge-grey">{relTime(preview.generated)}</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-ink-2">{preview.summary}</p>
            <Divider label="ANALYSIS" />
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              {preview.analysis.map((a, i) => <li key={i} className="flex gap-1.5"><span className="mono text-ink-3">{pad(i + 1)}</span>{a}</li>)}
            </ul>
            <Divider label="METRICS" />
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {preview.metrics.map((m) => (
                <div key={m.label} className="border border-line bg-bg p-1.5">
                  <p className="label-xs truncate">{m.label}</p>
                  <p className="mono text-[11px] text-ink">{m.value}</p>
                </div>
              ))}
            </div>
            <pre className="terminal-window max-h-[150px] overflow-auto whitespace-pre-wrap p-1.5 font-terminal text-[8px] leading-relaxed text-ink-3">{reportToText(preview).split('\n').slice(-10).join('\n')}</pre>
          </div>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title="Delete Report" subtitle={del?.number} icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setDel(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { if (del) remove(del.id); setDel(null) }}><Trash2 size={11} /> Delete</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">Deletes the report from this browser. Recompile to recreate it from current data.</p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><Printer size={9} /> Compilation timestamp {del ? fmtDateTime(del.generated) : ''}</div>
      </Modal>

      <Panel title="Library Totals" icon={Layers}>
        <div className="grid gap-2 sm:grid-cols-4">
          <div><p className="label-xs">REPORTS</p><p className="mono text-[13px] text-ink">{own.length}</p></div>
          <div><p className="label-xs">METRICS</p><p className="mono text-[13px] text-ink">{own.reduce((a, r) => a + r.metrics.length, 0)}</p></div>
          <div><p className="label-xs">ANALYSIS LINES</p><p className="mono text-[13px] text-ink">{own.reduce((a, r) => a + r.analysis.length, 0)}</p></div>
          <div><p className="label-xs">LATEST</p><p className="mono text-[13px] text-ink">{own[0] ? relTime(own[0].generated) : '—'}</p></div>
        </div>
        <Divider />
        <div className="flex items-center justify-between">
          <StatusPill value="active" label="COMPILER READY" />
          <span className="mono text-[8.5px] text-ink-3">next {`RPT-${4404 + reports.length}`}</span>
        </div>
      </Panel>

      <Panel title="Coverage" icon={Layers}>
        <div className="space-y-1.5">
          {REPORT_TYPES.map((t) => {
            const n = reports.filter((r) => r.type === t.id).length
            const pct = (n / Math.max(1, reports.length)) * 100
            return (
              <div key={t.id}>
                <div className="flex justify-between"><span className="text-[10px] text-ink-2">{t.label}</span><span className="mono text-[8.5px] text-ink-3">{n}</span></div>
                <Progress value={pct} height={2} color={t.id === cfg.type ? cfg.color : '#377eff'} />
              </div>
            )
          })}
        </div>
      </Panel>
    </Screen>
  )
}
