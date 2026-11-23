import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Rocket, Pause, Square, Plus, ArrowUpRight, Activity, Layers,
  Clock, CheckCircle2, AlertTriangle, Radio, Zap, Gauge, Workflow, ChevronRight,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, InlineAlert, Divider, KeyValue, Tag, Progress, EmptyState, Timestamp } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, BarsTrend, RadialGauge } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, relTime } from '@/lib/utils'

const MODULE_ROUTE: Record<string, string> = {
  command: '/command-center', finance: '/finance', cyber: '/cyber/overview', geoint: '/geoint', surveillance: '/surveillance',
  intelligence: '/intelligence', network: '/network', forensics: '/forensics', underground: '/underground/market',
  crypto: '/cryptography', ai: '/ai/chat', crisis: '/crisis', comms: '/communications', missions: '/missions', reports: '/reports',
}

export default function MissionDashboard() {
  const navigate = useNavigate()
  const s = useEngine()

  const active = s.missions.filter((m) => m.status === 'active')
  const paused = s.missions.filter((m) => m.status === 'paused')
  const done = s.missions.filter((m) => m.status === 'completed')
  const failed = s.missions.filter((m) => m.status === 'failed' || m.status === 'stopped')
  const live = active[0]

  const throughput = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ t: `${String(i * 2).padStart(2, '0')}h`, runs: 1 + Math.round(Math.abs(Math.sin(i / 2.2)) * 5), events: 8 + Math.round(Math.abs(Math.cos(i / 3)) * 12) })),
    [],
  )

  const moduleUsage = useMemo(() => {
    const m = new Map<string, number>()
    s.missions.forEach((ms) => ms.events.forEach((e) => m.set(e.module, (m.get(e.module) ?? 0) + 1)))
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [s.missions])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="MISSIONS · CONTROL"
        title="Mission Control"
        subtitle="Launch multi-module simulated operations and watch them drive the rest of the platform."
        icon={Rocket}
        meta={
          <>
            <span className="badge badge-green">{active.length} RUNNING</span>
            <span className="badge badge-amber">{paused.length} PAUSED</span>
            <span className="badge badge-cyan">{s.templates.length} TEMPLATES</span>
            <span className="badge badge-grey">{s.missions.length} TOTAL</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/missions/templates')}><Layers size={11} /> Templates</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/missions/builder')}><Plus size={11} /> Build mission</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active" value={active.length} icon={Activity} accent="green" onClick={() => navigate('/missions/active')} />
        <StatCard label="Paused" value={paused.length} icon={Pause} accent="amber" />
        <StatCard label="Completed" value={done.length} icon={CheckCircle2} accent="cyan" onClick={() => navigate('/missions/history')} />
        <StatCard label="Stopped" value={failed.length} icon={Square} accent="red" />
        <StatCard label="Templates" value={s.templates.length} icon={Layers} accent="blue" />
        <StatCard label="Events" value={s.missions.reduce((a, m) => a + m.events.length, 0)} icon={Zap} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        {live ? (
          <Panel
            title="Live Mission"
            subtitle={`${live.code} · ${live.category}`}
            icon={Radio}
            actions={<StatusPill value={live.status} label="LIVE" />}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-[15px] leading-tight text-ink">{live.name}</h3>
                <p className="mt-0.5 text-[10px] leading-relaxed text-ink-2">{live.description}</p>
              </div>
              <SeverityPill value={live.severity} />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Progress value={live.progress} height={5} className="flex-1" />
              <span className="mono text-[10px] text-[var(--accent)]">{live.progress}%</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[8.5px] text-ink-3">
              <span>STAGE: {live.currentStage}</span>
              <span>·</span>
              <span>ETA {live.etaMinutes}m</span>
              <span>·</span>
              <span>STARTED {relTime(live.startedAt)}</span>
              <span>·</span>
              <span>{live.events.length} EVENTS</span>
            </div>

            <div className="mt-2 flex gap-0.5">
              {live.events.map((e) => {
                const active = e.at <= (live.progress / 100) * live.etaMinutes * 60
                return (
                  <span key={e.id} title={e.label}
                    className={cn('h-1.5 flex-1', active ? (e.severity === 'critical' ? 'bg-red' : e.severity === 'elevated' ? 'bg-amber' : 'bg-[var(--accent)]') : 'bg-[#1c2a36]')}
                  />
                )
              })}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {live.modules.map((m) => (
                <button key={m} type="button" onClick={() => navigate(MODULE_ROUTE[m] ?? '/command-center')} className="badge badge-grey hover:text-ink">
                  {m.toUpperCase()} <ArrowUpRight size={8} />
                </button>
              ))}
            </div>

            <Divider />
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-sm" onClick={() => s.pauseMission(live.id)}><Pause size={10} /> Pause</button>
              <button type="button" className="btn btn-sm" onClick={() => s.completeMission(live.id)}><CheckCircle2 size={10} /> Complete</button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => s.stopMission(live.id)}><Square size={10} /> Stop</button>
              <button type="button" className="btn btn-sm ml-auto" onClick={() => navigate('/missions/active')}>Console <ChevronRight size={10} /></button>
            </div>
          </Panel>
        ) : (
          <Panel title="Live Mission" icon={Radio}>
            <EmptyState icon={Rocket} title="No active mission" message="Start one from the template library to drive the platform." action={<button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/missions/templates')}>Browse templates</button>} />
          </Panel>
        )}

        <div className="space-y-3">
          <Panel title="Mission Readiness" icon={Gauge}>
            <RadialGauge value={Math.round((active.length / Math.max(1, s.missions.length)) * 100)} color="#38db91" height={150} label="ENGAGED" suffix="%" />
            <p className="text-center font-mono text-[8px] text-ink-3">{active.length} of {s.missions.length} missions engaged</p>
          </Panel>
          <Panel title="Status Mix" icon={Activity}>
            <Donut
              data={['active', 'paused', 'completed', 'failed', 'stopped', 'draft'].map((st, i) => ({ name: st, value: s.missions.filter((m) => m.status === st).length, color: [PALETTE.green, PALETTE.amber, PALETTE.cyan, PALETTE.red, '#8b5cf6', '#65788b'][i] })).filter((d) => d.value > 0)}
              height={150}
              centerLabel="TOTAL"
              centerValue={String(s.missions.length)}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Throughput" icon={Clock} subtitle="Generated operational tempo">
          <AreaTrend data={throughput} keys={[{ key: 'runs', color: PALETTE.cyan, label: 'Runs' }, { key: 'events', color: PALETTE.blue, label: 'Events' }]} height={180} />
          <ChartLegend items={[{ label: 'Mission runs', color: PALETTE.cyan }, { label: 'Events fired', color: PALETTE.blue }]} />
        </Panel>
        <Panel title="Module Participation" icon={Layers}>
          <BarsTrend horizontal data={moduleUsage.slice(0, 8)} keys={[{ key: 'value', color: PALETTE.green, label: 'Events' }]} height={190} xKey="name" />
          <ChartLegend items={[{ label: 'Events by module', color: PALETTE.green }]} />
        </Panel>
      </div>

      <Panel title="Mission Board" icon={Workflow} bodyClassName="p-0"
        actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/missions/history')}>History <ArrowUpRight size={10} /></button>}
      >
        <table className="data-table">
          <thead><tr><th>Mission</th><th>Category</th><th>Severity</th><th>Status</th><th>Progress</th><th>Stage</th><th>Operator</th><th>Started</th></tr></thead>
          <tbody>
            {s.missions.map((m) => {
              const op = s.operators.find((o) => o.id === m.operatorId)
              return (
                <tr key={m.id} className="cursor-pointer" onClick={() => navigate('/missions/active')}>
                  <td>
                    <span className="mono block text-[8px] text-[var(--accent)]">{m.code}</span>
                    <span className="block truncate text-[10px] text-ink">{m.name}</span>
                  </td>
                  <td className="text-[9px] uppercase text-ink-3">{m.category}</td>
                  <td><SeverityPill value={m.severity} /></td>
                  <td><StatusPill value={m.status} dot={false} /></td>
                  <td>
                    <span className="flex items-center gap-1">
                      <Progress value={m.progress} height={2} className="w-14" />
                      <span className="mono text-[8.5px] text-ink-3">{m.progress}%</span>
                    </span>
                  </td>
                  <td className="max-w-[160px] truncate text-[9px] text-ink-3">{m.currentStage}</td>
                  <td className="mono text-[8.5px] text-ink-3">{op?.callsign ?? m.operatorId}</td>
                  <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(m.startedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Recent Events" icon={Zap} className="lg:col-span-2" bodyClassName="p-0">
          <ul className="max-h-[240px] divide-y divide-line-soft overflow-y-auto">
            {s.bus.filter((b) => b.topic.startsWith('MISSION.')).slice(0, 10).map((b) => (
              <li key={b.id} className="flex items-start gap-2 px-2.5 py-1.5">
                <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', b.severity === 'critical' ? 'bg-red' : b.severity === 'elevated' ? 'bg-amber' : 'bg-green')} />
                <span className="min-w-0 flex-1">
                  <span className="mono block truncate text-[9px] text-[var(--accent)]">{b.topic}</span>
                  <span className="block truncate text-[9.5px] text-ink-3">{String((b.payload as Record<string, unknown>).label ?? JSON.stringify(b.payload))}</span>
                </span>
                <span className="mono shrink-0 text-[7.5px] text-ink-3">{relTime(b.ts)}</span>
              </li>
            ))}
            {s.bus.filter((b) => b.topic.startsWith('MISSION.')).length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No mission events yet — start a mission.</li>}
          </ul>
        </Panel>

        <Panel title="Engine" icon={AlertTriangle}>
          <KeyValue
            items={[
              { k: 'Auto-run', v: s.autoUpdate ? 'ON' : 'OFF' },
              { k: 'Speed', v: `${s.speed}×` },
              { k: 'Paused', v: s.paused ? 'YES' : 'NO' },
              { k: 'Tick', v: String(s.tick) },
              { k: 'Last event', v: s.bus[0] ? relTime(s.bus[0].ts) : '—' },
            ]}
          />
          <Divider />
          <Timestamp ts={new Date().toISOString()} />
          <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL RUNNER</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Simulated operations">
        Missions are scripted demonstrations that drive other modules with generated events. Nothing is executed against a real
        system, network or individual.
      </InlineAlert>
    </Screen>
  )
}
