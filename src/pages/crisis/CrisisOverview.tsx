import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert, Siren, TriangleAlert, Activity, Building2, ArrowUpRight, Clock,
  Radio, Gauge, ChevronRight,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Progress, KeyValue, InlineAlert, Divider, Tabs } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, RadialGauge } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, pad, relTime } from '@/lib/utils'

export default function CrisisOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const active = s.crisisIncidents.filter((c) => c.status !== 'resolved')
  const escalated = s.crisisIncidents.filter((c) => c.status === 'escalated')
  const unhealthy = s.infrastructure.filter((i) => i.status !== 'nominal')

  const incidentsOverTime = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        t: `${pad(i * 2)}:00`,
        active: Math.max(0, Math.round(2 + Math.sin(i / 2.3) * 2 + (i % 3))),
        resolved: Math.round(1 + Math.abs(Math.cos(i / 2.7)) * 3),
      })),
    [],
  )

  const infraMix = useMemo(() => {
    const m = new Map<string, number>()
    s.infrastructure.forEach((i) => m.set(i.type, (m.get(i.type) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.infrastructure])

  const readiness = Math.round(s.infrastructure.reduce((a, i) => a + i.health, 0) / Math.max(1, s.infrastructure.length))

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRISIS · COMMAND"
        title="Crisis Command"
        subtitle="Cross-domain incident response for the fictional environment. Emergency mode changes the interface only."
        icon={Siren}
        meta={
          <>
            <span className="badge badge-red">{active.length} ACTIVE</span>
            <span className="badge badge-amber">{escalated.length} ESCALATED</span>
            <span className="badge badge-cyan">{s.infrastructure.length} SERVICES</span>
            <span className="badge badge-grey">{s.emergency ? 'EMERGENCY MODE ON' : 'NOMINAL MODE'}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/crisis/timeline')}><Clock size={11} /> Timeline</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => s.enterEmergency(escalated[0]?.id)}><Siren size={11} /> Emergency mode</button>
          </>
        }
      />

      {s.emergency && (
        <InlineAlert tone="red" title="Emergency presentation active">
          The interface is showing the emergency HUD. Exit using the overlay control when the demonstration is complete.
        </InlineAlert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Incidents" value={s.crisisIncidents.length} icon={ShieldAlert} accent="red" onClick={() => navigate('/crisis/incidents')} />
        <StatCard label="Active" value={active.length} icon={Siren} accent="amber" />
        <StatCard label="Escalated" value={escalated.length} icon={TriangleAlert} accent="red" />
        <StatCard label="Services" value={s.infrastructure.length} icon={Building2} accent="cyan" onClick={() => navigate('/crisis/infrastructure')} />
        <StatCard label="Degraded" value={unhealthy.length} icon={Gauge} accent="amber" />
        <StatCard label="Readiness" value={`${readiness}%`} icon={Activity} accent={readiness > 75 ? 'green' : 'amber'} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Incident Pressure" icon={Activity} className="lg:col-span-2" subtitle="Simulated open vs resolved over the window">
          <AreaTrend
            data={incidentsOverTime}
            keys={[{ key: 'active', color: PALETTE.red, label: 'Open' }, { key: 'resolved', color: PALETTE.green, label: 'Resolved' }]}
            height={200}
          />
          <ChartLegend items={[{ label: 'Open incidents', color: PALETTE.red }, { label: 'Resolved', color: PALETTE.green }]} />
        </Panel>
        <Panel title="Overall Readiness" icon={Gauge}>
          <RadialGauge value={readiness} color={readiness > 75 ? '#38db91' : readiness > 50 ? '#f5b942' : '#f14e61'} height={180} label="SERVICE HEALTH" suffix="%" />
          <p className="text-center font-mono text-[8.5px] text-ink-3">Average across {s.infrastructure.length} simulated services</p>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Active Incidents" icon={ShieldAlert} bodyClassName="p-0"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/crisis/incidents')}>All <ArrowUpRight size={10} /></button>}
        >
          <ul className="divide-y divide-line-soft">
            {active.slice(0, 6).map((c) => (
              <li key={c.id} className="px-2.5 py-2">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="min-w-0 text-left" onClick={() => navigate(`/crisis/incidents?q=${c.id}`)}>
                    <span className="mono block text-[8.5px] text-[var(--accent)]">{c.id}</span>
                    <span className="block truncate text-[10.5px] text-ink">{c.title}</span>
                    <span className="block truncate font-mono text-[8px] text-ink-3">{c.affected.join(' · ') || 'no assets listed'}</span>
                  </button>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <SeverityPill value={c.severity} />
                    <StatusPill value={c.status} dot={false} />
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn('h-1 flex-1', i < (c.timeline.filter((t) => t.done).length || 1) ? 'bg-[var(--accent)]' : 'bg-[#1c2a36]')} />
                  ))}
                  <span className="mono text-[8px] text-ink-3">{relTime(c.updated)}</span>
                </div>
              </li>
            ))}
            {active.length === 0 && <li className="px-2.5 py-4 text-center text-[10.5px] text-ink-3">No active incidents. All clear.</li>}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel title="Infrastructure Type Mix" icon={Building2}>
            <Donut
              data={infraMix.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
              height={170}
              centerLabel="SERVICES"
              centerValue={String(s.infrastructure.length)}
            />
          </Panel>

          <Panel title="Degraded Services" icon={Gauge} bodyClassName="p-0">
            <ul className="max-h-[200px] divide-y divide-line-soft overflow-y-auto">
              {unhealthy.map((i) => (
                <li key={i.id} className="flex items-center gap-2 px-2.5 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] text-ink">{i.name}</span>
                    <span className="block font-mono text-[8px] text-ink-3">{i.type} · {i.region}</span>
                  </span>
                  <span className="mono text-[9px] text-ink-3">{i.health}%</span>
                  <span className={cn('h-1.5 w-1.5 rounded-full', i.status === 'critical' ? 'bg-red' : i.status === 'offline' ? 'bg-ink-3' : 'bg-amber')} />
                </li>
              ))}
              {unhealthy.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">All services nominal.</li>}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Response Posture" icon={ShieldAlert} className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <KeyValue cols={1} items={[{ k: 'Mode', v: s.emergency ? 'EMERGENCY' : 'STANDARD' }, { k: 'Unread alerts', v: String(s.notifications.filter((n) => !n.read).length) }]} />
            <KeyValue cols={1} items={[{ k: 'Active channels', v: String(s.channels.length) }, { k: 'Operators', v: String(s.operators.filter((o) => o.status === 'online').length) }]} />
            <KeyValue cols={1} items={[{ k: 'Missions live', v: String(s.missions.filter((m) => m.status === 'active').length) }, { k: 'Last update', v: active[0] ? relTime(active[0].updated) : '—' }]} />
          </div>
          <Divider />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="btn btn-sm" onClick={() => navigate('/crisis/incidents')}><ChevronRight size={10} /> Manage incidents</button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/crisis/alerts')}><Radio size={10} /> Alert feed</button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/crisis/infrastructure')}><Building2 size={10} /> Infrastructure</button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/communications/dispatch')}><Siren size={10} /> Dispatch</button>
          </div>
        </Panel>

        <Panel title="Service Health" icon={Activity} bodyClassName="p-0">
          <ul className="max-h-[220px] divide-y divide-line-soft overflow-y-auto">
            {s.infrastructure.slice(0, 8).map((i) => (
              <li key={i.id} className="px-2.5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="truncate text-[10px] text-ink-2">{i.name}</span>
                  <span className="mono text-[8.5px] text-ink-3">{i.health}%</span>
                </div>
                <Progress value={i.health} height={2} color={i.health > 80 ? PALETTE.green : i.health > 50 ? PALETTE.amber : PALETTE.red} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Incident Table" icon={ShieldAlert} bodyClassName="p-0"
        actions={<Tabs size="sm" className="border-0" value="all" onChange={() => {}} tabs={[{ id: 'all', label: 'All', count: s.crisisIncidents.length }]} />}
      >
        <table className="data-table">
          <thead><tr><th>Incident</th><th>Title</th><th>Severity</th><th>Status</th><th>Affected</th><th>Reported</th></tr></thead>
          <tbody>
            {s.crisisIncidents.map((c) => (
              <tr key={c.id} className="cursor-pointer" onClick={() => navigate('/crisis/incidents')}>
                <td className="mono text-[9px] text-[var(--accent)]">{c.id}</td>
                <td className="text-[10.5px] text-ink">{c.title}</td>
                <td><SeverityPill value={c.severity} /></td>
                <td><StatusPill value={c.status} dot={false} /></td>
                <td className="max-w-[220px] truncate text-[9.5px] text-ink-3">{c.affected.join(', ')}</td>
                <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{relTime(c.reported)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <InlineAlert tone="amber" title="Simulated crisis">
        Incidents, affected services and infrastructure telemetry are generated. No real emergency, outage or alert exists.
      </InlineAlert>
    </Screen>
  )
}
