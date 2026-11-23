import { useEffect, useMemo, useState } from 'react'
import { Activity, Download, Pause, Play, ArrowDownUp, Gauge, Filter, Radio } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, KeyValue, InlineAlert, Divider, Tabs, EmptyState } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, PALETTE, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtCompact } from '@/lib/utils'

export default function Traffic() {
  const s = useEngine()
  const [live, setLive] = useState(true)
  const [zone, setZone] = useState('all')
  const [range, setRange] = useState('1h')
  const [tab, setTab] = useState('flow')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!live) return
    const i = window.setInterval(() => setTick((t) => t + 1), 2000)
    return () => window.clearInterval(i)
  }, [live])

  const zones = useMemo(() => Array.from(new Set(s.networkNodes.map((n) => n.zone))), [s.networkNodes])

  const series = useMemo(() => {
    const points = range === '1h' ? 18 : range === '6h' ? 24 : 32
    return Array.from({ length: points }, (_, i) => {
      const base = s.traffic[i % Math.max(1, s.traffic.length)]
      const wobble = ((i * 37 + tick * 11) % 40) / 100
      return {
        t: `${(i + 1) * (range === '1h' ? 3 : range === '6h' ? 15 : 45)}m`,
        inbound: Math.round((base?.inbound ?? 320) * (0.72 + wobble)),
        outbound: Math.round((base?.outbound ?? 240) * (0.7 + ((i * 53 + tick * 7) % 38) / 100)),
        packets: Math.round((base?.packets ?? 12000) * (0.8 + wobble / 2)),
        latency: Math.round((base?.latency ?? 24) * (0.8 + ((i * 17) % 60) / 100)),
      }
    })
  }, [s.traffic, range, tick])

  const totals = useMemo(
    () => ({
      in: series.reduce((a, p) => a + p.inbound, 0),
      out: series.reduce((a, p) => a + p.outbound, 0),
      packets: series.reduce((a, p) => a + p.packets, 0),
      latency: series.reduce((a, p) => a + p.latency, 0) / Math.max(1, series.length),
    }),
    [series],
  )

  const perZone = useMemo(
    () =>
      zones.map((z) => {
        const nodes = s.networkNodes.filter((n) => n.zone === z)
        const links = s.networkLinks.filter((l) => nodes.some((n) => n.id === l.source || n.id === l.target))
        return { zone: z, nodes: nodes.length, traffic: links.reduce((a, l) => a + l.traffic, 0), bandwidth: links.reduce((a, l) => a + l.bandwidth, 0) }
      }).sort((a, b) => b.traffic - a.traffic),
    [zones, s.networkNodes, s.networkLinks],
  )

  const protocolMix = [
    { name: 'HTTPS', value: 46, color: PALETTE.cyan },
    { name: 'TLS', value: 22, color: PALETTE.green },
    { name: 'DNS', value: 12, color: PALETTE.blue },
    { name: 'SSH (sim)', value: 9, color: PALETTE.amber },
    { name: 'Other', value: 11, color: PALETTE.ink },
  ]

  const flows = useMemo(
    () =>
      s.networkLinks
        .filter((l) => zone === 'all' || s.networkNodes.find((n) => n.id === l.source)?.zone === zone)
        .map((l, i) => {
          const a = s.networkNodes.find((n) => n.id === l.source)
          const b = s.networkNodes.find((n) => n.id === l.target)
          return {
            id: l.id,
            source: a?.hostname ?? l.source,
            target: b?.hostname ?? l.target,
            proto: ['HTTPS', 'TLS', 'DNS', 'SSH (sim)'][i % 4],
            bandwidth: l.bandwidth,
            utilisation: l.traffic,
            status: l.status,
            volume: (l.bandwidth * 1024 * (l.traffic / 100) * 3.6).toFixed(1),
          }
        }),
    [s.networkLinks, s.networkNodes, zone],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="NETWORK · TRAFFIC"
        title="Traffic Monitor"
        subtitle="Generated bandwidth, packet and latency telemetry across the simulated network."
        icon={Activity}
        meta={
          <>
            <span className="badge badge-cyan">{live ? 'LIVE (SIM)' : 'FROZEN'}</span>
            <span className="badge badge-grey">{range.toUpperCase()} WINDOW</span>
            <span className="badge badge-blue">{flows.length} FLOWS</span>
            <span className="badge badge-amber">SYNTHETIC</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setLive((l) => !l)}>{live ? <Pause size={11} /> : <Play size={11} />} {live ? 'Freeze' : 'Resume'}</button>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-traffic-${Date.now()}.csv`, 'time,inbound,outbound,packets,latency\n' + series.map((p) => `${p.t},${p.inbound},${p.outbound},${p.packets},${p.latency}`).join('\n'), 'text/csv')}><Download size={11} /> Export</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Inbound" value={`${fmtCompact(totals.in)} Mb`} icon={ArrowDownUp} accent="cyan" />
        <StatCard label="Outbound" value={`${fmtCompact(totals.out)} Mb`} icon={ArrowDownUp} accent="green" />
        <StatCard label="Packets" value={fmtCompact(totals.packets)} icon={Activity} accent="blue" />
        <StatCard label="Avg latency" value={`${totals.latency.toFixed(0)} ms`} icon={Gauge} accent="amber" />
      </div>

      <Panel title="Traffic Controls" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div><p className="label-xs mb-1">WINDOW</p><Tabs size="sm" value={range} onChange={setRange} tabs={[{ id: '1h', label: '1h' }, { id: '6h', label: '6h' }, { id: '24h', label: '24h' }]} /></div>
          <div><p className="label-xs mb-1">ZONE</p><Select className="w-36" value={zone} onChange={setZone} options={[{ value: 'all', label: 'All zones' }, ...zones.map((z) => ({ value: z, label: z }))]} /></div>
          <div className="ml-auto flex items-center gap-1.5 pb-1 font-mono text-[9px] text-ink-3">
            <span className={cn('dot', live ? 'bg-green animate-pulse' : 'bg-ink-3')} /> {live ? 'STREAMING SIMULATED SAMPLES' : 'STREAM PAUSED'}
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Throughput" icon={Activity} className="lg:col-span-2">
          <AreaTrend
            data={series}
            keys={[{ key: 'inbound', color: PALETTE.cyan, label: 'Inbound' }, { key: 'outbound', color: PALETTE.green, label: 'Outbound' }]}
            height={220}
          />
          <ChartLegend items={[{ label: 'Inbound Mb', color: PALETTE.cyan }, { label: 'Outbound Mb', color: PALETTE.green }]} />
        </Panel>
        <Panel title="Protocol Mix" icon={Radio} subtitle="Synthetic composition">
          <Donut data={protocolMix} height={190} centerLabel="PROTO" centerValue="5" />
          <div className="grid grid-cols-2 gap-1">
            {protocolMix.map((p) => (
              <span key={p.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-[8px] uppercase text-ink-3"><span className="h-1.5 w-1.5" style={{ background: p.color }} />{p.name}</span>
                <span className="mono text-[9px] text-ink-2">{p.value}%</span>
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Packet Volume" icon={ArrowDownUp}>
          <BarsTrend data={series} keys={[{ key: 'packets', color: PALETTE.blue, label: 'Packets' }]} height={180} xKey="t" />
        </Panel>
        <Panel title="Latency" icon={Gauge}>
          <AreaTrend data={series} keys={[{ key: 'latency', color: PALETTE.amber, label: 'ms' }]} height={180} />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Flow Table" icon={ArrowDownUp} bodyClassName="p-0"
          actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'flow', label: 'Flows' }, { id: 'zone', label: 'Zones' }]} />}
        >
          {tab === 'flow' ? (
            <div className="max-h-[46vh] overflow-auto">
              <table className="data-table min-w-[680px]">
                <thead><tr><th>Link</th><th>Source → Target</th><th>Proto</th><th>Bandwidth</th><th>Util</th><th>Volume</th><th>State</th></tr></thead>
                <tbody>
                  {flows.map((f) => (
                    <tr key={f.id}>
                      <td className="mono text-[9px] text-[var(--accent)]">{f.id}</td>
                      <td className="mono text-[9.5px] text-ink-2">{f.source} → {f.target}</td>
                      <td><span className="badge badge-grey">{f.proto}</span></td>
                      <td className="mono text-[9px]">{f.bandwidth} G</td>
                      <td className={cn('mono text-[9px]', f.utilisation > 85 ? 'text-red' : f.utilisation > 65 ? 'text-amber' : 'text-green')}>{f.utilisation}%</td>
                      <td className="mono text-[9px]">{f.volume} GB/h</td>
                      <td><StatusPill value={f.status === 'up' ? 'online' : f.status === 'congested' ? 'degraded' : 'offline'} label={f.status.toUpperCase()} dot={false} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {flows.length === 0 && <EmptyState icon={Activity} title="No flows in this zone" />}
            </div>
          ) : (
            <div className="max-h-[46vh] overflow-auto">
              <table className="data-table">
                <thead><tr><th>Zone</th><th className="text-right">Nodes</th><th className="text-right">Links</th><th className="text-right">Utilisation</th><th className="text-right">Bandwidth</th></tr></thead>
                <tbody>
                  {perZone.map((z) => (
                    <tr key={z.zone}>
                      <td className="text-[10.5px] text-ink">{z.zone}</td>
                      <td className="mono text-right text-[10px]">{z.nodes}</td>
                      <td className="mono text-right text-[10px]">{z.bandwidth}G</td>
                      <td className={cn('mono text-right text-[10px]', z.traffic / Math.max(1, z.nodes) > 70 ? 'text-red' : 'text-ink-2')}>{z.traffic}%</td>
                      <td className="mono text-right text-[10px]">{z.traffic * 12} Mb</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Zone Utilisation" icon={Filter}>
            {perZone.map((z) => (
              <div key={z.zone} className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-2">{z.zone}</span>
                  <span className="mono text-[9px] text-ink-3">{z.traffic}%</span>
                </div>
                <div className="h-1 bg-[#16212b]"><div className="h-full" style={{ width: `${Math.min(100, z.traffic)}%`, background: z.traffic > 80 ? PALETTE.red : PALETTE.cyan }} /></div>
              </div>
            ))}
            <Divider />
            <KeyValue
              items={[
                { k: 'Sampling', v: '5 s (sim)' },
                { k: 'Capture', v: 'NONE' },
                { k: 'Scope', v: 'GENERATED' },
                { k: 'Window', v: range.toUpperCase() },
              ]}
            />
          </Panel>

          <Panel title="Notes" icon={Radio}>
            <p className="text-[10px] leading-relaxed text-ink-2">
              No packet capture is performed. Values are derived from the seeded network model and animate locally to give a
              believable operations display.
            </p>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="No real traffic">
        These figures are synthetic. Nothing here inspects, records or intercepts real network traffic or protocols.
      </InlineAlert>
    </Screen>
  )
}
