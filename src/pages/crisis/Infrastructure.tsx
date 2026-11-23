import { useMemo, useState } from 'react'
import {
  Building2, Zap, Droplets, RadioTower, Landmark, HeartPulse, TrainFront, Search,
  Download, RefreshCw, Wrench, Activity, Gauge, MapPin, ChevronRight, ShieldAlert, PieChart,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, Divider, KeyValue, Tag, Modal, Progress, Tabs } from '@/components/ui'
import { BarsTrend, Donut, PALETTE, ChartLegend, RadarMetric, AreaTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, pad, relTime, toCSV } from '@/lib/utils'
import type { InfrastructureNode } from '@/types'

const TYPE_ICON: Record<InfrastructureNode['type'], typeof Zap> = {
  GRID: Zap, WATER: Droplets, TELECOM: RadioTower, FINANCE: Landmark, HEALTH: HeartPulse, TRANSIT: TrainFront,
}
const TYPE_COLOR: Record<InfrastructureNode['type'], string> = {
  GRID: PALETTE.amber, WATER: PALETTE.cyan, TELECOM: PALETTE.blue, FINANCE: PALETTE.green, HEALTH: '#e879f9', TRANSIT: '#a78bfa',
}

export default function Infrastructure() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [tab, setTab] = useState('all')
  const [overrides, setOverrides] = useState<Record<string, Partial<InfrastructureNode>>>({})
  const [selected, setSelected] = useState<string | null>(s.infrastructure[0]?.id ?? null)
  const [repairOpen, setRepairOpen] = useState(false)

  const nodes = useMemo(
    () => s.infrastructure.map((n) => ({ ...n, ...(overrides[n.id] ?? {}) })),
    [s.infrastructure, overrides],
  )

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return nodes.filter((n) => {
      if (t && !`${n.name} ${n.region} ${n.id}`.toLowerCase().includes(t)) return false
      if (type !== 'all' && n.type !== type) return false
      if (tab === 'degraded' && n.status === 'nominal') return false
      if (tab === 'critical' && n.status !== 'critical' && n.status !== 'offline') return false
      return true
    })
  }, [nodes, q, type, tab])

  const node = nodes.find((n) => n.id === selected)

  const avg = Math.round(nodes.reduce((a, n) => a + n.health, 0) / Math.max(1, nodes.length))
  const load = Math.round(nodes.reduce((a, n) => a + n.load, 0) / Math.max(1, nodes.length))

  const byType = useMemo(() => {
    const types: InfrastructureNode['type'][] = ['GRID', 'WATER', 'TELECOM', 'FINANCE', 'HEALTH', 'TRANSIT']
    return types.map((t) => ({
      name: t,
      health: Math.round(nodes.filter((n) => n.type === t).reduce((a, n) => a + n.health, 0) / Math.max(1, nodes.filter((n) => n.type === t).length)),
      count: nodes.filter((n) => n.type === t).length,
    }))
  }, [nodes])

  const timeline = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({
      t: `${pad(i * 2)}:00`,
      grid: 88 + Math.round(Math.sin(i / 2) * 8),
      telecom: 92 + Math.round(Math.cos(i / 3) * 5),
      water: 84 + Math.round(Math.sin(i / 4 + 1) * 9),
    })),
    [],
  )

  const repair = () => {
    if (!node) return
    setOverrides((o) => ({ ...o, [node.id]: { health: Math.min(100, node.health + 18), status: node.health + 18 >= 85 ? 'nominal' : node.health + 18 >= 60 ? 'degraded' : 'critical', load: Math.max(10, node.load - 6) } }))
    s.notify({ type: 'success', title: 'Maintenance ticket applied', body: `${node.name} simulated repair`, severity: 'low', module: 'crisis' })
    s.logActivity({ module: 'crisis', actor: 'OPERATOR', action: 'Infrastructure maintenance', detail: node.name, level: 'success' })
    setRepairOpen(false)
  }

  const degrade = (id: string) => {
    const n = nodes.find((x) => x.id === id)
    if (!n) return
    setOverrides((o) => ({ ...o, [id]: { health: Math.max(5, n.health - 25), status: n.health - 25 < 40 ? 'critical' : 'degraded', load: Math.min(99, n.load + 12) } }))
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRISIS · INFRASTRUCTURE"
        title="Infrastructure Monitor"
        subtitle="Simulated utility and service health across regional nodes. Maintenance actions affect local state only."
        icon={Building2}
        meta={
          <>
            <span className="badge badge-cyan">{nodes.length} NODES</span>
            <span className="badge badge-green">{nodes.filter((n) => n.status === 'nominal').length} NOMINAL</span>
            <span className="badge badge-amber">{nodes.filter((n) => n.status === 'degraded').length} DEGRADED</span>
            <span className="badge badge-red">{nodes.filter((n) => n.status === 'critical' || n.status === 'offline').length} CRITICAL</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-infrastructure.csv', toCSV(nodes.map(({ id, name, type, health, status, region, load }) => ({ id, name, type, health, status, region, load }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm" onClick={() => setOverrides({})}><RefreshCw size={11} /> Reset local</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setRepairOpen(true)} disabled={!node}><Wrench size={11} /> Maintenance</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Average health" value={`${avg}%`} icon={Activity} accent={avg > 80 ? 'green' : 'amber'} />
        <StatCard label="Average load" value={`${load}%`} icon={Gauge} accent={load > 80 ? 'red' : 'cyan'} />
        <StatCard label="Degraded" value={nodes.filter((n) => n.status !== 'nominal').length} icon={ShieldAlert} accent="amber" />
        <StatCard label="Regions" value={new Set(nodes.map((n) => n.region)).size} icon={MapPin} accent="blue" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Health by Type" icon={Building2} className="lg:col-span-2">
          <BarsTrend
            data={byType}
            keys={[{ key: 'health', color: PALETTE.cyan, label: 'Health %' }]}
            height={190}
            xKey="name"
          />
          <ChartLegend items={[{ label: 'Average health', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Service Mix" icon={PieChart}>
          <Donut
            data={byType.map((t) => ({ name: t.name, value: t.count, color: TYPE_COLOR[t.name as InfrastructureNode['type']] }))}
            height={180}
            centerLabel="NODES"
            centerValue={String(nodes.length)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <Panel title="Infrastructure Nodes" icon={Building2} bodyClassName="p-0"
          actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: nodes.length }, { id: 'degraded', label: 'Degraded', count: nodes.filter((n) => n.status !== 'nominal').length }, { id: 'critical', label: 'Critical', count: nodes.filter((n) => n.status === 'critical' || n.status === 'offline').length }]} />}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-2.5 py-1.5">
            <div className="relative min-w-[180px] flex-1">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search node, region or id…" className="field pl-7" />
            </div>
            <Select className="w-32" value={type} onChange={setType} options={[{ value: 'all', label: 'All types' }, ...byType.map((t) => ({ value: t.name, label: t.name }))]} />
          </div>
          <div className="max-h-[46vh] overflow-auto">
            <table className="data-table min-w-[680px]">
              <thead><tr><th>ID</th><th>Node</th><th>Type</th><th>Region</th><th>Health</th><th>Load</th><th>Status</th><th /></tr></thead>
              <tbody>
                {filtered.map((n) => {
                  const Icon = TYPE_ICON[n.type]
                  return (
                    <tr key={n.id} className="cursor-pointer" data-selected={selected === n.id} onClick={() => setSelected(n.id)}>
                      <td className="mono text-[8.5px] text-ink-3">{n.id}</td>
                      <td><span className="flex items-center gap-1.5"><Icon size={10} style={{ color: TYPE_COLOR[n.type] }} /><span className="text-[10.5px] text-ink">{n.name}</span></span></td>
                      <td className="mono text-[8.5px] text-ink-3">{n.type}</td>
                      <td className="text-[9.5px] text-ink-3">{n.region}</td>
                      <td>
                        <span className="flex items-center gap-1">
                          <Progress value={n.health} height={2} className="w-14" color={n.health > 80 ? PALETTE.green : n.health > 50 ? PALETTE.amber : PALETTE.red} />
                          <span className="mono text-[8.5px] text-ink-3">{n.health}%</span>
                        </span>
                      </td>
                      <td className="mono text-[9px] text-ink-3">{n.load}%</td>
                      <td><StatusPill value={n.status} dot={false} /></td>
                      <td><button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); degrade(n.id) }} title="Simulate degradation"><ShieldAlert size={9} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Building2} title="No nodes match" />}
          </div>
        </Panel>

        <div className="space-y-3">
          {node && (
            <Panel title={node.name} subtitle={node.id} icon={TYPE_ICON[node.type]} actions={<StatusPill value={node.status} />}>
              <KeyValue
                items={[
                  { k: 'Type', v: node.type },
                  { k: 'Region', v: node.region },
                  { k: 'Health', v: `${node.health}%` },
                  { k: 'Load', v: `${node.load}%` },
                ]}
              />
              <Divider />
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between"><span className="label-xs">HEALTH</span><span className="mono text-[8.5px] text-ink-3">{node.health}%</span></div>
                  <Progress value={node.health} height={3} color={node.health > 80 ? PALETTE.green : node.health > 50 ? PALETTE.amber : PALETTE.red} />
                </div>
                <div>
                  <div className="flex justify-between"><span className="label-xs">LOAD</span><span className="mono text-[8.5px] text-ink-3">{node.load}%</span></div>
                  <Progress value={node.load} height={3} color={node.load > 80 ? PALETTE.red : PALETTE.cyan} />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button type="button" className="btn btn-sm" onClick={() => setRepairOpen(true)}><Wrench size={10} /> Maintain</button>
                <button type="button" className="btn btn-sm" onClick={() => degrade(node.id)}><ShieldAlert size={10} /> Degrade</button>
              </div>
              {overrides[node.id] && <p className="mt-1.5 font-mono text-[8px] text-amber">LOCAL OVERRIDE ACTIVE — reset to restore generated values.</p>}
            </Panel>
          )}

          <Panel title="Regional Radar" icon={MapPin}>
            <RadarMetric data={byType.map((t) => ({ axis: t.name.slice(0, 7), value: t.health }))} height={180} />
          </Panel>

          <Panel title="Service Notes" icon={RadioTower}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Health below 60% flips a node to critical.</li>
              <li>• Load above 80% is flagged amber.</li>
              <li>• Maintenance adds +18% health locally.</li>
              <li>• Nothing persists across a full reload.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Health Trend (simulated)" icon={Activity}>
          <AreaTrend
            data={timeline}
            keys={[{ key: 'grid', color: PALETTE.amber, label: 'GRID' }, { key: 'telecom', color: PALETTE.blue, label: 'TELECOM' }, { key: 'water', color: PALETTE.cyan, label: 'WATER' }]}
            height={190}
          />
          <ChartLegend items={[{ label: 'GRID', color: PALETTE.amber }, { label: 'TELECOM', color: PALETTE.blue }, { label: 'WATER', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Node Register" icon={Building2} bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Region</th><th>Nodes</th><th>Avg health</th><th>Worst</th></tr></thead>
            <tbody>
              {Array.from(new Set(nodes.map((n) => n.region))).map((r) => {
                const list = nodes.filter((n) => n.region === r)
                const worst = [...list].sort((a, b) => a.health - b.health)[0]
                return (
                  <tr key={r}>
                    <td className="text-[10px] text-ink">{r}</td>
                    <td className="mono text-[9.5px] text-ink-3">{list.length}</td>
                    <td className="mono text-[9.5px] text-ink-3">{Math.round(list.reduce((a, n) => a + n.health, 0) / list.length)}%</td>
                    <td className="text-[9.5px] text-ink-3">{worst?.name ?? '—'} <span className="mono text-[8px]">({worst?.health}%)</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Inspector" icon={ChevronRight}>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="#28d8ea">SIMULATED TELEMETRY</Tag>
          <Tag tone="#f5b942">NO REAL UTILITIES</Tag>
          <Tag tone="#38db91">LOCAL ONLY</Tag>
          <span className="ml-auto mono text-[8.5px] text-ink-3">last sync {relTime(new Date().toISOString())}</span>
        </div>
        <Divider />
        <div className="grid gap-2 sm:grid-cols-3">
          <KeyValue cols={1} items={[{ k: 'Simulated time', v: new Date(s.simulatedTime).toISOString().slice(11, 19) + 'Z' }, { k: 'Speed', v: `${s.speed}×` }]} />
          <KeyValue cols={1} items={[{ k: 'Paused', v: s.paused ? 'YES' : 'NO' }, { k: 'Tick', v: String(s.tick) }]} />
          <KeyValue cols={1} items={[{ k: 'Overrides', v: String(Object.keys(overrides).length) }, { k: 'Seed', v: String(s.seed) }]} />
        </div>
      </Panel>

      <InlineAlert tone="cyan" title="Fictional infrastructure">
        These are not real power, water, telecom, financial, health or transit systems. The monitor exists to demonstrate a
        crisis workflow with generated data.
      </InlineAlert>

      <Modal open={repairOpen} onClose={() => setRepairOpen(false)} title="Maintenance Ticket" subtitle={node ? `${node.name} · ${node.id}` : ''} icon={Wrench}
        footer={<>
          <button type="button" className="btn" onClick={() => setRepairOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={repair}><Wrench size={11} /> Dispatch maintenance</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          Dispatching maintenance adds +18% health and reduces load by 6 points for this node in the current session. No real
          crew, ticket or dispatch system is contacted.
        </p>
        {node && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="border border-line bg-bg p-2"><p className="label-xs">CURRENT</p><p className="mono text-[11px] text-ink">{node.health}%</p></div>
            <div className="border border-line bg-bg p-2"><p className="label-xs">AFTER</p><p className="mono text-[11px] text-green">{Math.min(100, node.health + 18)}%</p></div>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
