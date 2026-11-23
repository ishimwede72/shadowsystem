import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Network, Server, Activity, Wifi, ShieldCheck, ArrowUpRight, Cpu, Radio,
  AlertTriangle, Waypoints, HardDrive,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, KeyValue, Progress, InlineAlert, Divider } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, HeatStrip } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtCompact, relTime } from '@/lib/utils'

export default function NetworkOverview() {
  const navigate = useNavigate()
  const s = useEngine()
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const i = setInterval(() => setPulse((p) => p + 1), 4000)
    return () => clearInterval(i)
  }, [])

  const online = s.networkNodes.filter((n) => n.status === 'online')
  const offline = s.networkNodes.filter((n) => n.status === 'offline')
  const degraded = s.networkNodes.filter((n) => n.status === 'degraded')
  const congested = s.networkLinks.filter((l) => l.status === 'congested' || l.status === 'down')

  const traffic = useMemo(() => {
    const base = s.traffic.length ? s.traffic : []
    return Array.from({ length: 18 }, (_, i) => {
      const src = base[i % Math.max(1, base.length)]
      return {
        t: `${i * 5}m`,
        inbound: Math.round((src?.inbound ?? 300) * (0.7 + ((i * 37) % 60) / 100)),
        outbound: Math.round((src?.outbound ?? 220) * (0.7 + ((i * 53) % 55) / 100)),
      }
    })
  }, [s.traffic, pulse])

  const zoneDist = useMemo(() => {
    const m = new Map<string, number>()
    s.networkNodes.forEach((n) => m.set(n.zone, (m.get(n.zone) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.networkNodes])

  const typeIcon: Record<string, typeof Server> = { ROUTER: Waypoints, SWITCH: Network, SERVER: Server, FIREWALL: ShieldCheck, NODE: Cpu, GATEWAY: Radio, STORAGE: HardDrive }

  const avgLoad = s.networkNodes.reduce((a, n) => a + n.load, 0) / Math.max(1, s.networkNodes.length)
  const avgLatency = s.networkNodes.reduce((a, n) => a + n.latency, 0) / Math.max(1, s.networkNodes.length)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="NETWORK · OVERVIEW"
        title="Network Operations"
        subtitle="A fictional enterprise network of routers, switches, servers and storage. All telemetry is generated."
        icon={Network}
        meta={
          <>
            <span className="badge badge-green">{online.length}/{s.networkNodes.length} ONLINE</span>
            <span className="badge badge-amber">{degraded.length} DEGRADED</span>
            <span className="badge badge-red">{congested.length} LINK ISSUES</span>
            <span className="badge badge-grey">{s.networkLinks.length} LINKS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/network/topology')}><Network size={11} /> Topology</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/network/monitoring')}><Activity size={11} /> Monitoring</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Nodes" value={s.networkNodes.length} icon={Server} accent="cyan" onClick={() => navigate('/network/servers')} />
        <StatCard label="Online" value={online.length} icon={Wifi} accent="green" />
        <StatCard label="Avg load" value={`${avgLoad.toFixed(0)}%`} icon={Cpu} accent="amber" />
        <StatCard label="Avg latency" value={`${avgLatency.toFixed(0)}ms`} icon={Activity} accent="blue" />
        <StatCard label="Links" value={s.networkLinks.length} icon={Network} accent="cyan" onClick={() => navigate('/network/topology')} />
        <StatCard label="Offline" value={offline.length} icon={AlertTriangle} accent="red" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Throughput" icon={Activity} className="lg:col-span-2" subtitle="Simulated inbound and outbound bandwidth (Mbps)">
          <AreaTrend
            data={traffic}
            keys={[{ key: 'inbound', color: PALETTE.cyan, label: 'Inbound' }, { key: 'outbound', color: PALETTE.green, label: 'Outbound' }]}
            height={208}
          />
          <ChartLegend items={[{ label: 'Inbound', color: PALETTE.cyan }, { label: 'Outbound', color: PALETTE.green }]} />
        </Panel>
        <Panel title="Zone Spread" icon={Network}>
          <Donut
            data={zoneDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
            height={186}
            centerLabel="NODES"
            centerValue={String(s.networkNodes.length)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Node Health" icon={Server} bodyClassName="p-0"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/network/servers')}>All servers <ArrowUpRight size={10} /></button>}
        >
          <table className="data-table">
            <thead><tr><th>Host</th><th>Type</th><th>Zone</th><th>IP</th><th>Latency</th><th>Load</th><th>Memory</th><th>Status</th></tr></thead>
            <tbody>
              {s.networkNodes.slice(0, 8).map((n) => {
                const Icon = typeIcon[n.type] ?? Server
                return (
                  <tr key={n.id} className="cursor-pointer" onClick={() => navigate('/network/servers')}>
                    <td className="mono text-[10px] text-[var(--accent)]">{n.hostname}</td>
                    <td><span className="flex items-center gap-1 text-[9.5px] text-ink-2"><Icon size={10} className="text-ink-3" /> {n.type}</span></td>
                    <td className="text-[10px]">{n.zone}</td>
                    <td className="mono text-[9px] text-ink-3">{n.ip}</td>
                    <td className={cn('mono text-[9.5px]', n.latency > 80 ? 'text-amber' : 'text-ink-2')}>{n.latency}ms</td>
                    <td>
                      <span className="flex items-center gap-1.5">
                        <Progress value={n.load} height={2} className="w-10" color={n.load > 80 ? PALETTE.red : PALETTE.cyan} />
                        <span className="mono text-[8.5px] text-ink-3">{n.load}%</span>
                      </span>
                    </td>
                    <td className="mono text-[9.5px] text-ink-2">{n.memory}%</td>
                    <td><StatusPill value={n.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-3">
          <Panel title="Link Status" icon={Network} bodyClassName="p-0">
            <ul className="max-h-[210px] divide-y divide-line-soft overflow-y-auto">
              {s.networkLinks.map((l) => {
                const a = s.networkNodes.find((n) => n.id === l.source)
                const b = s.networkNodes.find((n) => n.id === l.target)
                return (
                  <li key={l.id} className="flex items-center gap-2 px-2.5 py-1">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', l.status === 'up' ? 'bg-green' : l.status === 'congested' ? 'bg-amber' : 'bg-red')} />
                    <span className="min-w-0 flex-1 truncate font-mono text-[9px] text-ink-2">{a?.hostname ?? '?'} → {b?.hostname ?? '?'}</span>
                    <span className="mono shrink-0 text-[8.5px] text-ink-3">{l.bandwidth}G · {l.traffic}%</span>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Capacity" icon={Cpu}>
            <HeatStrip data={s.networkNodes.map((n) => n.load)} />
            <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3"><span>IDLE</span><span>SATURATED</span></div>
            <Divider />
            <KeyValue
              items={[
                { k: 'Bandwidth', v: `${s.networkLinks.reduce((a, l) => a + l.bandwidth, 0)} Gbps` },
                { k: 'Link utilisation', v: `${(s.networkLinks.reduce((a, l) => a + l.traffic, 0) / Math.max(1, s.networkLinks.length)).toFixed(0)}%` },
                { k: 'Packets', v: fmtCompact(s.traffic.reduce((a, t) => a + t.packets, 0)) },
                { k: 'Zones', v: String(zoneDist.length) },
              ]}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Resource Pressure" icon={Cpu} className="lg:col-span-2">
          <div className="space-y-2">
            {s.networkNodes.slice(0, 6).map((n) => (
              <div key={n.id}>
                <div className="flex items-center justify-between">
                  <span className="mono text-[9.5px] text-ink-2">{n.hostname}</span>
                  <span className="mono text-[8.5px] text-ink-3">CPU {n.cpu}% · MEM {n.memory}% · DISK {n.disk}%</span>
                </div>
                <div className="mt-0.5 flex gap-0.5">
                  <Progress value={n.cpu} height={2} className="flex-1" color={PALETTE.cyan} />
                  <Progress value={n.memory} height={2} className="flex-1" color={PALETTE.green} />
                  <Progress value={n.disk} height={2} className="flex-1" color={PALETTE.amber} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Network Events" icon={Radio} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {s.activity.filter((a) => a.module === 'network').slice(0, 6).map((a) => (
              <li key={a.id} className="px-2.5 py-1.5">
                <p className="truncate text-[10px] text-ink-2">{a.action}</p>
                <p className="font-mono text-[8px] text-ink-3">{relTime(a.ts)} · {a.actor}</p>
              </li>
            ))}
            {s.activity.filter((a) => a.module === 'network').length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No recent events.</li>}
          </ul>
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Fictional infrastructure">
        Hostnames, addresses and metrics come from a seeded generator. No real host or network is probed, scanned or accessed.
      </InlineAlert>
    </Screen>
  )
}
