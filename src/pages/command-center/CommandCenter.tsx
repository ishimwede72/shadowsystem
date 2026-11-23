import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, Crosshair, Cctv, CircleDot,
  Gauge, Globe2, LayoutGrid, Network, Pause, Play, Radio,
  ShieldCheck, Siren, SlidersHorizontal, TrendingUp, Wallet, X, Settings2,
  ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw, Minimize2,
} from 'lucide-react'
import {
  Panel, PageHeader, StatCard, StatusPill, Progress, Screen, SeverityPill,
  Tabs, EmptyState, Toggle, InlineAlert,
} from '@/components/ui'
import { WorldMap } from '@/components/maps/WorldMap'
import { AreaTrend, Donut, PALETTE, ChartLegend, LineTrend } from '@/components/charts'
import { useEngine, selectOperator } from '@/services/engine'
import { cn, fmtMoney, fmtCompact, fmtTime, relTime } from '@/lib/utils'
import { CITIES } from '@/data/vocabulary'
import type { ModuleKey } from '@/types'

interface WidgetDef {
  id: string
  label: string
  module: ModuleKey
  span: 1 | 2 | 3 | 4
}

const WIDGETS: WidgetDef[] = [
  { id: 'map', label: 'Global Operations Map', module: 'geoint', span: 4 },
  { id: 'feed', label: 'Live Operations Feed', module: 'command', span: 1 },
  { id: 'health', label: 'System Health', module: 'command', span: 1 },
  { id: 'missions', label: 'Active Missions', module: 'missions', span: 1 },
  { id: 'incidents', label: 'Recent Incidents', module: 'crisis', span: 1 },
  { id: 'finance', label: 'Financial Throughput', module: 'finance', span: 2 },
  { id: 'network', label: 'Network Telemetry', module: 'network', span: 2 },
  { id: 'threat', label: 'Threat Surface', module: 'cyber', span: 1 },
  { id: 'surveillance', label: 'Surveillance Matrix', module: 'surveillance', span: 1 },
  { id: 'ai', label: 'SHADOW AI Brief', module: 'ai', span: 2 },
]

const DEFAULT_LAYOUT: Record<string, { visible: boolean; order: number }> = Object.fromEntries(
  WIDGETS.map((w, i) => [w.id, { visible: true, order: i }]),
)

