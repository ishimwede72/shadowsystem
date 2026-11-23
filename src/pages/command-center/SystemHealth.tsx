import { useMemo, useState } from 'react'
import { Activity, Cpu, Database, Gauge, HardDrive, Server, ShieldCheck, Timer, TrendingUp, RefreshCw } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Progress, KeyValue, Collapsible, InlineAlert, Divider } from '@/components/ui'
import { AreaTrend, LineTrend, PALETTE, RadialGauge, ChartLegend, MiniBars } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn } from '@/lib/utils'

export default function SystemHealth() {
  const services = useEngine((s) => s.services)
  const traffic = useEngine((s) => s.traffic)
  const bus = useEngine((s) => s.bus)
  const tick = useEngine((s) => s.tick)
  const [refresh, setRefresh] = useState(0)

  const avg = services.reduce((a, s) => a + s.health, 0) / services.length
  const latency = useMemo(() => 8 + (tick % 17), [tick])

  const series = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        t: `${String(i).padStart(2, '0')}:00`,
        cpu: 22 + Math.sin(i / 2.4) * 16 + (refresh % 5),
        memory: 48 + Math.cos(i / 3.1) * 12,
        events: 10 + Math.sin(i / 1.7) * 8 + 12,
      })),
    [refresh],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMAND CENTER · APPLICATION HEALTH"
        title="System Health"
        subtitle="Per-service telemetry for the local simulation engine. No external dependencies are monitored."
        icon={ShieldCheck}
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setRefresh((r) => r + 1)}><RefreshCw size={11} /> Refresh</button>
            <button type="button" className="btn btn-sm" onClick={() => window.print()}>Export snapshot</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel dense className="text-center">
          <RadialGauge value={avg} label="AGGREGATE" color={avg > 99 ? PALETTE.green : PALETTE.amber} />
        </Panel>
        <Panel dense className="text-center">
          <RadialGauge value={99.9} label="EVENT ENGINE" color={PALETTE.cyan} />
        </Panel>
        <Panel dense className="text-center">
          <RadialGauge value={Math.min(100, 100 - latency / 2)} label="RELAY LATENCY" color={PALETTE.blue} suffix="%" />
          <p className="mono mt-[-6px] text-[10px] text-ink-3">{latency} ms p95</p>
        </Panel>
        <Panel dense className="text-center">
          <RadialGauge value={(bus.length / 220) * 100} label="BUS SATURATION" color={PALETTE.amber} />
          <p className="mono mt-[-6px] text-[10px] text-ink-3">{bus.length}/220 events buffered</p>
        </Panel>
      </div>

      <Panel title="Service Registry" icon={Server} subtitle="Live health, latency and status per module" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Health</th>
                <th>Latency</th>
                <th>Trend</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, i) => (
                <tr key={s.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="mono text-[10px] text-ink-3">{s.id}</span>
                      <span className="text-ink">{s.name}</span>
                    </span>
                  </td>
                  <td><StatusPill value={s.status} /></td>
                  <td className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={s.health} color={s.health > 99 ? PALETTE.green : PALETTE.amber} height={3} />
                      <span className={cn('mono w-12 text-right text-[10px] tabular', s.health > 99 ? 'text-green' : 'text-amber')}>{s.health.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="mono text-[11px] text-ink-2">{s.latency + (i % 5)} ms</td>
                  <td className="w-20"><MiniBars data={Array.from({ length: 10 }, (_, k) => 30 + ((i * 7 + k * 13) % 60))} color={s.health > 99 ? PALETTE.green : PALETTE.amber} height={18} /></td>
                  <td className="max-w-[220px] truncate text-[10.5px] text-ink-3">{s.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Engine Resource Trace" icon={Cpu} subtitle="Rolling 24-hour simulated utilisation">
          <AreaTrend
            data={series}
            keys={[
              { key: 'cpu', color: PALETTE.cyan, label: 'CPU' },
              { key: 'memory', color: PALETTE.blue, label: 'Memory' },
            ]}
            height={200}
          />
          <ChartLegend items={[{ label: 'CPU', color: PALETTE.cyan }, { label: 'Memory', color: PALETTE.blue }]} />
        </Panel>
        <Panel title="Network Telemetry" icon={Activity} subtitle="Simulated traffic correlated with service latency">
          <LineTrend
            data={traffic.slice(-24)}
            keys={[
              { key: 'latency', color: PALETTE.amber, label: 'Latency' },
              { key: 'packets', color: PALETTE.cyan, label: 'Packets' },
            ]}
            height={200}
          />
          <ChartLegend items={[{ label: 'Latency (ms)', color: PALETTE.amber }, { label: 'Packets (k)', color: PALETTE.cyan }]} />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Collapsible title="Runtime Environment" defaultOpen icon={Database}>
          <KeyValue
            items={[
              { k: 'Runtime', v: 'Vite + React 19 (client)' },
              { k: 'Engine', v: 'Zustand store + RAF tick' },
              { k: 'Persistence', v: 'localStorage (prefs + seed)' },
              { k: 'Records', v: 'Generated per session' },
            ]}
            cols={1}
          />
        </Collapsible>
        <Collapsible title="Storage" defaultOpen icon={HardDrive}>
          <KeyValue
            items={[
              { k: 'Demo ledger', v: 'In-memory' },
              { k: 'Bus buffer', v: '220 events' },
              { k: 'Activity log', v: '300 entries' },
              { k: 'Notifications', v: '120 entries' },
            ]}
            cols={1}
          />
        </Collapsible>
        <Collapsible title="Engine Timing" defaultOpen icon={Timer}>
          <KeyValue
            items={[
              { k: 'Ticks processed', v: tick.toLocaleString() },
              { k: 'Tick interval', v: 'requestAnimationFrame' },
              { k: 'Ambient events', v: 'every 12 ticks' },
              { k: 'Sim speeds', v: '0.5x / 1x / 2x / 5x' },
            ]}
            cols={1}
          />
        </Collapsible>
      </div>

      <Divider label="APPLICATION HEALTH · LOCAL ONLY" />
      <InlineAlert tone="cyan" title="No external monitoring">
        Every health metric is derived from local simulation state. This page does not ping, probe or monitor any external
        host or infrastructure.
      </InlineAlert>
      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-ink-3">
        <TrendingUp size={10} /> Snapshot generated locally · <Gauge size={10} /> {new Date().toISOString()}
      </div>
    </Screen>
  )
}
