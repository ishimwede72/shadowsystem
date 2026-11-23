import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FileText, ArrowLeft, Download, Printer, Copy, Check, Trash2, BrainCircuit, ShieldAlert,
  Wallet, Network, Rocket, Camera, CopyCheck, Info, ListChecks,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, InlineAlert, Divider, KeyValue, Tag, EmptyState, Modal, Tabs, Progress, Screen as ScreenWrap } from '@/components/ui'
import { BarsTrend, PALETTE, ChartLegend } from '@/components/charts'
import { useReports, reportToText, reportToCSV, REPORT_TYPES } from '@/services/reports'
import { useEngine } from '@/services/engine'
import { audio } from '@/services/audio'
import { downloadFile, fmtDateTime, relTime } from '@/lib/utils'
import type { GeneratedReport } from '@/types'

const ICON: Record<GeneratedReport['type'], typeof FileText> = {
  intelligence: BrainCircuit, incident: ShieldAlert, financial: Wallet, network: Network, mission: Rocket, surveillance: Camera,
}
const COLOR: Record<GeneratedReport['type'], string> = {
  intelligence: PALETTE.cyan, incident: PALETTE.red, financial: PALETTE.green, network: PALETTE.blue, mission: PALETTE.amber, surveillance: '#a78bfa',
}

