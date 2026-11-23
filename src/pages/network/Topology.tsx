import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Network, ZoomIn, ZoomOut, Crosshair, Download, RefreshCw, Play, Pause,
  Server, ShieldCheck, Waypoints, Cpu, Radio, HardDrive, Maximize2,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Toggle, Select, KeyValue, InlineAlert, Divider, Tag, EmptyState } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile } from '@/lib/utils'
import type { NetworkNode } from '@/types'

const TYPE_COLOR: Record<NetworkNode['type'], string> = {
  ROUTER: '#377eff',
  SWITCH: '#28d8ea',
  SERVER: '#38db91',
  FIREWALL: '#f5b942',
  NODE: '#a78bfa',
  GATEWAY: '#f14e61',
  STORAGE: '#93a3b4',
}
const TYPE_ICON: Record<NetworkNode['type'], typeof Server> = {
  ROUTER: Waypoints,
  SWITCH: Network,
  SERVER: Server,
  FIREWALL: ShieldCheck,
  NODE: Cpu,
  GATEWAY: Radio,
  STORAGE: HardDrive,
}

export default function Topology() {
  const s = useEngine()
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selected, setSelected] = useState<string | null>(s.networkNodes[0]?.id ?? null)
  const [showLabels, setShowLabels] = useState(true)
  const [showTraffic, setShowTraffic] = useState(true)
  const [zone, setZone] = useState('all')
  const [live, setLive] = useState(true)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [tick, setTick] = useState(0)

  const zones = useMemo(() => Array.from(new Set(s.networkNodes.map((n) => n.zone))), [s.networkNodes])

  const nodes = useMemo(() => {
    return s.networkNodes.filter((n) => zone === 'all' || n.zone === zone).map((n, i) => ({
      ...n,
      px: 90 + (n.x ?? 50) * 7.2,
      py: 70 + (n.y ?? 50) * 4.3 + (live ? Math.sin((i + tick) / 3) * 3 : 0),
    }))
  }, [s.networkNodes, zone, live, tick])

  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])
  const links = useMemo(() => s.networkLinks.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target)), [s.networkLinks, nodeIds])
  const node = s.networkNodes.find((n) => n.id === selected)

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setDragging(true)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    setOffset({ x: dragRef.current.ox + (e.clientX - dragRef.current.x), y: dragRef.current.oy + (e.clientY - dragRef.current.y) })
  }
  const onUp = () => {
    dragRef.current = null
    setDragging(false)
  }

  useEffect(() => {
    if (!live) return
    const i = window.setInterval(() => setTick((t) => t + 1), 1200)
    return () => window.clearInterval(i)
  }, [live])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="NETWORK · TOPOLOGY"
        title="Network Topology"
        subtitle="Pan and zoom the simulated topology, toggle layers and inspect any node's links."
        icon={Network}
        meta={
          <>
            <span className="badge badge-cyan">{nodes.length} NODES</span>
            <span className="badge badge-blue">{links.length} LINKS</span>
            <span className="badge badge-grey">{(zoom * 100).toFixed(0)}% ZOOM</span>
            <span className="badge badge-amber">SIMULATED</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setLive((l) => !l)}>{live ? <Pause size={11} /> : <Play size={11} />} {live ? 'Freeze' : 'Animate'}</button>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-topology-${Date.now()}.csv`, 'id,hostname,type,zone,ip,latency,load,status\n' + s.networkNodes.map((n) => [n.id, n.hostname, n.type, n.zone, n.ip, n.latency, n.load, n.status].join(',')).join('\n'), 'text/csv')}><Download size={11} /> Export</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <Panel title="Topology Canvas" icon={Network} bodyClassName="p-0"
          actions={
            <div className="flex items-center gap-1">
              <Select className="w-28" value={zone} onChange={setZone} options={[{ value: 'all', label: 'All zones' }, ...zones.map((z) => ({ value: z, label: z }))]} />
              <button type="button" className="icon-btn" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2.6, z * 1.2))}><ZoomIn size={12} /></button>
              <button type="button" className="icon-btn" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.35, z / 1.2))}><ZoomOut size={12} /></button>
              <button type="button" className="icon-btn" title="Fit to view" aria-label="Fit to view" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}><Maximize2 size={12} /></button>
              <button type="button" className="icon-btn" title="Recentre and clear selection" aria-label="Recentre and clear selection" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setSelected(null) }}><Crosshair size={12} /></button>
            </div>
          }
        >
          <div className="relative h-[560px] overflow-hidden bg-[#050a0e]">
            <div className="absolute inset-0 grid-bg opacity-25" />
            <svg
              viewBox="0 0 900 560"
              className={cn('h-full w-full touch-none select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              onWheel={(e) => { e.preventDefault(); setZoom((z) => Math.max(0.35, Math.min(2.6, z * (e.deltaY > 0 ? 0.92 : 1.08)))) }}
            >
              <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
                {links.map((l) => {
                  const a = nodes.find((n) => n.id === l.source)
                  const b = nodes.find((n) => n.id === l.target)
                  if (!a || !b) return null
                  const active = selected === l.source || selected === l.target
                  const dim = selected && !active
                  return (
                    <g key={l.id} opacity={dim ? 0.2 : 1}>
                      <line
                        x1={a.px} y1={a.py} x2={b.px} y2={b.py}
                        stroke={l.status === 'down' ? '#f14e61' : active ? '#28d8ea' : '#26394a'}
                        strokeWidth={active ? 1.8 : Math.max(0.5, l.bandwidth / 14)}
                        strokeDasharray={l.status === 'down' ? '4 3' : undefined}
                      />
                      {showTraffic && l.status === 'up' && (
                        <circle r="2.4" fill="#28d8ea" opacity={0.9}>
                          <animateMotion dur={`${4 - Math.min(3, l.bandwidth / 10)}s`} repeatCount="indefinite" path={`M${a.px} ${a.py} L${b.px} ${b.py}`} />
                        </circle>
                      )}
                    </g>
                  )
                })}
                {nodes.map((n) => {
                  const Icon = TYPE_ICON[n.type]
                  const color = TYPE_COLOR[n.type]
                  const isSel = selected === n.id
                  const dim = selected && !isSel && !links.some((l) => (l.source === selected && l.target === n.id) || (l.target === selected && l.source === n.id))
                  return (
                    <g key={n.id} transform={`translate(${n.px} ${n.py})`} opacity={dim ? 0.3 : 1}
                      className="cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setSelected(n.id)}
                    >
                      {isSel && <circle r="26" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="0.8"><animate attributeName="r" values="18;28;18" dur="2.4s" repeatCount="indefinite" /></circle>}
                      <rect x="-13" y="-13" width="26" height="26" rx="3" fill={`${color}20`} stroke={color} strokeWidth={isSel ? 1.5 : 0.9} />
                      <foreignObject x="-7" y="-7" width="14" height="14" className="pointer-events-none">
                        <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}><Icon size={12} color={color} strokeWidth={1.7} /></div>
                      </foreignObject>
                      {showLabels && <text y="24" textAnchor="middle" fontSize="7" fill={isSel ? '#e9f0f6' : '#93a3b4'} fontFamily="IBM Plex Mono, monospace">{n.hostname}</text>}
                      <circle cx="10" cy="-10" r="3" fill={n.status === 'online' ? '#38db91' : n.status === 'degraded' ? '#f5b942' : '#f14e61'} />
                    </g>
                  )
                })}
              </g>
            </svg>
            <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-0.5">
              {(Object.keys(TYPE_COLOR) as NetworkNode['type'][]).map((t) => (
                <span key={t} className="flex items-center gap-1 font-mono text-[7.5px] uppercase text-ink-3">
                  <span className="h-1.5 w-1.5" style={{ background: TYPE_COLOR[t] }} /> {t}
                </span>
              ))}
            </div>
            <span className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[8px] text-ink-3">DRAG · WHEEL · CLICK NODE</span>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Layer Controls" icon={Network}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Labels</span><Toggle checked={showLabels} onChange={setShowLabels} label="" /></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Traffic particles</span><Toggle checked={showTraffic} onChange={setShowTraffic} label="" /></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Live animation</span><Toggle checked={live} onChange={setLive} label="" /></div>
            </div>
            <Divider />
            <div className="grid grid-cols-3 gap-1">
              {[0.6, 1, 1.6].map((z) => <button key={z} type="button" className={cn('btn btn-sm', zoom === z && 'btn-primary')} onClick={() => setZoom(z)}>{z * 100}%</button>)}
            </div>
            <button type="button" className="btn btn-sm w-full mt-1" onClick={() => setTick((t) => t + 10)}><RefreshCw size={10} /> Jitter layout</button>
          </Panel>

          <Panel title="Node Detail" icon={Server} actions={node && <StatusPill value={node.status} />}>
            {node ? (
              <div className="space-y-2">
                <div>
                  <p className="label-xs">{node.id}</p>
                  <p className="font-display text-sm uppercase tracking-wide text-ink">{node.hostname}</p>
                  <p className="font-mono text-[9px] text-ink-3">{node.label}</p>
                </div>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Type', v: node.type },
                    { k: 'Zone', v: node.zone },
                    { k: 'Address', v: node.ip },
                    { k: 'OS', v: node.os ?? 'EMBEDDED' },
                    { k: 'Latency', v: `${node.latency} ms` },
                    { k: 'Load', v: `${node.load}%` },
                    { k: 'Uptime', v: node.uptime },
                  ]}
                />
                <div className="flex gap-1">
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.updateNetworkNode(node.id, { status: node.status === 'offline' ? 'online' : 'offline' })}>
                    {node.status === 'offline' ? 'Bring online' : 'Take offline'}
                  </button>
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.updateNetworkNode(node.id, { status: 'degraded', load: Math.min(99, node.load + 12) })}>Degrade</button>
                </div>
                <Divider label="LINKS" />
                <ul className="space-y-0.5">
                  {s.networkLinks.filter((l) => l.source === node.id || l.target === node.id).map((l) => {
                    const other = s.networkNodes.find((n) => n.id === (l.source === node.id ? l.target : l.source))
                    return (
                      <li key={l.id} className="flex items-center justify-between">
                        <span className="mono text-[9px] text-ink-3">{other?.hostname}</span>
                        <span className={cn('mono text-[8px] uppercase', l.status === 'up' ? 'text-green' : l.status === 'congested' ? 'text-amber' : 'text-red')}>{l.status} · {l.traffic}%</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : <EmptyState icon={Server} title="No node selected" message="Click any node on the canvas." />}
          </Panel>
        </div>
      </div>

      <Panel title="Describe the Topology" icon={Network}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue cols={1} items={[{ k: 'Nodes', v: String(s.networkNodes.length) }, { k: 'Links', v: String(s.networkLinks.length) }]} />
          <KeyValue cols={1} items={[{ k: 'Zones', v: String(zones.length) }, { k: 'Firewalls', v: String(s.networkNodes.filter((n) => n.type === 'FIREWALL').length) }]} />
          <KeyValue cols={1} items={[{ k: 'Routers', v: String(s.networkNodes.filter((n) => n.type === 'ROUTER').length) }, { k: 'Switches', v: String(s.networkNodes.filter((n) => n.type === 'SWITCH').length) }]} />
          <KeyValue cols={1} items={[{ k: 'Servers', v: String(s.networkNodes.filter((n) => n.type === 'SERVER').length) }, { k: 'Storage', v: String(s.networkNodes.filter((n) => n.type === 'STORAGE').length) }]} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <Tag tone="#28d8ea">GENERATED TOPOLOGY</Tag><Tag tone="#38db91">NO REAL HOSTS</Tag><Tag tone="#f5b942">SIMULATED TELEMETRY</Tag>
        </div>
      </Panel>

      <InlineAlert tone="amber" title="Synthetic network">
        This diagram is a generated schematic. It does not describe, scan or connect to any real network.
      </InlineAlert>
    </Screen>
  )
}