export default function CommandCenter() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const s = useEngine()
  const operator = useEngine(selectOperator)
  const [customize, setCustomize] = useState(params.get('customize') === '1')
  const [layout, setLayout] = useState<Record<string, { visible: boolean; order: number }>>(() => {
    try {
      const saved = localStorage.getItem('ss-dashboard-layout')
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT
    } catch {
      return DEFAULT_LAYOUT
    }
  })
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => (localStorage.getItem('ss-dash-density') as 'compact' | 'comfortable') ?? 'comfortable')
  const [feedFilter, setFeedFilter] = useState('all')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    localStorage.setItem('ss-dashboard-layout', JSON.stringify(layout))
  }, [layout])

  useEffect(() => {
    localStorage.setItem('ss-dash-density', density)
  }, [density])

  useEffect(() => {
    if (params.get('customize') === '1') setCustomize(true)
  }, [params])

  const closeCustomize = () => {
    setCustomize(false)
    if (params.get('customize')) {
      params.delete('customize')
      setParams(params, { replace: true })
    }
  }

  const txCompleted = s.transactions.filter((t) => t.status === 'completed')
  const txPending = s.transactions.filter((t) => t.status === 'pending')
  const critical = s.crisisIncidents.filter((c) => c.severity === 'critical')
  const activeMissions = s.missions.filter((m) => m.status === 'active' || m.status === 'paused')
  const onlineCams = s.cameras.filter((c) => c.status === 'online').length
  const avgHealth = s.services.reduce((a, x) => a + x.health, 0) / s.services.length

  const feed = useMemo(() => {
    const entries = [
      ...s.bus.slice(0, 40).map((b) => ({
        ts: b.ts,
        text: `${b.topic}${Object.keys(b.payload).length ? ' · ' + JSON.stringify(b.payload).slice(0, 64) : ''}`,
        level: b.severity === 'critical' ? 'critical' : b.severity === 'elevated' ? 'warning' : 'info',
        source: 'BUS',
      })),
      ...s.activity.slice(0, 40).map((a) => ({
        ts: a.ts,
        text: `${a.module.toUpperCase()} · ${a.action}`,
        level: a.level,
        source: a.actor,
      })),
    ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
    const filtered = feedFilter === 'all' ? entries : entries.filter((e) => e.level === feedFilter)
    return filtered.slice(0, 40)
  }, [s.bus, s.activity, feedFilter])

  const mapMarkers = useMemo(() => {
    const markers = [
      ...s.targets.map((t) => ({
        id: t.id,
        label: t.codename,
        lat: t.position.lat,
        lng: t.position.lng,
        tone: (t.risk === 'severe' || t.risk === 'high' ? 'red' : t.risk === 'elevated' ? 'amber' : 'cyan') as 'red' | 'amber' | 'cyan',
        kind: 'target' as const,
        meta: `${t.city} · ${t.status.toUpperCase()}`,
        pulse: t.moving,
      })),
      ...activeMissions.map((m, i) => ({
        id: m.id,
        label: m.code,
        lat: CITIES[i * 5 % CITIES.length].lat,
        lng: CITIES[i * 5 % CITIES.length].lng,
        tone: 'amber' as const,
        kind: 'mission' as const,
        meta: `${m.progress}% complete`,
      })),
      ...s.networkNodes.filter((n) => n.zone === 'CORE' || n.zone === 'EDGE').slice(0, 5).map((n, i) => ({
        id: n.id,
        label: n.hostname,
        lat: CITIES[(i * 7 + 3) % CITIES.length].lat,
        lng: CITIES[(i * 7 + 3) % CITIES.length].lng,
        tone: (n.status === 'online' ? 'blue' : 'red') as 'blue' | 'red',
        kind: 'node' as const,
        meta: `${n.type} · ${n.status}`,
      })),
      ...s.crisisIncidents.filter((c) => c.severity === 'critical').map((c, i) => ({
        id: c.id,
        label: c.id,
        lat: CITIES[(i * 9 + 5) % CITIES.length].lat,
        lng: CITIES[(i * 9 + 5) % CITIES.length].lng,
        tone: 'red' as const,
        kind: 'alert' as const,
        pulse: true,
        meta: c.title,
      })),
    ]
    return markers
  }, [s.targets, activeMissions, s.networkNodes, s.crisisIncidents])

  const mapArcs = useMemo(
    () =>
      s.targets.slice(0, 4).map((t, i) => ({
        id: `arc-${t.id}`,
        from: { lat: t.lastPosition.lat, lng: t.lastPosition.lng },
        to: { lat: t.position.lat, lng: t.position.lng },
        tone: (i % 2 === 0 ? 'cyan' : 'green') as 'cyan' | 'green',
      })),
    [s.targets],
  )

  const financeSeries = useMemo(() => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    return days.map((d, i) => ({
      t: d,
      completed: Math.round(40 + Math.sin(i / 1.4) * 22 + (txCompleted.length % 17)),
      pending: Math.round(10 + Math.cos(i / 1.7) * 6 + (txPending.length % 7)),
    }))
  }, [txCompleted.length, txPending.length])

  const threatRadar = [
    { axis: 'Phishing', value: 62 },
    { axis: 'Malware', value: 44 },
    { axis: 'Insider', value: 28 },
    { axis: 'DDoS', value: 71 },
    { axis: 'Credential', value: 55 },
    { axis: 'Supply', value: 36 },
  ]
  void threatRadar

  const orderedWidgets = useMemo(
    () => [...WIDGETS].sort((a, b) => (layout[a.id]?.order ?? 0) - (layout[b.id]?.order ?? 0)).filter((w) => layout[w.id]?.visible !== false),
    [layout],
  )

  const moveWidget = (id: string, dir: -1 | 1) => {
    setLayout((l) => {
      const cur = l[id]?.order ?? 0
      const swap = Object.entries(l).find(([, v]) => v.order === cur + dir)
      if (!swap) return l
      return { ...l, [id]: { ...l[id], order: cur + dir }, [swap[0]]: { ...l[swap[0]], order: cur } }
    })
  }

  const resetLayout = () => setLayout(DEFAULT_LAYOUT)

  const gap = density === 'compact' ? 'gap-2' : 'gap-3'

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow={`COMMAND CENTER · ${operator.callsign} · ${operator.clearance}`}
        title="Command Center"
        subtitle="Centralized simulation control and operational awareness."
        icon={LayoutGrid}
        meta={
          <>
            <span className="badge badge-green"><span className="dot animate-[pulse-dot_2s_infinite] bg-green" /> ENGINE RUNNING</span>
            <span className="badge badge-grey">SESSION {s.sessionId.slice(4, 14)}</span>
            <span className="badge badge-grey">SEED {s.seed}</span>
            <span className="badge badge-cyan">{activeMissions.length} ACTIVE MISSIONS</span>
            {critical.length > 0 && <span className="badge badge-red">{critical.length} CRITICAL</span>}
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setExpanded(v => !v)}>
              {expanded ? <Minimize2 size={11} /> : <Eye size={11} />} {expanded ? 'Exit focus' : 'Focus map'}
            </button>
            <button type="button" className={cn('btn btn-sm', customize && 'btn-primary')} onClick={() => (customize ? closeCustomize() : setCustomize(true))}>
              <SlidersHorizontal size={11} /> Customize
            </button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/cinematic')}>
              <Eye size={11} /> Presentation
            </button>
          </>
        }
      />

      {/* metrics */}
      <div className={cn('grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8', gap)}>
        <StatCard label="Simulated Operations" value={s.transactions.length * 4 + s.activity.length * 3} icon={Activity} accent="cyan" delta={{ value: 12.4 }} sub="all-time" />
        <StatCard label="Active Missions" value={activeMissions.length} icon={Crosshair} accent="amber" sub={`${s.missions.length} total`} onClick={() => navigate('/missions/active')} />
        <StatCard label="Connected Nodes" value={s.networkNodes.filter((n) => n.status !== 'offline').length} icon={Network} accent="blue" sub={`of ${s.networkNodes.length} simulated`} onClick={() => navigate('/network/topology')} />
        <StatCard label="Active Targets" value={s.targets.filter((t) => t.moving).length} icon={Globe2} accent="cyan" sub={`${s.targets.length} tracked`} onClick={() => navigate('/geoint/targets')} />
        <StatCard label="Pending Transfers" value={txPending.length} icon={Wallet} accent="green" sub={fmtMoney(txPending.reduce((a, t) => a + t.amount, 0), 'USD', true)} onClick={() => navigate('/finance/transactions?status=pending')} />
        <StatCard label="Critical Incidents" value={critical.length} icon={Siren} accent="red" sub={`${s.crisisIncidents.length} total`} onClick={() => navigate('/crisis')} />
        <StatCard label="Surveillance Feeds" value={`${onlineCams}/${s.cameras.length}`} icon={Cctv} accent="blue" sub="online cameras" onClick={() => navigate('/surveillance/cameras')} />
        <StatCard label="System Health" value={`${avgHealth.toFixed(1)}%`} icon={Gauge} accent="green" sub={`${s.services.length} services`} onClick={() => navigate('/command-center/health')} />
      </div>

      {/* customize drawer */}
      {customize && (
        <Panel title="Dashboard Customization" icon={Settings2} corners={false}
          actions={<button type="button" className="icon-btn" onClick={closeCustomize} aria-label="Close"><X size={13} /></button>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="label-xs mb-2">Widget visibility & order</p>
              <ul className="space-y-1">
                {Object.entries(layout)
                  .sort((a, b) => a[1].order - b[1].order)
                  .map(([id, cfg]) => {
                    const w = WIDGETS.find((x) => x.id === id)
                    if (!w) return null
                    return (
                      <li key={id} className="flex items-center justify-between gap-2 border border-line-soft px-2 py-1.5">
                        <span className="flex items-center gap-2">
                          <button type="button" onClick={() => setLayout((l) => ({ ...l, [id]: { ...cfg, visible: !cfg.visible } }))} className="text-ink-3 hover:text-ink" aria-label={cfg.visible ? 'Hide widget' : 'Show widget'}>
                            {cfg.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <span className={cn('text-[11px]', cfg.visible ? 'text-ink-2' : 'text-ink-3 line-through')}>{w.label}</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <button type="button" className="icon-btn !h-5 !w-5" onClick={() => moveWidget(id, -1)} aria-label="Move up"><ChevronUp size={11} /></button>
                          <button type="button" className="icon-btn !h-5 !w-5" onClick={() => moveWidget(id, 1)} aria-label="Move down"><ChevronDown size={11} /></button>
                        </span>
                      </li>
                    )
                  })}
              </ul>
            </div>
            <div className="space-y-3">
              <div>
                <p className="label-xs mb-2">Layout density</p>
                <div className="flex gap-1">
                  {(['compact', 'comfortable'] as const).map((d) => (
                    <button key={d} type="button" onClick={() => setDensity(d)} className={cn('btn btn-sm flex-1 capitalize', density === d && 'btn-primary')}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-xs mb-2">Additional metrics</p>
                <div className="space-y-1.5">
                  <Toggle checked label="Show sparkline trends" onChange={() => {}} />
                  <Toggle checked label="Show deltas vs. previous period" onChange={() => {}} />
                  <Toggle checked={s.autoUpdate} label="Auto-refresh telemetry" onChange={(v) => useEngine.setState({ autoUpdate: v })} />
                </div>
              </div>
              <div className="flex gap-2 border-t border-line-soft pt-3">
                <button type="button" className="btn btn-sm" onClick={resetLayout}><RotateCcw size={11} /> Restore default</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={closeCustomize}>Save layout</button>
              </div>
              <p className="font-mono text-[9px] text-ink-3">Layout is saved to this browser automatically.</p>
            </div>
          </div>
        </Panel>
      )}

      {/* main grid */}
      <div className={cn('grid grid-cols-1 xl:grid-cols-4', gap)}>
        {orderedWidgets.map((w) => {
          if (expanded && w.id !== 'map') return null
          const colSpan = expanded && w.id === 'map' ? 'xl:col-span-4' : w.span === 4 ? 'xl:col-span-4' : w.span === 3 ? 'xl:col-span-3' : w.span === 2 ? 'xl:col-span-2' : 'xl:col-span-1'
          return (
            <div key={w.id} className={cn(colSpan, w.id === 'map' && expanded && 'min-h-[70vh]')}>
              {w.id === 'map' && (
                <Panel title="Global Operations Map" icon={Globe2} subtitle="Simulated targets · missions · nodes · incidents"
                  actions={
                    <>
                      <span className="badge badge-cyan">{mapMarkers.length} MARKERS</span>
                      <button type="button" className="icon-btn" onClick={() => navigate('/geoint/world')} title="Open full map"><ArrowUpRight size={13} /></button>
                    </>
                  }
                  bodyClassName="p-0"
                  className={expanded ? 'h-[68vh]' : 'h-[400px] sm:h-[460px]'}
                >
                  <WorldMap
                    markers={mapMarkers}
                    arcs={mapArcs}
                    selectedId={selectedTarget}
                    onSelect={(id) => {
                      setSelectedTarget(id)
                      if (id.startsWith('TGT')) navigate(`/geoint/targets?q=${id}`)
                    }}
                    className="h-full"
                  />
                </Panel>
              )}

              {w.id === 'feed' && (
                <Panel title="Live Operations Feed" icon={Radio} className="h-[400px]"
                  actions={<span className="flex items-center gap-1 font-mono text-[8.5px] uppercase text-green"><CircleDot size={8} className="animate-pulse" /> LIVE</span>}
                  bodyClassName="p-0"
                >
                  <div className="border-b border-line-soft px-2 py-1.5">
                    <Tabs size="sm" value={feedFilter} onChange={setFeedFilter} className="border-0"
                      tabs={[{ id: 'all', label: 'All' }, { id: 'info', label: 'Info' }, { id: 'warning', label: 'Warn' }, { id: 'critical', label: 'Crit' }]}
                    />
                  </div>
                  <div className="h-[calc(100%-72px)] overflow-y-auto font-terminal text-[10.5px]">
                    {feed.map((f, i) => (
                      <div key={i} className="flex gap-1.5 border-b border-line-soft/40 px-2 py-[3px]">
                        <span className="shrink-0 text-ink-3">{fmtTime(f.ts)}</span>
                        <span className={cn('shrink-0', f.level === 'critical' ? 'text-red' : f.level === 'warning' ? 'text-amber' : f.level === 'success' ? 'text-green' : 'text-[var(--accent)]')}>
                          {f.level === 'critical' ? '✖' : f.level === 'warning' ? '▲' : f.level === 'success' ? '✔' : '›'}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-ink-2">{f.text}</span>
                      </div>
                    ))}
                    {feed.length === 0 && <p className="p-3 text-ink-3">No events match this filter.</p>}
                  </div>
                </Panel>
              )}

              {w.id === 'health' && (
                <Panel title="System Health" icon={ShieldCheck} className="h-[400px]" actions={<button type="button" className="icon-btn" aria-label="Open /command-center/health" title="Open /command-center/health" onClick={() => navigate('/command-center/health')}><ArrowUpRight size={13} /></button>} bodyClassName="p-2">
                  <ul className="space-y-1.5">
                    {s.services.map((svc) => (
                      <li key={svc.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[10.5px] text-ink-2">{svc.name}</span>
                          <span className={cn('mono text-[9.5px] tabular', svc.health > 99 ? 'text-green' : 'text-amber')}>{svc.health.toFixed(2)}%</span>
                        </div>
                        <div className="mt-[3px] h-[3px] w-full bg-[#16212b]">
                          <div className="h-full" style={{ width: `${svc.health}%`, background: svc.health > 99 ? PALETTE.green : PALETTE.amber }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 border-t border-line-soft pt-2">
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-ink-3">
                      <span>Aggregate</span>
                      <span className="text-green">{avgHealth.toFixed(1)}%</span>
                    </div>
                  </div>
                </Panel>
              )}

              {w.id === 'missions' && (
                <Panel title="Active Missions" icon={Crosshair} className="h-[400px]" actions={<button type="button" className="icon-btn" aria-label="Open /missions/active" title="Open /missions/active" onClick={() => navigate('/missions/active')}><ArrowUpRight size={13} /></button>} bodyClassName="p-0">
                  {activeMissions.length === 0 ? (
                    <EmptyState icon={Crosshair} title="No active missions" message="Start a scenario from mission control." action={<button type="button" className="btn btn-sm" onClick={() => navigate('/missions/templates')}>Browse templates</button>} />
                  ) : (
                    <ul className="divide-y divide-line-soft">
                      {activeMissions.map((m) => (
                        <li key={m.id} className="p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">{m.code}</p>
                              <p className="truncate text-[11.5px] text-ink">{m.name}</p>
                            </div>
                            <SeverityPill value={m.severity} />
                          </div>
                          <p className="mt-1 truncate text-[10px] text-ink-3">{m.currentStage}</p>
                          <Progress value={m.progress} color={m.status === 'paused' ? PALETTE.amber : PALETTE.cyan} showValue />
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="badge badge-grey">{m.category}</span>
                            <button type="button" className="btn btn-sm" onClick={() => navigate('/missions/active')}>
                              {m.status === 'paused' ? <Play size={9} /> : <Pause size={9} />} Open
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-line p-2">
                    <button type="button" className="btn btn-sm w-full" onClick={() => navigate('/missions/builder')}>New mission</button>
                  </div>
                </Panel>
              )}

              {w.id === 'incidents' && (
                <Panel title="Recent Incidents" icon={AlertTriangle} className="h-[400px]" actions={<button type="button" className="icon-btn" aria-label="Open /crisis/incidents" title="Open /crisis/incidents" onClick={() => navigate('/crisis/incidents')}><ArrowUpRight size={13} /></button>} bodyClassName="p-0">
                  <ul className="divide-y divide-line-soft">
                    {s.crisisIncidents.slice(0, 5).map((c) => (
                      <li key={c.id} className="px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="mono text-[9.5px] text-ink-3">{c.id}</span>
                          <SeverityPill value={c.severity} />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-ink">{c.title}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="mono text-[9px] text-ink-3">{relTime(c.reported)}</span>
                          <StatusPill value={c.status} dot={false} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-line p-2">
                    <button type="button" className="btn btn-sm w-full" onClick={() => navigate('/crisis')}>Open crisis center</button>
                  </div>
                </Panel>
              )}

              {w.id === 'finance' && (
                <Panel title="Financial Throughput" icon={TrendingUp} subtitle="Simulated settlements per cycle" actions={<button type="button" className="icon-btn" aria-label="Open /finance" title="Open /finance" onClick={() => navigate('/finance')}><ArrowUpRight size={13} /></button>}>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="label-xs">Completed</p>
                      <p className="stat-value text-lg text-green">{txCompleted.length}</p>
                    </div>
                    <div>
                      <p className="label-xs">Pending</p>
                      <p className="stat-value text-lg text-amber">{txPending.length}</p>
                    </div>
                    <div>
                      <p className="label-xs">Volume</p>
                      <p className="stat-value text-lg text-ink">{fmtCompact(s.transactions.reduce((a, t) => a + t.amount, 0))}</p>
                    </div>
                  </div>
                  <AreaTrend data={financeSeries} keys={[{ key: 'completed', color: PALETTE.green, label: 'Completed' }, { key: 'pending', color: PALETTE.amber, label: 'Pending' }]} height={150} xKey="t" />
                  <ChartLegend items={[{ label: 'Completed', color: PALETTE.green }, { label: 'Pending', color: PALETTE.amber }]} />
                </Panel>
              )}

              {w.id === 'network' && (
                <Panel title="Network Telemetry" icon={Network} subtitle="Simulated traffic over 4 hours" actions={<button type="button" className="icon-btn" aria-label="Open /network/traffic" title="Open /network/traffic" onClick={() => navigate('/network/traffic')}><ArrowUpRight size={13} /></button>}>
                  <LineTrend data={s.traffic} keys={[{ key: 'inbound', color: PALETTE.cyan, label: 'Inbound' }, { key: 'outbound', color: PALETTE.blue, label: 'Outbound' }]} height={150} />
                  <div className="mt-1 flex items-center justify-between">
                    <ChartLegend items={[{ label: 'Inbound', color: PALETTE.cyan }, { label: 'Outbound', color: PALETTE.blue }]} />
                    <span className="mono text-[9px] text-ink-3">{s.networkLinks.filter((l) => l.status === 'up').length}/{s.networkLinks.length} LINKS UP</span>
                  </div>
                </Panel>
              )}

              {w.id === 'threat' && (
                <Panel title="Threat Surface" icon={ShieldCheck} subtitle="Simulated severity mix" actions={<button type="button" className="icon-btn" aria-label="Open /cyber" title="Open /cyber" onClick={() => navigate('/cyber')}><ArrowUpRight size={13} /></button>}>
                  <Donut
                    data={[
                      { name: 'Critical', value: s.findings.filter((f) => f.severity === 'critical').length, color: PALETTE.red },
                      { name: 'Elevated', value: s.findings.filter((f) => f.severity === 'elevated').length, color: PALETTE.amber },
                      { name: 'Low', value: s.findings.filter((f) => f.severity === 'low').length, color: PALETTE.green },
                    ]}
                    height={150}
                    centerLabel="FINDINGS"
                    centerValue={String(s.findings.length)}
                  />
                  <ChartLegend items={[
                    { label: 'Critical', color: PALETTE.red },
                    { label: 'Elevated', color: PALETTE.amber },
                    { label: 'Low', color: PALETTE.green },
                  ]} />
                </Panel>
              )}

              {w.id === 'surveillance' && (
                <Panel title="Surveillance Matrix" icon={Cctv} subtitle="Feed status across zones" actions={<button type="button" className="icon-btn" aria-label="Open /surveillance/cameras" title="Open /surveillance/cameras" onClick={() => navigate('/surveillance/cameras')}><ArrowUpRight size={13} /></button>}>
                  <div className="grid grid-cols-4 gap-1">
                    {s.cameras.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => navigate(`/surveillance/cameras?q=${c.id}`)}
                        className={cn('relative aspect-video overflow-hidden border text-left',
                          c.status === 'online' ? 'border-[#1b6349] bg-[#0a2a20]' : c.status === 'degraded' ? 'border-[#6d5320] bg-[#241d0f]' : 'border-line bg-[#0d141b]',
                        )}
                        title={`${c.label} · ${c.status}`}
                      >
                        <span className={cn('absolute inset-x-0 top-0 h-[1px]', c.status === 'online' ? 'bg-green opacity-60' : 'bg-ink-3 opacity-20')} />
                        <span className="absolute bottom-0.5 left-0.5 font-mono text-[6.5px] text-ink-3">{c.id.replace('CAM-', '')}</span>
                        {c.status === 'online' && <span className="absolute right-0.5 top-0.5 h-1 w-1 animate-pulse rounded-full bg-green" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase text-ink-3">
                    <span>{onlineCams} ONLINE</span>
                    <span>{s.surveillanceIncidents.filter((i) => i.status === 'open').length} OPEN INCIDENTS</span>
                  </div>
                </Panel>
              )}

              {w.id === 'ai' && (
                <Panel title="SHADOW AI · Operational Brief" icon={Bot} subtitle="Grounded in current simulation state"
                  actions={<button type="button" className="btn btn-sm" onClick={() => navigate('/ai/chat')}><Bot size={10} /> Open assistant</button>}
                >
                  <div className="space-y-2 text-[11.5px] leading-relaxed text-ink-2">
                    <p className="border-l-2 border-[var(--accent)]/50 pl-2.5">
                      Operational picture refreshed. <strong className="text-ink">{activeMissions.length} missions</strong> are in
                      flight, <strong className="text-ink">{critical.length} critical incidents</strong> are logged and{' '}
                      <strong className="text-ink">{s.notifications.filter((n) => !n.read).length} notifications</strong> are unread.
                    </p>
                    <p className="border-l-2 border-line pl-2.5 text-ink-3">
                      Financial ledger holds {s.transactions.length} simulated transactions with{' '}
                      {fmtMoney(s.transactions.reduce((a, t) => a + t.amount, 0), 'USD', true)} aggregate volume across{' '}
                      {s.banks.length} fictional institutions.
                    </p>
                    <p className="border-l-2 border-line pl-2.5 text-ink-3">
                      Geospatial module is tracking {s.targets.length} fictional targets; {s.targets.filter((t) => t.moving).length} are
                      currently in motion. Network topology reports {s.networkLinks.filter((l) => l.status !== 'up').length} degraded or
                      down links.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['Summarize active missions', 'Generate incident report', 'Explain network status'].map((q) => (
                        <button key={q} type="button" className="badge badge-grey hover:border-[var(--accent)] hover:text-ink" onClick={() => navigate(`/ai/chat?q=${encodeURIComponent(q)}`)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </Panel>
              )}
            </div>
          )
        })}
      </div>

      {/* activity strip */}
      <Panel title="Recent Activity" icon={Activity} corners={false}
        actions={
          <>
            <span className="badge badge-grey">{s.activity.length} entries</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/command-center/activity')}>
              Full history <ArrowUpRight size={10} />
            </button>
          </>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-line-soft">
          {s.activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center gap-2 px-3 py-1.5">
              <span className={cn('dot shrink-0', a.level === 'success' ? 'bg-green' : a.level === 'warning' ? 'bg-amber' : a.level === 'critical' ? 'bg-red' : 'bg-[var(--accent)]')} />
              <span className="mono w-14 shrink-0 text-[9px] uppercase text-ink-3">{a.module}</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{a.action}</span>
              <span className="hidden shrink-0 font-mono text-[9px] text-ink-3 sm:block">{a.actor}</span>
              <span className="shrink-0 font-mono text-[9px] text-ink-3">{relTime(a.ts)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <InlineAlert tone="amber" title="Fictional simulation environment">
        All metrics, incidents, transactions and locations on this dashboard are generated by the local simulation engine.
        No real systems, institutions or individuals are represented or contacted.
      </InlineAlert>
    </Screen>
  )
}