export default function ReportDetail() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const { reports, remove } = useReports()
  const s = useEngine()
  const [tab, setTab] = useState('document')
  const [copied, setCopied] = useState(false)
  const [del, setDel] = useState(false)

  const report = useMemo(() => reports.find((r) => r.id === reportId || r.number === reportId), [reports, reportId])

  if (!report) {
    return (
      <ScreenWrap className="pb-6">
        <PageHeader eyebrow="REPORTS · NOT FOUND" title="Report Unavailable" subtitle="This report may have been deleted from local storage." icon={FileText} />
        <Panel title="No report">
          <EmptyState icon={FileText} title={`No report matches "${reportId ?? ''}"`} message="Return to the library and pick a report from the list."
            action={<button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/reports')}><ArrowLeft size={10} /> Back to library</button>}
          />
        </Panel>
      </ScreenWrap>
    )
  }

  const Icon = ICON[report.type]
  const color = COLOR[report.type]
  const text = reportToText(report)
  const sectionCount = 3 + report.analysis.length + report.metrics.length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      audio.play('keystroke')
    } catch { /* clipboard unavailable */ }
  }

  const print = () => window.print()

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow={`REPORTS · ${report.type.toUpperCase()}`}
        title={report.title}
        subtitle={`${report.number} · ${report.department} · compiled ${relTime(report.generated)}`}
        icon={Icon}
        meta={
          <>
            <span className="badge badge-amber">{report.classification}</span>
            <span className="badge badge-grey">{report.type.toUpperCase()}</span>
            <span className="badge badge-grey">{report.author}</span>
            <span className="badge badge-cyan">{sectionCount} SECTIONS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/reports')}><ArrowLeft size={11} /> Library</button>
            <button type="button" className="btn btn-sm" onClick={copy}>{copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied' : 'Copy'}</button>
            <button type="button" className="btn btn-sm" onClick={print}><Printer size={11} /> Print</button>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`${report.number}.txt`, text, 'text/plain')}><Download size={11} /> txt</button>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`${report.number}.csv`, reportToCSV(report), 'text/csv')}><Download size={11} /> csv</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setDel(true)}><Trash2 size={11} /></button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'document', label: 'Document' }, { id: 'raw', label: 'Raw text' }, { id: 'meta', label: 'Metadata' }]} />
        <StatusPill value="published" label="LOCAL ONLY" />
        <span className="ml-auto mono text-[8.5px] text-ink-3">operator {s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? '—'} · session {s.sessionId ? String(s.sessionId).slice(0, 12) : 'local'}</span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {tab === 'document' && (
            <>
              <Panel title="Document" icon={FileText} bodyClassName="p-0">
                <div className="border-b border-line bg-[#0a1219] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color }} />
                      <span className="font-display text-[10px] tracking-[0.22em] text-ink-3">SHADOW SYSTEMS</span>
                    </div>
                    <span className="mono text-[8px] text-ink-3">{report.number}</span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="label-xs">CLASSIFICATION · {report.classification}</p>
                  <h1 className="mt-1 font-display text-[16px] leading-tight text-ink">{report.title}</h1>
                  <p className="mono mt-0.5 text-[8.5px] text-ink-3">{report.department} · {fmtDateTime(report.generated)} · {report.author}</p>

                  <Divider label="01 · SUMMARY" />
                  <p className="text-[11px] leading-relaxed text-ink-2">{report.summary}</p>

                  <Divider label="02 · ANALYSIS" />
                  <ol className="space-y-1.5">
                    {report.analysis.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[10.5px] leading-relaxed text-ink-2">
                        <span className="mono shrink-0 text-[9px] text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>

                  <Divider label="03 · METRICS" />
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {report.metrics.map((m) => (
                      <div key={m.label} className="border border-line bg-bg p-2">
                        <p className="label-xs truncate">{m.label}</p>
                        <p className="mono text-[12px] text-ink">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <Divider label="04 · NOTICE" />
                  <p className="text-[9.5px] leading-relaxed text-ink-3">
                    This document is entirely fictional and was assembled from generated demonstration data inside the SHADOW
                    SYSTEMS simulation. It describes no real person, organisation, account or event.
                  </p>
                  <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-amber">SIMULATED — NOT A REAL INTELLIGENCE PRODUCT</span>
                    <span className="mono text-[8px] text-ink-3">END · {report.number}</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Metric Comparison" icon={ListChecks}>
                <BarsTrend
                  horizontal
                  data={report.metrics.map((m) => ({ name: m.label.slice(0, 16), v: Number(String(m.value).replace(/[^\d.]/g, '')) || 0 }))}
                  keys={[{ key: 'v', color, label: 'Value' }]}
                  height={Math.max(120, report.metrics.length * 26)}
                  xKey="name"
                />
                <ChartLegend items={[{ label: 'Numeric portion of each metric', color }]} />
              </Panel>
            </>
          )}

          {tab === 'raw' && (
            <Panel title="Raw Text Export" icon={FileText}
              actions={<button type="button" className="btn btn-sm" onClick={() => downloadFile(`${report.number}.txt`, text, 'text/plain')}><Download size={10} /> Download</button>}
            >
              <pre className="terminal-window max-h-[60vh] overflow-auto whitespace-pre p-3 font-terminal text-[9.5px] leading-relaxed text-ink-2">{text}</pre>
              <p className="mt-1.5 font-mono text-[8px] text-ink-3">{text.length} characters · {text.split('\n').length} lines · UTF-8 · plain text</p>
            </Panel>
          )}

          {tab === 'meta' && (
            <Panel title="Metadata" icon={Info}>
              <KeyValue
                items={[
                  { k: 'Number', v: report.number },
                  { k: 'Title', v: report.title },
                  { k: 'Type', v: report.type },
                  { k: 'Department', v: report.department },
                  { k: 'Author', v: report.author },
                  { k: 'Generated', v: fmtDateTime(report.generated) },
                  { k: 'Classification', v: report.classification },
                  { k: 'Analysis lines', v: String(report.analysis.length) },
                  { k: 'Metrics', v: String(report.metrics.length) },
                  { k: 'Storage key', v: 'shadow-systems-reports' },
                ]}
              />
              <Divider />
              <p className="text-[9.5px] leading-relaxed text-ink-3">
                Reports persist in <code className="mono text-[var(--accent)]">localStorage</code> under the key above. Clearing
                site data removes them permanently.
              </p>
            </Panel>
          )}
        </div>

        <div className="space-y-3">
          <Panel title="Summary Card" icon={Icon} actions={<StatusPill value="active" label={report.type.toUpperCase()} dot={false} />}>
            <p className="text-[10.5px] leading-relaxed text-ink-2">{report.summary}</p>
            <Divider />
            <KeyValue
              items={[
                { k: 'Generated', v: relTime(report.generated) },
                { k: 'Author', v: report.author },
                { k: 'Metrics', v: String(report.metrics.length) },
              ]}
            />
          </Panel>

          <Panel title="Metrics" icon={ListChecks}>
            <div className="space-y-1.5">
              {report.metrics.map((m) => {
                const v = Number(String(m.value).replace(/[^\d.]/g, ''))
                return (
                  <div key={m.label}>
                    <div className="flex justify-between"><span className="truncate text-[10px] text-ink-2">{m.label}</span><span className="mono text-[9px] text-ink-3">{m.value}</span></div>
                    {Number.isFinite(v) && v > 0 && <Progress value={Math.min(100, v > 100 ? 100 : v)} height={2} color={color} />}
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Classification" icon={ShieldAlert}>
            <p className="mono text-[10px] text-amber">{report.classification}</p>
            <p className="mt-1 text-[9.5px] leading-relaxed text-ink-3">
              The classification label is decorative. Reports contain only generated demonstration data and no real information of
              any kind.
            </p>
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone={color}>{report.type.toUpperCase()}</Tag><Tag tone="#f5b942">FICTIONAL</Tag><Tag tone="#38db91">LOCAL</Tag></div>
          </Panel>

          <Panel title="Related Reports" icon={FileText} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {reports.filter((r) => r.id !== report.id && r.type === report.type).slice(0, 4).map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => navigate(`/reports/${r.id}`)} className="w-full px-2.5 py-1.5 text-left hover:bg-elevated">
                    <span className="mono block text-[8px] text-[var(--accent)]">{r.number}</span>
                    <span className="block truncate text-[10px] text-ink-2">{r.title}</span>
                  </button>
                </li>
              ))}
              {reports.filter((r) => r.id !== report.id && r.type === report.type).length === 0 && (
                <li className="px-2.5 py-2 text-[9.5px] text-ink-3">No other {report.type} reports.</li>
              )}
            </ul>
          </Panel>

          <Panel title="All Departments" icon={CopyCheck}>
            <div className="flex flex-wrap gap-1">
              {REPORT_TYPES.map((t) => (
                <button key={t.id} type="button" className="badge badge-grey hover:text-ink" onClick={() => navigate(`/reports/${t.id === 'incident' ? 'cyber' : t.id === 'financial' ? 'financial' : t.id === 'network' ? 'network' : t.id === 'mission' ? 'missions' : t.id === 'intelligence' ? 'intelligence' : 'reports'}`)}>
                  {t.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional document">
        This report is generated demonstration material. Copying or exporting it produces a file that states it is simulated — do
        not represent it as a real assessment.
      </InlineAlert>

      <Modal open={del} onClose={() => setDel(false)} title="Delete Report" subtitle={report.number} icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setDel(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { remove(report.id); setDel(false); navigate('/reports') }}><Trash2 size={11} /> Delete report</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">This removes {report.number} from local storage and returns you to the library.</p>
      </Modal>
    </Screen>
  )
}
