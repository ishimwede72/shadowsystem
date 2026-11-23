import { useMemo, useState } from 'react'
import { Bug, Download, Filter, Search, ShieldCheck, Wrench, AlertTriangle } from 'lucide-react'
import { Panel, PageHeader, Screen, SeverityPill, StatusPill, Progress, Select, Modal, KeyValue, InlineAlert, StatCard, Tabs, EmptyState } from '@/components/ui'
import { Donut, PALETTE, BarsTrend, RadarMetric } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, toCSV } from '@/lib/utils'
import type { SecurityFinding } from '@/types'

export default function Vulnerabilities() {
  const findings = useEngine((s) => s.findings)
  const updateFinding = useEngine((s) => s.updateFinding)
  const [q, setQ] = useState('')
  const [sev, setSev] = useState('all')
  const [status, setStatus] = useState('all')
  const [detail, setDetail] = useState<SecurityFinding | null>(null)
  const [tab, setTab] = useState('findings')

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return findings.filter((f) => {
      if (t && !`${f.title} ${f.asset} ${f.systemId}`.toLowerCase().includes(t)) return false
      if (sev !== 'all' && f.severity !== sev) return false
      if (status !== 'all' && f.status !== status) return false
      return true
    })
  }, [findings, q, sev, status])

  const systems = useMemo(() => {
    const map = new Map<string, SecurityFinding[]>()
    findings.forEach((f) => {
      const arr = map.get(f.asset) ?? []
      arr.push(f)
      map.set(f.asset, arr)
    })
    return Array.from(map.entries()).map(([asset, list]) => ({
      asset,
      count: list.length,
      critical: list.filter((f) => f.severity === 'critical').length,
      avg: list.reduce((a, f) => a + f.score, 0) / list.length,
      status: list.every((f) => f.status === 'remediated') ? 'remediated' : list.some((f) => f.severity === 'critical') ? 'critical' : 'open',
    }))
  }, [findings])

  const avgScore = findings.reduce((a, f) => a + f.score, 0) / Math.max(1, findings.length)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · ASSESSMENT"
        title="Vulnerability Assessment Simulator"
        subtitle="Pre-generated fictional findings with demonstration scoring and remediation guidance."
        icon={Bug}
        meta={
          <>
            <span className="badge badge-grey">{findings.length} FINDINGS</span>
            <span className="badge badge-red">{findings.filter((f) => f.severity === 'critical').length} CRITICAL</span>
            <span className="badge badge-amber">{findings.filter((f) => f.status === 'open').length} OPEN</span>
            <span className="badge badge-cyan">AVG SCORE {avgScore.toFixed(1)}</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadFile(`shadow-findings-${Date.now()}.csv`, toCSV(findings.map(({ id, asset, title, severity, score, status, remediation }) => ({ id, asset, title, severity, score, status, remediation }))), 'text/csv')}
          >
            <Download size={11} /> Export findings
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Critical" value={findings.filter((f) => f.severity === 'critical').length} icon={AlertTriangle} accent="red" />
        <StatCard label="Elevated" value={findings.filter((f) => f.severity === 'elevated').length} icon={ShieldCheck} accent="amber" />
        <StatCard label="Remediated" value={findings.filter((f) => f.status === 'remediated').length} icon={Wrench} accent="green" />
        <StatCard label="Assets in scope" value={systems.length} icon={Filter} accent="blue" sub="simulated hosts" />
      </div>

      <Tabs
        tabs={[
          { id: 'findings', label: 'Findings', count: findings.length },
          { id: 'assets', label: 'Assets', count: systems.length },
          { id: 'score', label: 'Scoring model' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'findings' && (
        <Panel title="Assessment Findings" icon={Bug} bodyClassName="p-0"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search findings…" className="field h-7 w-40 pl-7 text-[11px]" />
              </div>
              <Select className="w-28" value={sev} onChange={setSev} options={[{ value: 'all', label: 'All severity' }, { value: 'critical', label: 'Critical' }, { value: 'elevated', label: 'Elevated' }, { value: 'low', label: 'Low' }]} />
              <Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All status' }, { value: 'open', label: 'Open' }, { value: 'triaged', label: 'Triaged' }, { value: 'remediated', label: 'Remediated' }, { value: 'accepted', label: 'Accepted' }]} />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="data-table min-w-[820px]">
              <thead><tr><th>ID</th><th>Asset</th><th>Finding</th><th>Severity</th><th>Score</th><th>Status</th><th>Discovered</th><th></th></tr></thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td className="mono text-[10px] text-[var(--accent)]">{f.id}</td>
                    <td className="mono max-w-[140px] truncate text-[10px]">{f.asset}</td>
                    <td className="max-w-[240px] truncate text-[11px] text-ink-2">{f.title}</td>
                    <td><SeverityPill value={f.severity} /></td>
                    <td className="w-24">
                      <div className="flex items-center gap-1.5">
                        <Progress value={f.score * 10} color={f.severity === 'critical' ? PALETTE.red : f.severity === 'elevated' ? PALETTE.amber : PALETTE.green} height={3} />
                        <span className="mono w-7 text-right text-[9.5px] text-ink-2">{f.score}</span>
                      </div>
                    </td>
                    <td><StatusPill value={f.status} /></td>
                    <td className="mono whitespace-nowrap text-[9.5px]">{fmtDateTime(f.discovered).slice(0, 10)}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(f)}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Bug} title="No findings match" message="Adjust the severity or status filters." />}
          </div>
        </Panel>
      )}

      {tab === 'assets' && (
        <Panel title="Simulated Asset Surface" icon={ShieldCheck} bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Asset</th><th className="text-right">Findings</th><th className="text-right">Critical</th><th className="text-right">Mean score</th><th>State</th></tr></thead>
            <tbody>
              {systems.map((s) => (
                <tr key={s.asset}>
                  <td className="mono text-[10.5px] text-ink">{s.asset}</td>
                  <td className="mono text-right text-[10.5px]">{s.count}</td>
                  <td className="mono text-right text-[10.5px] text-red">{s.critical}</td>
                  <td className="mono text-right text-[10.5px] text-ink-2">{s.avg.toFixed(1)}</td>
                  <td><StatusPill value={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === 'score' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Score Distribution" icon={Bug}>
            <BarsTrend
              data={findings.map((f) => ({ t: f.id.replace('FND-', ''), score: f.score }))}
              keys={[{ key: 'score', color: PALETTE.amber, label: 'Score' }]}
              height={200}
              xKey="t"
            />
          </Panel>
          <Panel title="Coverage Radar" icon={ShieldCheck}>
            <RadarMetric
              data={[
                { axis: 'Network', value: 68 },
                { axis: 'Identity', value: 74 },
                { axis: 'Data', value: 52 },
                { axis: 'Endpoints', value: 81 },
                { axis: 'Apps', value: 64 },
                { axis: 'Cloud', value: 59 },
              ]}
              height={200}
            />
          </Panel>
          <Panel title="Severity Mix" icon={AlertTriangle}>
            <Donut
              data={[
                { name: 'Critical', value: findings.filter((f) => f.severity === 'critical').length, color: PALETTE.red },
                { name: 'Elevated', value: findings.filter((f) => f.severity === 'elevated').length, color: PALETTE.amber },
                { name: 'Low', value: findings.filter((f) => f.severity === 'low').length, color: PALETTE.green },
              ]}
              height={170}
            />
          </Panel>
          <Panel title="Scoring Model" icon={Filter}>
            <p className="text-[11px] leading-relaxed text-ink-2">
              Scores are generated demonstration values on a 0–10 scale loosely inspired by CVSS v3.1. They are not produced
              by a real assessment engine and must not be treated as security intelligence.
            </p>
            <div className="mt-2 space-y-1.5">
              {[['9.0 – 10.0', 'CRITICAL', PALETTE.red], ['7.0 – 8.9', 'ELEVATED', PALETTE.amber], ['4.0 – 6.9', 'MODERATE', PALETTE.blue], ['0.1 – 3.9', 'LOW', PALETTE.green]].map(([range, label, color]) => (
                <div key={range} className="flex items-center justify-between border-b border-line-soft/60 pb-1">
                  <span className="mono text-[10px] text-ink-2">{range}</span>
                  <span className="badge" style={{ color: color as string, borderColor: `${color}66`, background: `${color}15` }}>{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <InlineAlert tone="amber" title="Synthetic findings">
        Findings describe fictional assets inside the demonstration sandbox. No real host was scanned, probed or assessed.
      </InlineAlert>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.id ?? ''}
        subtitle={detail?.title}
        icon={Bug}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setDetail(null)}>Close</button>
            <button
              type="button"
              className="btn"
              onClick={() => { if (detail) { updateFinding(detail.id, { status: 'triaged' }); setDetail({ ...detail, status: 'triaged' }) } }}
            >
              Mark triaged
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { if (detail) { updateFinding(detail.id, { status: 'remediated' }); setDetail(null) } }}
            >
              <Wrench size={11} /> Mark remediated
            </button>
          </>
        }
      >
        {detail && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-2">
                <SeverityPill value={detail.severity} />
                <StatusPill value={detail.status} />
              </div>
              <div className="text-right">
                <p className="label-xs">DEMO SCORE</p>
                <p className={cn('stat-value text-lg', detail.score >= 8 ? 'text-red' : detail.score >= 5 ? 'text-amber' : 'text-green')}>{detail.score}</p>
              </div>
            </div>
            <KeyValue
              items={[
                { k: 'System ID', v: detail.systemId },
                { k: 'Asset', v: detail.asset },
                { k: 'Discovered', v: fmtDateTime(detail.discovered) },
                { k: 'Severity', v: detail.severity.toUpperCase() },
              ]}
            />
            <div>
              <p className="label-xs">Suggested remediation</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-2">{detail.remediation}</p>
            </div>
            <InlineAlert tone="cyan" title="Fictional record">
              This finding is pre-generated demonstration data. It does not describe a real vulnerability in a real system.
            </InlineAlert>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
