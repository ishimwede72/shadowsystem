import { useMemo, useState } from 'react'
import {
  BrainCircuit, Play, Download, ShieldAlert, Network as NetworkIcon, Activity,
  Layers, ArrowUpRight, Check, RefreshCw, ScanLine, Gauge,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, InlineAlert, Divider, KeyValue, Tag, EmptyState, Tabs, Progress } from '@/components/ui'
import { RadarMetric, PALETTE, BarsTrend, AreaTrend, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { answer } from '@/services/ai'
import { downloadFile, toCSV } from '@/lib/utils'

interface Run {
  id: string
  label: string
  createdAt: string
  scores: { axis: string; value: number }[]
  summary: string
  findings: string[]
}

export default function AIAnalysis() {
  const navigate = useNavigate()
  const s = useEngine()
  const [scope, setScope] = useState('all')
  const [running, setRunning] = useState(false)
  const [runs, setRuns] = useState<Run[]>([
    {
      id: 'ANL-001',
      label: 'Baseline sweep',
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
      scores: [
        { axis: 'Cyber', value: 58 },
        { axis: 'Network', value: 74 },
        { axis: 'Finance', value: 66 },
        { axis: 'Intel', value: 61 },
        { axis: 'Surveillance', value: 80 },
        { axis: 'Missions', value: 55 },
      ],
      summary: 'Baseline cross-module sweep completed. No single domain is critical.',
      findings: [
        'Two critical security findings dominate the cyber score.',
        'Network average load is moderate with isolated congestion.',
        'Surveillance availability is the healthiest domain.',
      ],
    },
  ])
  const [selected, setSelected] = useState('ANL-001')
  const [tab, setTab] = useState('radar')

  const run = runs.find((r) => r.id === selected) ?? runs[0]

  const compute = () => {
    setRunning(true)
    window.setTimeout(() => {
      const crit = s.findings.filter((f) => f.severity === 'critical').length
      const nodes = s.networkNodes.filter((n) => n.status === 'online').length / Math.max(1, s.networkNodes.length)
      const cams = s.cameras.filter((c) => c.status === 'online').length / Math.max(1, s.cameras.length)
      const pending = s.transactions.filter((t) => t.status === 'pending').length
      const live = s.cases.filter((c) => c.status === 'open' || c.status === 'active').length
      const missions = s.missions.filter((m) => m.status === 'active').length
      const id = `ANL-${String(runs.length + 1).padStart(3, '0')}`
      const next: Run = {
        id,
        label: `Sweep ${runs.length + 1}`,
        createdAt: new Date().toISOString(),
        scores: [
          { axis: 'Cyber', value: Math.max(10, 100 - crit * 18) },
          { axis: 'Network', value: Math.round(nodes * 100) },
          { axis: 'Finance', value: Math.max(20, 100 - pending * 8) },
          { axis: 'Intel', value: Math.min(100, 40 + live * 6) },
          { axis: 'Surveillance', value: Math.round(cams * 100) },
          { axis: 'Missions', value: Math.min(100, 45 + missions * 10) },
        ],
        summary: `Computed from the live store: ${crit} critical findings, ${Math.round(nodes * 100)}% of nodes online, ${Math.round(cams * 100)}% of cameras online.`,
        findings: analysisFor(s, crit, pending),
      }
      setRuns((r) => [next, ...r])
      setSelected(id)
      setRunning(false)
      s.notify({ type: 'ai', title: 'Analysis sweep complete', body: next.id, severity: 'low', module: 'ai' })
    }, 900)
  }

  const overview = useMemo(() => answer('Summarise the current operational picture'), [])

  const exportRun = () => {
    if (!run) return
    downloadFile(`${run.id}-analysis.csv`, toCSV(run.scores.map((x) => ({ analysis: run.id, axis: x.axis, value: x.value }))), 'text/csv')
  }

  const riskText = answer('Rank the top risks across the platform')

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SHADOW AI · ANALYSIS"
        title="Cross-Module Analysis"
        subtitle="Score every domain with deterministic rules over the live store, then compare sweeps over time."
        icon={BrainCircuit}
        meta={
          <>
            <span className="badge badge-cyan">{runs.length} SWEEPS</span>
            <span className="badge badge-grey">6 DOMAINS</span>
            <span className="badge badge-green">RULE-BASED</span>
            <span className="badge badge-amber">FICTIONAL</span>
          </>
        }
        actions={
          <>
            <Select className="w-36" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All domains' }, { value: 'cyber', label: 'Cyber only' }, { value: 'network', label: 'Network only' }, { value: 'finance', label: 'Finance only' }]} />
            <button type="button" className="btn btn-sm" onClick={exportRun} disabled={!run}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={compute} disabled={running}><Play size={11} /> {running ? 'Analysing…' : 'Run sweep'}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sweeps" value={runs.length} icon={ScanLine} accent="cyan" />
        <StatCard label="Average score" value={run ? Math.round(run.scores.reduce((a, x) => a + x.value, 0) / run.scores.length) : '—'} icon={Gauge} accent="green" />
        <StatCard label="Lowest domain" value={run ? [...run.scores].sort((a, b) => a.value - b.value)[0].axis : '—'} icon={ShieldAlert} accent="red" />
        <StatCard label="Findings" value={run?.findings.length ?? 0} icon={Activity} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <Panel title="Domain Scores" icon={BrainCircuit} actions={run && <StatusPill value="active" label={run.id} dot={false} />}>
            {run ? (
              tab === 'radar' ? (
                <RadarMetric data={run.scores} height={230} />
              ) : (
                <div className="space-y-1.5">
                  {run.scores.map((x) => (
                    <div key={x.axis}>
                      <div className="flex justify-between"><span className="text-[10px] text-ink-2">{x.axis}</span><span className="mono text-[9px] text-ink-3">{x.value}/100</span></div>
                      <Progress value={x.value} height={3} color={x.value > 70 ? PALETTE.green : x.value > 45 ? PALETTE.amber : PALETTE.red} />
                    </div>
                  ))}
                </div>
              )
            ) : <EmptyState icon={BrainCircuit} title="No sweep" />}
            <div className="mt-2 flex items-center justify-center gap-1">
              <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'radar', label: 'Radar' }, { id: 'bars', label: 'Bars' }]} />
            </div>
          </Panel>

          <Panel title="Sweep History" icon={RefreshCw} bodyClassName="p-0">
            <ul className="max-h-[220px] divide-y divide-line-soft overflow-y-auto">
              {runs.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSelected(r.id)} data-selected={selected === r.id} className="flex w-full items-center justify-between px-2.5 py-1.5 text-left hover:bg-elevated">
                    <span className="min-w-0">
                      <span className="mono block text-[9px] text-[var(--accent)]">{r.id}</span>
                      <span className="block truncate text-[10px] text-ink-2">{r.label}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="mono text-[9px] text-ink-3">{Math.round(r.scores.reduce((a, x) => a + x.value, 0) / r.scores.length)}</span>
                      <span className="mono text-[7.5px] text-ink-3">{new Date(r.createdAt).toISOString().slice(11, 16)}Z</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-3">
          {run && (
            <Panel title={run.label} subtitle={run.id} icon={ScanLine}>
              <p className="text-[10.5px] leading-relaxed text-ink-2">{run.summary}</p>
              <Divider label="FINDINGS" />
              <ul className="space-y-1.5">
                {run.findings.map((f, i) => (
                  <li key={i} className="flex gap-1.5 border-b border-line-soft/50 pb-1.5 text-[10px] leading-relaxed text-ink-2">
                    <Check size={10} className="mt-0.5 shrink-0 text-green" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL RULES</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
            </Panel>
          )}

          <Panel title="Cross-domain Comparison" icon={Layers}>
            <AreaTrend
              data={runs.slice().reverse().map((r, i) => ({
                t: `S${i + 1}`,
                cyber: r.scores[0].value,
                network: r.scores[1].value,
                intel: r.scores[3].value,
              }))}
              keys={[{ key: 'cyber', color: PALETTE.cyan, label: 'Cyber' }, { key: 'network', color: PALETTE.green, label: 'Network' }, { key: 'intel', color: PALETTE.amber, label: 'Intel' }]}
              height={190}
            />
            <ChartLegend items={[{ label: 'Cyber', color: PALETTE.cyan }, { label: 'Network', color: PALETTE.green }, { label: 'Intel', color: PALETTE.amber }]} />
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Live Store Summary" icon={Activity}>
          <pre className="terminal-window max-h-[260px] overflow-auto whitespace-pre-wrap p-2 font-terminal text-[9.5px] leading-relaxed text-ink-2">{overview.content}</pre>
          <div className="mt-2 flex flex-wrap gap-1">
            {overview.refs?.map((r) => (
              <button key={r.path} type="button" className="btn btn-sm" onClick={() => navigate(r.path)}><ArrowUpRight size={9} /> {r.label}</button>
            ))}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Risk Ranking" icon={ShieldAlert}>
            <pre className="terminal-window max-h-[180px] overflow-auto whitespace-pre-wrap p-2 font-terminal text-[9.5px] leading-relaxed text-ink-2">{riskText.content}</pre>
          </Panel>
          <Panel title="Domain Weights" icon={NetworkIcon}>
            <BarsTrend
              horizontal
              data={run ? run.scores.map((x) => ({ name: x.axis, v: x.value })) : []}
              keys={[{ key: 'v', color: PALETTE.blue, label: 'Score' }]}
              height={170}
              xKey="name"
            />
          </Panel>
          <Panel title="Method" icon={BrainCircuit}>
            <KeyValue
              items={[
                { k: 'Engine', v: 'Deterministic rules' },
                { k: 'Inputs', v: 'Live store fields' },
                { k: 'Outputs', v: '6 axis scores' },
                { k: 'Model calls', v: '0' },
                { k: 'Storage', v: 'IN-MEMORY' },
              ]}
            />
          </Panel>
        </div>
      </div>

      <Panel title="Score Explanation" icon={Gauge}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="label-xs mb-1">CYBER</p>
            <p className="text-[10px] leading-relaxed text-ink-2">Starts at 100 and subtracts 18 per critical finding.</p>
          </div>
          <div>
            <p className="label-xs mb-1">NETWORK</p>
            <p className="text-[10px] leading-relaxed text-ink-2">Percentage of nodes currently online in the simulated topology.</p>
          </div>
          <div>
            <p className="label-xs mb-1">FINANCE</p>
            <p className="text-[10px] leading-relaxed text-ink-2">Starts at 100 and subtracts 8 per pending settlement.</p>
          </div>
        </div>
        <Divider />
        <InlineAlert tone="cyan" title="Transparent scoring">
          Every axis is a simple, documented formula over store values — nothing is hidden or learned.
        </InlineAlert>
      </Panel>
    </Screen>
  )
}

function analysisFor(s: ReturnType<typeof useEngine.getState>, crit: number, pending: number): string[] {
  const out: string[] = []
  out.push(crit > 0 ? `${crit} critical cyber finding${crit === 1 ? '' : 's'} require remediation.` : 'No critical cyber findings remain.')
  out.push(`${s.networkNodes.filter((n) => n.status !== 'online').length} network nodes are not fully online.`)
  out.push(pending > 0 ? `${pending} settlements are pending in the simulated ledger.` : 'No settlements are pending.')
  out.push(`${s.cameras.filter((c) => c.status !== 'online').length} surveillance feeds are degraded or offline.`)
  out.push(`${s.cases.filter((c) => c.status === 'open' || c.status === 'active').length} investigations are open or active.`)
  return out
}
