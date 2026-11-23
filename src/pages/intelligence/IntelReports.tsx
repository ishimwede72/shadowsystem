import { useMemo, useState } from 'react'
import { FileText, Download, Printer, RefreshCw, Plus, ShieldCheck, Clock } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, SeverityPill, Select, KeyValue, InlineAlert, Divider, EmptyState, Tag, Modal } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, pad, relTime } from '@/lib/utils'

interface IntelReport {
  id: string
  title: string
  classification: string
  caseId: string
  author: string
  created: string
  body: string
}

export default function IntelReports() {
  const s = useEngine()
  const operator = s.operators.find((o) => o.id === s.currentOperatorId)
  const [selectedCase, setSelectedCase] = useState(s.cases[0]?.id ?? '')
  const [reports, setReports] = useState<IntelReport[]>(() =>
    s.cases.slice(0, 3).map((c, i) => ({
      id: `INTREP-${pad(101 + i, 3)}`,
      title: `${c.title} — Assessment`,
      classification: c.priority === 'critical' ? 'HIGH' : 'ELEVATED',
      caseId: c.id,
      author: operator?.callsign ?? 'OPERATOR',
      created: c.updated,
      body: buildBody(c.id),
    })),
  )
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)

  function buildBody(caseId: string) {
    const kase = s.cases.find((c) => c.id === caseId)
    if (!kase) return 'No case selected.'
    const people = s.identities.filter((i) => kase.profileIds.includes(i.id))
    const orgs = s.organizations.filter((o) => kase.orgIds.includes(o.id))
    const ev = s.evidence.filter((e) => kase.evidenceIds.includes(e.id))
    return [
      `SHADOW SYSTEMS — INTELLIGENCE ASSESSMENT`,
      `CASE ${kase.code} / ${kase.id}`,
      `TITLE: ${kase.title}`,
      `STATUS: ${kase.status.toUpperCase()} · PRIORITY: ${kase.priority.toUpperCase()}`,
      `LEAD: ${kase.lead}`,
      ``,
      `1. SUMMARY`,
      kase.summary,
      ``,
      `2. PERSONS OF INTEREST (${people.length})`,
      ...(people.length ? people.map((p) => `   • ${p.name} — ${p.occupation}, ${p.nationality} (risk ${p.risk})`) : ['   • none linked']),
      ``,
      `3. LINKED ORGANISATIONS (${orgs.length})`,
      ...(orgs.length ? orgs.map((o) => `   • ${o.name} — ${o.category}, ${o.hq}`) : ['   • none linked']),
      ``,
      `4. EVIDENCE (${ev.length})`,
      ...(ev.length ? ev.map((e) => `   • ${e.id} [${e.category}] ${e.description} — ${e.status}`) : ['   • none attached']),
      ``,
      `5. ASSESSMENT`,
      `Confidence in the current picture is moderate. Progress stands at ${kase.progress}%.`,
      `Recommended next step: corroborate the linked financial flow and review the top two associates.`,
      ``,
      `This document is entirely fictional and generated for demonstration purposes.`,
      `SIMULATED — NOT A REAL INTELLIGENCE PRODUCT.`,
    ].join('\n')
  }

  const generate = () => {
    const kase = s.cases.find((c) => c.id === selectedCase)
    if (!kase) return
    const rep: IntelReport = {
      id: `INTREP-${pad(101 + reports.length, 3)}`,
      title: `${kase.title} — Assessment`,
      classification: kase.priority === 'critical' ? 'HIGH' : 'ELEVATED',
      caseId: kase.id,
      author: operator?.callsign ?? 'OPERATOR',
      created: new Date().toISOString(),
      body: buildBody(kase.id),
    }
    setReports((r) => [rep, ...r])
    setOpen(false)
    s.notify({ type: 'success', title: 'Intelligence report generated', body: rep.id, severity: 'low', module: 'intelligence' })
    s.emit('AI.REPORT_GENERATED', { id: rep.id, kind: 'intelligence', caseId: kase.id })
  }

  const exportReport = (r: IntelReport) => downloadFile(`${r.id}.txt`, r.body, 'text/plain')
  const exportAll = () => downloadFile(`shadow-intel-reports-${Date.now()}.txt`, reports.map((r) => r.body).join('\n\n' + '='.repeat(64) + '\n\n'), 'text/plain')

  const detailReport = reports.find((r) => r.id === detail)

  const stats = useMemo(() => ({
    total: reports.length,
    high: reports.filter((r) => r.classification === 'HIGH').length,
    cases: new Set(reports.map((r) => r.caseId)).size,
  }), [reports])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · REPORT STUDIO"
        title="Intelligence Reports"
        subtitle="Generate structured fictional assessments from live case data, then export or print them."
        icon={FileText}
        meta={
          <>
            <span className="badge badge-cyan">{stats.total} REPORTS</span>
            <span className="badge badge-red">{stats.high} HIGH</span>
            <span className="badge badge-grey">{stats.cases} CASES</span>
            <span className="badge badge-amber">SIMULATED</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={exportAll}><Download size={11} /> Export all</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(true)}><Plus size={11} /> Generate</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Panel title="Report Index" icon={FileText} bodyClassName="p-0" actions={<span className="badge badge-grey">{reports.length}</span>}>
            <ul className="max-h-[52vh] divide-y divide-line-soft overflow-y-auto">
              {reports.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setDetail(r.id)} className="w-full px-2.5 py-2 text-left hover:bg-elevated" data-selected={detail === r.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[8.5px] text-[var(--accent)]">{r.id}</span>
                      <span className="badge badge-amber">{r.classification}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-ink">{r.title}</p>
                    <p className="mt-0.5 font-mono text-[8px] text-ink-3">{r.author} · {relTime(r.created)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Generator" icon={RefreshCw}>
            <Select label="Case" value={selectedCase} onChange={setSelectedCase} options={s.cases.map((c) => ({ value: c.id, label: `${c.code} · ${c.title.slice(0, 22)}` }))} />
            <button type="button" className="btn btn-primary w-full mt-2" onClick={generate}><FileText size={11} /> Generate assessment</button>
            <Divider />
            <KeyValue
              cols={1}
              items={[
                { k: 'Author', v: operator?.callsign ?? 'OPERATOR' },
                { k: 'Template', v: 'INTREP v2 (sim)' },
                { k: 'Sources', v: 'Case, people, orgs, evidence' },
                { k: 'Output', v: 'Plain-text dossier' },
              ]}
            />
          </Panel>

          <Panel title="Disclaimer" icon={ShieldCheck}>
            <p className="text-[10px] leading-relaxed text-ink-2">
              Each generated document ends with an explicit simulated-content notice. Nothing produced here describes a real
              case, person or organisation.
            </p>
          </Panel>
        </div>

        <Panel
          title={detailReport ? `${detailReport.id} · ${detailReport.title}` : 'Report Preview'}
          icon={FileText}
          subtitle={detailReport ? `Case ${s.cases.find((c) => c.id === detailReport.caseId)?.code ?? '—'} · ${fmtDateTime(detailReport.created)}` : 'Select or generate a report'}
          actions={detailReport ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => exportReport(detailReport)}><Download size={10} /> Export</button>
              <button type="button" className="btn btn-sm" onClick={() => window.print()}><Printer size={10} /> Print</button>
            </>
          ) : undefined}
        >
          {detailReport ? (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-1">
                <Tag tone="#28d8ea">SIMULATED</Tag>
                <Tag tone="#f5b942">{detailReport.classification}</Tag>
                <Tag>{detailReport.author}</Tag>
                <span className="ml-auto flex items-center gap-1 font-mono text-[8.5px] text-ink-3"><Clock size={8} /> {relTime(detailReport.created)}</span>
              </div>
              <Doc label="INTELLIGENCE ASSESSMENT">{detailReport.body}</Doc>
              <div className="mt-2 flex items-center justify-between">
                <StatusPill value="active" label="DRAFT · SIMULATED" />
                <span className="font-mono text-[8px] text-ink-3">SHADOW SYSTEMS · INTELLIGENCE DIRECTORATE</span>
              </div>
            </>
          ) : (
            <EmptyState icon={FileText} title="No report selected" message="Pick one from the index or generate a fresh assessment." action={<button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(true)}><Plus size={10} /> Generate report</button>} />
          )}
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Fictional product">
        Intelligence assessments are assembled from generated data. They must never be presented as real findings.
      </InlineAlert>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate Intelligence Report"
        subtitle="Composes a dossier from the selected case and linked records"
        icon={FileText}
        footer={<>
          <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={generate}><FileText size={11} /> Generate</button>
        </>}
      >
        <div className="space-y-3">
          <Select label="Case" value={selectedCase} onChange={setSelectedCase} options={s.cases.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }))} />
          {s.cases.find((c) => c.id === selectedCase) && (
            <div className="border border-line bg-bg p-2">
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] text-[var(--accent)]">{s.cases.find((c) => c.id === selectedCase)!.code}</span>
                <SeverityPill value={s.cases.find((c) => c.id === selectedCase)!.priority} />
              </div>
              <p className="mt-1 text-[10.5px] text-ink-2">{s.cases.find((c) => c.id === selectedCase)!.summary}</p>
            </div>
          )}
          <p className="font-mono text-[9px] text-ink-3">Output includes persons, organisations, evidence and an explicit simulated notice.</p>
        </div>
      </Modal>
    </Screen>
  )
}
