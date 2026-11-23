import { useEffect, useMemo, useState } from 'react'
import {
  Activity, Bell, Download, Play, Pause, Settings2, HeartPulse, Gauge, Server,
  CircleCheck, CircleAlert, Clock,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, KeyValue, InlineAlert, Divider, Progress, Tabs, Toggle, EmptyState, Tag } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, PALETTE, ChartLegend, HeatStrip } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, relTime } from '@/lib/utils'

interface Check {
  id: string
  name: string
  target: string
  kind: 'http' | 'icmp (sim)' | 'agent' | 'tls (sim)'
  interval: number
  status: 'passing' | 'degraded' | 'failing' | 'paused'
  latency: number
  uptime: number
}

export default function Monitoring() {
  const s = useEngine()
  const [live, setLive] = useState(true)
  const [tick, setTick] = useState(0)
  const [range, setRange] = useState('1h')
  const [checks, setChecks] = useState<Check[]>(() =>
    Array.from({ length: 10 }, (_, i) => {
      const n = s.networkNodes[i % Math.max(1, s.networkNodes.length)]
      return {
        id: `CHK-${String(201 + i)}`,
        name: `${n?.hostname ?? 'HOST'}.health`,
        target: n?.ip ?? '10.0.0.1',
        kind: (['http', 'icmp (sim)', 'agent', 'tls (sim)'] as const)[i % 4],
        interval: [15, 30, 60, 120][i % 4],
        status: i === 2 ? 'degraded' : i === 7 ? 'failing' : i === 9 ? 'paused' : 'passing',
        latency: 18 + ((i * 23) % 90),
        uptime: 98.2 + ((i * 7) % 18) / 10,
      }
    }),
  )
  const [selected, setSelected] = useState(checks[0]?.id ?? null)
  const [alerts, setAlerts] = useState<{ id: string; check: string; ts: string; text: string }[]>([
    { id: 'ALT-9', check: 'CHK-203', ts: new Date(Date.now() - 420_000).toISOString(), text: 'Latency above simulated threshold for 3 intervals' },
    { id: 'ALT-8', check: 'CHK-208', ts: new Date(Date.now() - 1_800_000).toISOString(), text: 'Check failed twice — marked failing (demo)' },
  ])

  useEffect(() => {
    if (!live) return
    const i = window.setInterval(() => setTick((t) => t + 1), 2200)
    return () => window.clearInterval(i)
  }, [live])

  const series = useMemo(() => {
    const points = range === '1h' ? 18 : range === '6h' ? 24 : 30
    return Array.from({ length: points }, (_, i) => ({
      t: `${(i + 1) * 3}m`,
      availability: Number((99.1 + Math.sin((i + tick) / 3) * 0.7).toFixed(2)),
      latency: Math.round(24 + Math.sin((i + tick) / 2.2) * 8 + (i % 5)),
      errors: Math.max(0, Math.round(2 + Math.cos((i + tick) / 1.9) * 2)),
    }))
  }, [range, tick])

  const selectedCheck = checks.find((c) => c.id === selected)

  const passing = checks.filter((c) => c.status === 'passing').length
  const failing = checks.filter((c) => c.status === 'failing').length

  const toggleCheck = (id: string) => {
    setChecks((list) => list.map((c) => (c.id === id ? { ...c, status: c.status === 'paused' ? 'passing' : 'paused' } : c)))
  }

  const runCheck = (id: string) => {
    const c = checks.find((x) => x.id === id)
    if (!c) return
    const ok = Math.random() > 0.25
    setChecks((list) => list.map((x) => (x.id === id ? { ...x, status: ok ? 'passing' : 'failing', latency: ok ? 20 + Math.floor(Math.random() * 40) : 180 + Math.floor(Math.random() * 120) } : x)))
    setAlerts((a) => [{ id: `ALT-${a.length + 10}`, check: c.id, ts: new Date().toISOString(), text: ok ? 'Manual check passed (simulated)' : 'Manual check failed — threshold breached (simulated)' }, ...a])
    s.notify({ type: ok ? 'success' : 'failure', title: `Health check ${ok ? 'passed' : 'failed'}`, body: `${c.name} · simulated`, severity: ok ? 'low' : 'elevated', module: 'network' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="NETWORK · OBSERVABILITY"
        title="Monitoring"
        subtitle="Simulated health checks, availability windows and alerting for the fictional network."
        icon={HeartPulse}
        meta={
          <>
            <span className="badge badge-green">{passing} PASSING</span>
            <span className="badge badge-amber">{checks.filter((c) => c.status === 'degraded').length} DEGRADED</span>
            <span className="badge badge-red">{failing} FAILING</span>
            <span className="badge badge-cyan">{live ? 'LIVE' : 'PAUSED'}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setLive((l) => !l)}>{live ? <Pause size={11} /> : <Play size={11} />} {live ? 'Pause' : 'Resume'}</button>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-monitoring-${Date.now()}.csv`, 'check,target,kind,status,latency,uptime\n' + checks.map((c) => [c.name, c.target, c.kind, c.status, c.latency, c.uptime].join(',')).join('\n'), 'text/csv')}><Download size={11} /> Export</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Checks" value={checks.length} icon={Activity} accent="cyan" />
        <StatCard label="Passing" value={passing} icon={CircleCheck} accent="green" />
        <StatCard label="Failing" value={failing} icon={CircleAlert} accent="red" />
        <StatCard label="Avg latency" value={`${Math.round(checks.reduce((a, c) => a + c.latency, 0) / Math.max(1, checks.length))} ms`} icon={Gauge} accent="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Availability" icon={HeartPulse} className="lg:col-span-2" subtitle="Simulated uptime percentage">
          <AreaTrend
            data={series}
            keys={[{ key: 'availability', color: PALETTE.green, label: 'Availability' }, { key: 'latency', color: PALETTE.amber, label: 'Latency' }]}
            height={210}
          />
          <ChartLegend items={[{ label: 'Availability %', color: PALETTE.green }, { label: 'Latency ms', color: PALETTE.amber }]} />
        </Panel>
        <Panel title="Check Outcomes" icon={Bell}>
          <Donut
            data={[
              { name: 'Passing', value: passing, color: PALETTE.green },
              { name: 'Degraded', value: checks.filter((c) => c.status === 'degraded').length, color: PALETTE.amber },
              { name: 'Failing', value: failing, color: PALETTE.red },
              { name: 'Paused', value: checks.filter((c) => c.status === 'paused').length, color: PALETTE.line },
            ]}
            height={180}
            centerLabel="CHECKS"
            centerValue={String(checks.length)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Health Checks" icon={Activity} bodyClassName="p-0"
          actions={
            <div className="flex items-center gap-1.5">
              <Tabs size="sm" className="border-0" value={range} onChange={setRange} tabs={[{ id: '1h', label: '1h' }, { id: '6h', label: '6h' }, { id: '24h', label: '24h' }]} />
              <button type="button" className="btn btn-sm" onClick={() => checks.forEach((c) => runCheck(c.id))}><Play size={9} /> Run all</button>
            </div>
          }
        >
          <div className="max-h-[46vh] overflow-auto">
            <table className="data-table min-w-[700px]">
              <thead><tr><th>Check</th><th>Kind</th><th>Target</th><th>Every</th><th>Latency</th><th>Uptime</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => setSelected(c.id)} data-selected={selected === c.id}>
                    <td className="mono text-[10px] text-[var(--accent)]">{c.name}</td>
                    <td className="text-[9.5px] text-ink-2">{c.kind}</td>
                    <td className="mono text-[8.5px] text-ink-3">{c.target}</td>
                    <td className="mono text-[9px]">{c.interval}s</td>
                    <td className={cn('mono text-[9px]', c.latency > 120 ? 'text-red' : c.latency > 60 ? 'text-amber' : 'text-ink-2')}>{c.latency}ms</td>
                    <td className="mono text-[9px]">{c.uptime.toFixed(1)}%</td>
                    <td><StatusPill value={c.status === 'passing' ? 'online' : c.status === 'failing' ? 'offline' : c.status === 'degraded' ? 'degraded' : 'pending'} label={c.status.toUpperCase()} dot={false} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" className="btn btn-sm !px-1" title="Run check now" aria-label={`Run check ${c.name}`} onClick={(e) => { e.stopPropagation(); runCheck(c.id) }}><Play size={8} /></button>
                        <button type="button" className="btn btn-sm !px-1" title={c.status === 'paused' ? 'Resume checks' : 'Pause checks'} aria-label={`${c.status === 'paused' ? 'Resume' : 'Pause'} checks for ${c.name}`} onClick={(e) => { e.stopPropagation(); toggleCheck(c.id) }}>{c.status === 'paused' ? <Play size={8} /> : <Pause size={8} />}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-3">
          {selectedCheck && (
            <Panel title={selectedCheck.name} subtitle={selectedCheck.id} icon={Activity}
              actions={<StatusPill value={selectedCheck.status === 'passing' ? 'online' : selectedCheck.status === 'failing' ? 'offline' : 'degraded'} label={selectedCheck.status.toUpperCase()} />}
            >
              <KeyValue
                cols={1}
                items={[
                  { k: 'Kind', v: selectedCheck.kind },
                  { k: 'Target', v: selectedCheck.target },
                  { k: 'Interval', v: `${selectedCheck.interval} s` },
                  { k: 'Latency', v: `${selectedCheck.latency} ms` },
                  { k: 'Uptime', v: `${selectedCheck.uptime.toFixed(1)}%` },
                  { k: 'Source', v: 'SIMULATED PROBE' },
                ]}
              />
              <Divider label="ACTIONS" />
              <div className="flex gap-1">
                <button type="button" className="btn btn-sm flex-1" onClick={() => runCheck(selectedCheck.id)}><Play size={10} /> Run now</button>
                <button type="button" className="btn btn-sm flex-1" onClick={() => toggleCheck(selectedCheck.id)}>{selectedCheck.status === 'paused' ? 'Enable' : 'Pause'}</button>
              </div>
              <div className="mt-2">
                <p className="label-xs mb-1">RECENT SPARK</p>
                <BarsTrend data={series.slice(-10)} keys={[{ key: 'latency', color: PALETTE.amber, label: 'ms' }]} height={90} xKey="t" />
              </div>
            </Panel>
          )}

          <Panel title="Alerts" icon={Bell} bodyClassName="p-0" actions={<span className="badge badge-amber">{alerts.length}</span>}>
            <ul className="max-h-[220px] divide-y divide-line-soft overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[9px] text-[var(--accent)]">{a.check}</span>
                    <span className="font-mono text-[8px] text-ink-3">{relTime(a.ts)}</span>
                  </div>
                  <p className="text-[10px] text-ink-2">{a.text}</p>
                </li>
              ))}
              {alerts.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No alerts.</li>}
            </ul>
          </Panel>

          <Panel title="Thresholds" icon={Settings2}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Latency alert</span><span className="mono text-[9px] text-ink-3">120 ms</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Availability floor</span><span className="mono text-[9px] text-ink-3">99.0%</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Failure retries</span><span className="mono text-[9px] text-ink-3">3</span></div>
              <div className="flex items-center justify-between border-t border-line-soft pt-1.5"><span className="text-[10px] text-ink-2">Desktop notifications</span><Toggle checked={false} onChange={() => {}} label="" disabled /></div>
            </div>
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">SIMULATED PROBES</Tag><Tag tone="#f5b942">NO REAL PING</Tag></div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Latency Distribution" icon={Gauge} subtitle="All checks">
          <HeatStrip data={checks.map((c) => c.latency)} />
          <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3"><span>FAST</span><span>SLOW</span></div>
          <Divider />
          <div className="space-y-1">
            {checks.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-28 shrink-0 truncate font-mono text-[9px] text-ink-3">{c.name}</span>
                <Progress value={Math.min(100, (c.latency / 300) * 100)} height={2} className="flex-1" color={c.latency > 120 ? PALETTE.red : PALETTE.cyan} />
                <span className="mono w-10 shrink-0 text-right text-[8.5px] text-ink-3">{c.latency}ms</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Errors per Window" icon={CircleAlert}>
          <BarsTrend data={series} keys={[{ key: 'errors', color: PALETTE.red, label: 'Errors' }]} height={190} xKey="t" />
          <div className="mt-1 flex items-center justify-between font-mono text-[8.5px] text-ink-3">
            <span>{range.toUpperCase()} WINDOW</span>
            <span className="flex items-center gap-1"><Clock size={8} /> {live ? 'streaming' : 'paused'}</span>
          </div>
        </Panel>
      </div>

      {checks.length === 0 && <Panel title="No checks"><EmptyState icon={Server} title="No health checks" /></Panel>}

      <InlineAlert tone="amber" title="Simulated observability">
        Checks are evaluated against generated data. No real HTTP request, DNS lookup or ICMP packet leaves the browser.
      </InlineAlert>
    </Screen>
  )
}
