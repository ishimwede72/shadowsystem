import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Network, ZoomIn, ZoomOut, Maximize2, Download, Filter, RefreshCw, Crosshair,
  Users, Building2, CreditCard, FolderOpen, Smartphone, FileText, Eye, Search,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Toggle, Select, KeyValue, InlineAlert, Divider, EmptyState, Tag } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, toCSV } from '@/lib/utils'
import type { GraphNode } from '@/types'

const TYPE_META: Record<GraphNode['type'], { color: string; icon: typeof Users; label: string }> = {
  person: { color: '#28d8ea', icon: Users, label: 'People' },
  org: { color: '#377eff', icon: Building2, label: 'Organisations' },
  account: { color: '#38db91', icon: CreditCard, label: 'Accounts' },
  case: { color: '#f5b942', icon: FolderOpen, label: 'Cases' },
  phone: { color: '#a78bfa', icon: Smartphone, label: 'Phones' },
  evidence: { color: '#f14e61', icon: FileText, label: 'Evidence' },
}

interface SimNode extends GraphNode {
  px: number
  py: number
  vx: number
  vy: number
}

export default function Relationships() {
  const s = useEngine()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [types, setTypes] = useState<Record<string, boolean>>({ person: true, org: true, account: true, case: true, phone: true, evidence: true })
  const [hideIsolated, setHideIsolated] = useState(false)
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [relayout, setRelayout] = useState(0)
  const [layout, setLayout] = useState<'force' | 'radial' | 'grid'>('force')
  const dragging = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Stable layout computed with a small deterministic force simulation.
  const nodes = useMemo<SimNode[]>(() => {
    const W = 900
    const H = 560
    const pool = s.graph.nodes.filter((n) => types[n.type])
    const idSet = new Set(pool.map((n) => n.id))
    const links = s.graph.links.filter((l) => idSet.has(l.source) && idSet.has(l.target))
    const degree = new Map<string, number>()
    links.forEach((l) => {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1)
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1)
    })
    const base = pool.filter((n) => !hideIsolated || (degree.get(n.id) ?? 0) > 0)

    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(base.length))
      return base.map((n, i) => ({
        ...n,
        px: (i % cols) * (W / cols) + W / (cols * 2),
        py: Math.floor(i / cols) * (H / Math.max(1, Math.ceil(base.length / cols))) + 40,
        vx: 0,
        vy: 0,
      }))
    }

    if (layout === 'radial') {
      const persons = base.filter((n) => n.type === 'person')
      const others = base.filter((n) => n.type !== 'person')
      const cx = W / 2
      const cy = H / 2
      return base.map((n) => {
        if (n.type === 'person') {
          const i = persons.indexOf(n)
          const a = (i / Math.max(1, persons.length)) * Math.PI * 2
          const r = 150
          return { ...n, px: cx + Math.cos(a) * r, py: cy + Math.sin(a) * r, vx: 0, vy: 0 }
        }
        const i = others.indexOf(n)
        const a = (i / Math.max(1, others.length)) * Math.PI * 2
        const r = 250
        return { ...n, px: cx + Math.cos(a) * r, py: cy + Math.sin(a) * r, vx: 0, vy: 0 }
      })
    }

    // force-ish deterministic layout
    const sim: SimNode[] = base.map((n, i) => {
      const seedA = (i * 137.508 * Math.PI) / 180
      return { ...n, px: W / 2 + Math.cos(seedA) * (80 + (i % 7) * 40), py: H / 2 + Math.sin(seedA) * (60 + (i % 5) * 45), vx: 0, vy: 0 }
    })
    const idx = new Map(sim.map((n, i) => [n.id, i]))
    for (let step = 0; step < 220; step++) {
      // repulsion
      for (let i = 0; i < sim.length; i++) {
        for (let j = i + 1; j < sim.length; j++) {
          const a = sim[i]
          const b = sim[j]
          let dx = a.px - b.px
          let dy = a.py - b.py
          let d2 = dx * dx + dy * dy
          if (d2 < 1) {
            dx = (i - j) * 0.3
            dy = 0.4
            d2 = 1
          }
          const d = Math.sqrt(d2)
          const f = 2600 / d2
          a.vx += (dx / d) * f
          a.vy += (dy / d) * f
          b.vx -= (dx / d) * f
          b.vy -= (dy / d) * f
        }
      }
      // springs
      links.forEach((l) => {
        const ia = idx.get(l.source)
        const ib = idx.get(l.target)
        if (ia == null || ib == null) return
        const a = sim[ia]
        const b = sim[ib]
        const dx = b.px - a.px
        const dy = b.py - a.py
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const target = 110
        const f = ((d - target) / d) * 0.02 * (l.strength / 4)
        a.vx += dx * f
        a.vy += dy * f
        b.vx -= dx * f
        b.vy -= dy * f
      })
      // centering + damping
      sim.forEach((n) => {
        n.vx += (W / 2 - n.px) * 0.0035
        n.vy += (H / 2 - n.py) * 0.0035
        n.vx *= 0.82
        n.vy *= 0.82
        n.px = Math.max(30, Math.min(W - 30, n.px + n.vx))
        n.py = Math.max(30, Math.min(H - 30, n.py + n.vy))
      })
    }
    return sim
  }, [s.graph, types, hideIsolated, layout, relayout])

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const links = useMemo(
    () => s.graph.links.filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target)),
    [s.graph.links, nodeMap],
  )

  // adjacency for highlight + 2-hop neighbourhood
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>()
    links.forEach((l) => {
      if (!m.has(l.source)) m.set(l.source, new Set())
      if (!m.has(l.target)) m.set(l.target, new Set())
      m.get(l.source)!.add(l.target)
      m.get(l.target)!.add(l.source)
    })
    return m
  }, [links])

  const neighbourhood = useMemo(() => {
    const active = focus ?? hover
    if (!active) return null
    const set = new Set<string>([active])
    adjacency.get(active)?.forEach((x) => {
      set.add(x)
      adjacency.get(x)?.forEach((y) => set.add(y))
    })
    return set
  }, [focus, hover, adjacency])

  const matches = useMemo(() => (q ? new Set(nodes.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())).map((n) => n.id)) : null), [q, nodes])

  // pointer pan
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setIsDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setOffset({ x: dragging.current.ox + (e.clientX - dragging.current.x), y: dragging.current.oy + (e.clientY - dragging.current.y) })
  }
  const onPointerUp = () => {
    dragging.current = null
    setIsDragging(false)
  }

  const wheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.max(0.3, Math.min(3, z * (e.deltaY > 0 ? 0.92 : 1.08))))
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [wheel])

  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); setFocus(null) }
  const fit = () => { setZoom(1); setOffset({ x: 0, y: 0 }) }

  const focusedNode = nodes.find((n) => n.id === focus)
  const focusedLinks = useMemo(
    () => (focus ? s.graph.links.filter((l) => l.source === focus || l.target === focus) : []),
    [focus, s.graph.links],
  )

  const exportGraph = () => downloadFile(`shadow-graph-${Date.now()}.csv`, toCSV(nodes.map(({ id, label, type, risk }) => ({ id, label, type, risk: risk ?? '' }))), 'text/csv')
  const exportLinks = () => downloadFile(`shadow-graph-links-${Date.now()}.csv`, toCSV(links.map(({ source, target, label, strength }) => ({ source, target, label, strength }))), 'text/csv')

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    s.graph.nodes.forEach((n) => { m[n.type] = (m[n.type] ?? 0) + 1 })
    return m
  }, [s.graph.nodes])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · LINK ANALYSIS"
        title="Relationship Graph"
        subtitle="Interactive network graph. Zoom with the wheel, drag to pan, click to focus, filter by node type and export."
        icon={Network}
        meta={
          <>
            <span className="badge badge-cyan">{nodes.length} NODES</span>
            <span className="badge badge-blue">{links.length} LINKS</span>
            <span className="badge badge-grey">{(zoom * 100).toFixed(0)}% ZOOM</span>
            <span className="badge badge-amber">SYNTHETIC</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => { setRelayout((r) => r + 1) }}><RefreshCw size={11} /> Re-run layout</button>
            <button type="button" className="btn btn-sm" onClick={exportGraph}><Download size={11} /> Nodes</button>
            <button type="button" className="btn btn-sm" onClick={exportLinks}><Download size={11} /> Links</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <Panel title="Network Canvas" icon={Network} bodyClassName="p-0" className="relative"
          actions={
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find node…" className="field h-6 w-36 pl-6 text-[10px]" />
              </div>
              <button type="button" className="icon-btn" onClick={() => setZoom((z) => Math.min(3, z * 1.2))} title="Zoom in"><ZoomIn size={12} /></button>
              <button type="button" className="icon-btn" onClick={() => setZoom((z) => Math.max(0.3, z / 1.2))} title="Zoom out"><ZoomOut size={12} /></button>
              <button type="button" className="icon-btn" onClick={fit} title="Fit"><Maximize2 size={12} /></button>
              <button type="button" className="icon-btn" onClick={reset} title="Reset"><Crosshair size={12} /></button>
            </div>
          }
        >
          <div className="relative h-[620px] w-full overflow-hidden bg-[#050a0e]">
            <div className="absolute inset-0 grid-bg opacity-25" />
            <svg
              ref={svgRef}
              viewBox="0 0 900 560"
              className={cn('h-full w-full touch-none select-none', isDragging ? 'cursor-grabbing' : 'cursor-grab')}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              <defs>
                <radialGradient id="nodeGlow">
                  <stop offset="0%" stopColor="#28d8ea" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#28d8ea" stopOpacity="0" />
                </radialGradient>
              </defs>
              <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
                {/* links */}
                {links.map((l) => {
                  const a = nodeMap.get(l.source)
                  const b = nodeMap.get(l.target)
                  if (!a || !b) return null
                  const active = focus === l.source || focus === l.target
                  const dim = neighbourhood && !(neighbourhood.has(l.source) && neighbourhood.has(l.target))
                  const searchDim = matches && !(matches.has(l.source) && matches.has(l.target))
                  const mx = (a.px + b.px) / 2
                  const my = (a.py + b.py) / 2 - 18
                  const stroke = active ? '#28d8ea' : l.strength > 6 ? '#377eff' : '#2b3d4d'
                  return (
                    <g key={`${l.source}-${l.target}-${l.label}`} opacity={dim || searchDim ? 0.12 : active ? 1 : 0.75}>
                      <path d={`M${a.px} ${a.py} Q${mx} ${my} ${b.px} ${b.py}`} fill="none" stroke={stroke} strokeWidth={active ? 1.6 : l.strength > 6 ? 1.1 : 0.7} strokeDasharray={l.strength < 3 ? '3 3' : undefined} />
                      {active && (
                        <text x={mx} y={my - 3} textAnchor="middle" fontSize="7" fill="#93a3b4" fontFamily="IBM Plex Mono, monospace">{l.label}</text>
                      )}
                    </g>
                  )
                })}

                {/* nodes */}
                {nodes.map((n) => {
                  const meta = TYPE_META[n.type]
                  const r = n.type === 'person' ? 12 : n.type === 'org' ? 13 : n.type === 'case' ? 10 : 8
                  const dim = (neighbourhood && !neighbourhood.has(n.id)) || (matches && !matches.has(n.id))
                  const isFocus = focus === n.id
                  const isHover = hover === n.id
                  const Icon = meta.icon
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.px} ${n.py})`}
                      opacity={dim ? 0.16 : 1}
                      className="cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setFocus((f) => (f === n.id ? null : n.id))}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover(null)}
                    >
                      {(isFocus || isHover) && <circle r={r + 12} fill="url(#nodeGlow)" />}
                      <circle r={r + 4} fill="none" stroke={meta.color} strokeOpacity={isFocus ? 0.9 : 0.25} strokeWidth={isFocus ? 1.2 : 0.6} />
                      <circle r={r} fill={`${meta.color}22`} stroke={meta.color} strokeWidth={isFocus ? 1.6 : 1} />
                      <foreignObject x={-r / 1.6} y={-r / 1.6} width={r * 1.25} height={r * 1.25} className="pointer-events-none">
                        <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
                          <Icon size={Math.round(r * 0.95)} color={meta.color} strokeWidth={1.6} />
                        </div>
                      </foreignObject>
                      <text y={r + 10} textAnchor="middle" fontSize="7.4" fill={isFocus ? '#e9f0f6' : '#93a3b4'} fontFamily="IBM Plex Mono, monospace">
                        {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
                      </text>
                      {n.risk && (n.risk === 'high' || n.risk === 'severe') && <circle cx={r * 0.72} cy={-r * 0.72} r="3" fill="#f14e61" />}
                    </g>
                  )
                })}
              </g>
            </svg>

            <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
              {(['person', 'org', 'account', 'case', 'phone', 'evidence'] as GraphNode['type'][]).map((t) => (
                <span key={t} className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-ink-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: TYPE_META[t].color }} /> {TYPE_META[t].label}
                </span>
              ))}
            </div>

            <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[8px] text-ink-3">
              DRAG TO PAN · WHEEL TO ZOOM · CLICK NODE TO FOCUS
            </div>
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <button type="button" className="btn btn-sm !py-0.5" onClick={() => setZoom(0.6)}>60%</button>
              <button type="button" className="btn btn-sm !py-0.5" onClick={() => setZoom(1)}>100%</button>
              <button type="button" className="btn btn-sm !py-0.5" onClick={() => setZoom(1.8)}>180%</button>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Filters" icon={Filter}>
            <div className="space-y-1.5">
              {(Object.keys(TYPE_META) as GraphNode['type'][]).map((t) => (
                <div key={t} className="flex items-center justify-between border-b border-line-soft/50 pb-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-ink-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_META[t].color }} />
                    {TYPE_META[t].label}
                    <span className="mono text-[8.5px] text-ink-3">({counts[t] ?? 0})</span>
                  </span>
                  <Toggle checked={!!types[t]} onChange={(v) => setTypes((x) => ({ ...x, [t]: v }))} label="" />
                </div>
              ))}
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-2">Hide isolated nodes</span>
              <Toggle checked={hideIsolated} onChange={setHideIsolated} label="" />
            </div>
            <Select className="mt-2" label="Layout" value={layout} onChange={(v) => setLayout(v as typeof layout)} options={[{ value: 'force', label: 'Force-directed' }, { value: 'radial', label: 'Radial' }, { value: 'grid', label: 'Grid' }]} />
            <button type="button" className="btn btn-sm w-full mt-2" onClick={() => setTypes({ person: true, org: true, account: true, case: true, phone: true, evidence: true })}>Show all types</button>
          </Panel>

          <Panel title="Focused Node" icon={Crosshair} actions={focusedNode && <StatusPill value={focusedNode.type} label={focusedNode.type.toUpperCase()} />}>
            {focusedNode ? (
              <div className="space-y-2">
                <div>
                  <p className="label-xs">{focusedNode.id}</p>
                  <p className="font-display text-sm uppercase tracking-wide text-ink">{focusedNode.label}</p>
                </div>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Type', v: focusedNode.type.toUpperCase() },
                    { k: 'Risk', v: focusedNode.risk?.toUpperCase() ?? 'N/A' },
                    { k: 'Direct links', v: String(focusedLinks.length) },
                    { k: 'Neighbourhood', v: String((neighbourhood?.size ?? 1) - 1) },
                  ]}
                />
                <Divider label="CONNECTIONS" />
                <ul className="max-h-[160px] space-y-0.5 overflow-y-auto">
                  {focusedLinks.slice(0, 12).map((l) => {
                    const otherId = l.source === focusedNode.id ? l.target : l.source
                    const other = nodeMap.get(otherId) ?? s.graph.nodes.find((n) => n.id === otherId)
                    return (
                      <li key={`${l.source}-${l.target}-${l.label}`}>
                        <button type="button" className="flex w-full items-center justify-between gap-1 border-b border-line-soft/40 py-0.5 text-left" onClick={() => setFocus(otherId)}>
                          <span className="truncate text-[10px] text-ink-2">{other?.label ?? otherId}</span>
                          <span className="mono shrink-0 text-[8px] uppercase text-ink-3">{l.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <button type="button" className="btn btn-sm w-full" onClick={() => setFocus(null)}><Eye size={10} /> Clear focus</button>
              </div>
            ) : (
              <EmptyState icon={Network} title="No node focused" message="Click any node to highlight its two-hop neighbourhood." />
            )}
          </Panel>

          <Panel title="Graph Stats" icon={Network}>
            <KeyValue
              items={[
                { k: 'Nodes', v: String(s.graph.nodes.length) },
                { k: 'Links', v: String(s.graph.links.length) },
                { k: 'Density', v: `${((s.graph.links.length / Math.max(1, s.graph.nodes.length)) * 1).toFixed(2)}` },
                { k: 'Avg strength', v: (s.graph.links.reduce((a, l) => a + l.strength, 0) / Math.max(1, s.graph.links.length)).toFixed(1) },
                { k: 'Zoom', v: `${(zoom * 100).toFixed(0)}%` },
                { k: 'Layout', v: layout.toUpperCase() },
              ]}
            />
            <Divider />
            <div className="flex flex-wrap gap-1">
              <Tag tone="#28d8ea">SIMULATED NETWORK</Tag>
              <Tag tone="#f5b942">LINK ANALYSIS</Tag>
            </div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional link analysis">
        Nodes include invented people, organisations, accounts and phones. Edges represent generated relationships only and
        have no factual basis.
      </InlineAlert>
    </Screen>
  )
}
