import { useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import countries110 from 'world-atlas/countries-110m.json'
import { cn, fmtCoords, pad } from '@/lib/utils'
import { Plus, Minus, Maximize2, Layers, Crosshair } from 'lucide-react'
import type { GeoPoint } from '@/types'

export interface MapMarker {
  id: string
  label: string
  lat: number
  lng: number
  tone?: 'cyan' | 'green' | 'amber' | 'red' | 'blue'
  kind?: 'target' | 'mission' | 'node' | 'camera' | 'alert' | 'city'
  pulse?: boolean
  meta?: string
}

export interface MapArc {
  id: string
  from: GeoPoint
  to: GeoPoint
  tone?: 'cyan' | 'green' | 'amber' | 'red' | 'blue'
  dashed?: boolean
  label?: string
}

export interface MapRing {
  id: string
  center: GeoPoint
  radiusKm: number
  tone?: string
  label?: string
}

const TONE: Record<string, string> = {
  cyan: '#28d8ea',
  green: '#38db91',
  amber: '#f5b942',
  red: '#f14e61',
  blue: '#377eff',
}

const W = 1000
const H = 500

export function WorldMap({
  markers = [],
  arcs = [],
  rings = [],
  selectedId,
  onSelect,
  className,
  showGraticule = true,
  showLabels = true,
  showLegend = true,
  interactive = true,
  onViewportChange,
  height,
}: {
  markers?: MapMarker[]
  arcs?: MapArc[]
  rings?: MapRing[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
  showGraticule?: boolean
  showLabels?: boolean
  showLegend?: boolean
  interactive?: boolean
  onViewportChange?: (z: number) => void
  height?: number
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [drag, setDrag] = useState<{ x: number; y: number; px: number; py: number } | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null)
  const [layers, setLayers] = useState({ land: true, grid: true, arcs: true, rings: true, markers: true })
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const land = useMemo<FeatureCollection<Geometry>>(() => {
    const topo = countries110 as never
    const collection = feature(topo, (topo as { objects: { countries: never } }).objects.countries)
    return collection as unknown as FeatureCollection<Geometry>
  }, [])

  const projection = useMemo(() => geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], land as never), [land])
  const pathGen = useMemo(() => geoPath(projection), [projection])
  const graticule = useMemo(() => {
    const g = geoPath(projection)(geoGraticule10() as never)
    return typeof g === 'string' ? g : ''
  }, [projection])

  const project = (p: GeoPoint): [number, number] | null => {
    const out = projection([p.lng, p.lat])
    return out ? [out[0], out[1]] : null
  }

  const countryPaths = useMemo(
    () => land.features.map((f, i) => {
      const d = pathGen(f as never)
      return { d: typeof d === 'string' ? d : '', key: i }
    }),
    [land, pathGen],
  )

  useEffect(() => {
    onViewportChange?.(zoom)
  }, [zoom, onViewportChange])

  const clampZoom = (z: number) => Math.max(1, Math.min(6, z))

  const zoomBy = (delta: number) => setZoom((z) => clampZoom(Math.round((z + delta) * 100) / 100))

  const onWheel = (e: React.WheelEvent) => {
    if (!interactive) return
    e.preventDefault()
    zoomBy(e.deltaY > 0 ? -0.25 : 0.25)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDrag({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y })
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    setPan({ x: drag.px + (e.clientX - drag.x), y: drag.py + (e.clientY - drag.y) })
  }
  const onPointerUp = () => setDrag(null)

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const activeMarkers = layers.markers ? markers : []
  const activeArcs = layers.arcs ? arcs : []
  const activeRings = layers.rings ? rings : []

  return (
    <div className={cn('relative overflow-hidden bg-[#050a10]', className)} style={height ? { height } : undefined}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={cn('h-full w-full select-none', interactive && (drag ? 'cursor-grabbing' : 'cursor-grab'))}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp()
          setHover(null)
        }}
        role="img"
        aria-label="Simulated global operations map"
      >
        <defs>
          <radialGradient id="wm-ocean" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#0a1620" />
            <stop offset="100%" stopColor="#04090e" />
          </radialGradient>
          <filter id="wm-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="wm-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16232e" />
            <stop offset="100%" stopColor="#101a24" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#wm-ocean)" />

        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {showGraticule && layers.grid && (
            <>
              <path d={graticule} fill="none" stroke="#1d3345" strokeWidth={0.4} opacity={0.75} />
            </>
          )}

          {layers.land &&
            countryPaths.map((c) => (
              <path key={c.key} d={c.d} fill="url(#wm-land)" stroke="#2a4c60" strokeWidth={0.42} strokeLinejoin="round" />
            ))}

          {/* rings */}
          {activeRings.map((r) => {
            const pt = project(r.center)
            if (!pt) return null
            const kmPerDeg = 111
            const rPx = (r.radiusKm / kmPerDeg) * (W / 360) * zoom
            return (
              <g key={r.id}>
                <circle cx={pt[0]} cy={pt[1]} r={Math.max(6, rPx)} fill={r.tone ?? '#28d8ea'} fillOpacity={0.05} stroke={r.tone ?? '#28d8ea'} strokeOpacity={0.5} strokeWidth={0.7} strokeDasharray="3 3" />
                <circle cx={pt[0]} cy={pt[1]} r={Math.max(6, rPx)} fill="none" stroke={r.tone ?? '#28d8ea'} strokeOpacity={0.18} strokeWidth={3} />
              </g>
            )
          })}

          {/* arcs */}
          {activeArcs.map((a) => {
            const p1 = project(a.from)
            const p2 = project(a.to)
            if (!p1 || !p2) return null
            const [x1, y1] = p1
            const [x2, y2] = p2
            const mx = (x1 + x2) / 2
            const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18
            const color = TONE[a.tone ?? 'cyan'] ?? '#28d8ea'
            const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
            return (
              <g key={a.id}>
                <path d={d} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray={a.dashed ? '4 4' : '6 10'}
                  strokeOpacity={0.9}
                  vectorEffect="non-scaling-stroke"
                  className="animate-[dash_2.4s_linear_infinite]"
                />
                <circle cx={x2} cy={y2} r={1.6} fill={color} opacity={0.85} />
              </g>
            )
          })}

          {/* markers */}
          {activeMarkers.map((m) => {
            const pt = project({ lat: m.lat, lng: m.lng })
            if (!pt) return null
            const [x, y] = pt
            const color = TONE[m.tone ?? 'cyan'] ?? '#28d8ea'
            const selected = selectedId === m.id
            const size = m.kind === 'city' ? 1.8 : 3
            return (
              <g
                key={m.id}
                transform={`translate(${x} ${y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(m.id)
                }}
                onMouseEnter={(e) => {
                  const box = svgRef.current?.getBoundingClientRect()
                  if (box) setHover({ x: e.clientX - box.left, y: e.clientY - box.top, label: `${m.label}${m.meta ? ' · ' + m.meta : ''}` })
                }}
                onMouseLeave={() => setHover(null)}
              >
                {m.pulse && (
                  <>
                    <circle r={size} fill={color} opacity={0.32}>
                      <animate attributeName="r" values={`${size};${size * 4.2}`} dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle r={size} fill="none" stroke={color} strokeWidth={0.7} opacity={0.55}>
                      <animate attributeName="r" values={`${size};${size * 4.2}`} dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
                {selected && <circle r={size + 3.5} fill="none" stroke={color} strokeWidth={0.9} strokeDasharray="2 2" />}
                {m.kind === 'target' ? (
                  <g filter="url(#wm-glow)">
                    <path d={`M 0 ${-size * 2} L ${size * 1.4} 0 L 0 ${size * 2} L ${-size * 1.4} 0 Z`} fill={color} fillOpacity={0.85} stroke="#04090e" strokeWidth={0.5} />
                    <circle r={1} fill="#04090e" />
                  </g>
                ) : m.kind === 'camera' ? (
                  <rect x={-size} y={-size} width={size * 2} height={size * 2} fill={color} fillOpacity={0.85} stroke="#04090e" strokeWidth={0.5} transform="rotate(45)" />
                ) : m.kind === 'alert' ? (
                  <g filter="url(#wm-glow)">
                    <circle r={size * 1.5} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={0.8} />
                    <circle r={size * 0.6} fill={color} />
                  </g>
                ) : (
                  <g filter="url(#wm-glow)">
                    <circle r={size} fill={color} stroke="#04090e" strokeWidth={0.6} />
                    <circle r={size * 2.1} fill={color} opacity={0.12} />
                  </g>
                )}
                {showLabels && zoom > 1.6 && (
                  <text x={size + 5} y={2} fill={color} fontSize={8 / Math.sqrt(zoom)} fontFamily="JetBrains Mono, monospace" opacity={0.9}>
                    {m.label.toUpperCase()}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* corner reticles */}
        <g stroke="#28d8ea" strokeOpacity={0.35} fill="none" strokeWidth={0.8}>
          <path d="M6 24V10a4 4 0 0 1 4-4h14" />
          <path d={`M${W - 6} 24V10a4 4 0 0 0-4-4h-14`} />
          <path d={`M6 ${H - 24}V${H - 10}a4 4 0 0 0 4 4h14`} />
          <path d={`M${W - 6} ${H - 24}V${H - 10}a4 4 0 0 1-4 4h-14`} />
        </g>
        <text x={16} y={H - 12} fill="#5c7284" fontSize={7.5} fontFamily="JetBrains Mono, monospace" letterSpacing="1.6">
          SHADOW GEOINT · SIMULATED · EPSG:8857
        </text>
        <text x={W - 16} y={H - 12} fill="#5c7284" fontSize={7.5} fontFamily="JetBrains Mono, monospace" textAnchor="end" letterSpacing="1.4">
          {`Z ${zoom.toFixed(2)} · ${pad(markers.length, 3)} MARKERS`}
        </text>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 whitespace-nowrap border border-line bg-bg/95 px-2 py-1 font-mono text-[9.5px] text-ink shadow-lg"
          style={{ left: hover.x + 12, top: hover.y - 8 }}
        >
          {hover.label}
        </div>
      )}

      {/* controls */}
      {interactive && (
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button type="button" className="icon-btn border border-line bg-bg/85 backdrop-blur" onClick={() => zoomBy(0.4)} aria-label="Zoom in"><Plus size={13} /></button>
          <button type="button" className="icon-btn border border-line bg-bg/85 backdrop-blur" onClick={() => zoomBy(-0.4)} aria-label="Zoom out"><Minus size={13} /></button>
          <button type="button" className="icon-btn border border-line bg-bg/85 backdrop-blur" onClick={resetView} aria-label="Reset view"><Maximize2 size={12} /></button>
          <div className="relative">
            <button type="button" className="icon-btn border border-line bg-bg/85 backdrop-blur" onClick={() => setShowLayerMenu((v) => !v)} aria-label="Map layers"><Layers size={13} /></button>
            {showLayerMenu && (
              <div className="absolute right-0 top-8 z-20 w-36 border border-line bg-panel p-1.5 shadow-xl">
                <p className="label-xs mb-1 px-1">Layers</p>
                {(Object.entries(layers) as [keyof typeof layers, boolean][]).map(([k, v]) => (
                  <label key={k} className="flex cursor-pointer items-center gap-2 px-1 py-0.5 text-[10.5px] capitalize text-ink-2 hover:text-ink">
                    <input type="checkbox" checked={v} onChange={() => setLayers((l) => ({ ...l, [k]: !l[k] }))} className="accent-[var(--accent)]" />
                    {k}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showLegend && (
        <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2 border border-line/60 bg-bg/80 px-1.5 py-1 backdrop-blur">
          {[
            ['Target', 'target', 'cyan'],
            ['Mission', 'mission', 'amber'],
            ['Node', 'node', 'blue'],
            ['Camera', 'camera', 'green'],
            ['Alert', 'alert', 'red'],
          ].map(([label, kind, tone]) => (
            <span key={label} className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-ink-3">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE[tone] }} />
              {label}
              <span className="hidden">{kind}</span>
            </span>
          ))}
        </div>
      )}

      {markers.length === 0 && (
        <div className="absolute inset-0 grid place-items-center">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
            <Crosshair size={12} /> No active markers
          </p>
        </div>
      )}
    </div>
  )
}

export function MiniMap({ markers, className, onCenter }: { markers: MapMarker[]; className?: string; onCenter?: (lat: number, lng: number) => void }) {
  const [zoom, setZoom] = useState(1)
  return (
    <div className={cn('relative', className)}>
      <WorldMap markers={markers} showLegend={false} showLabels={false} interactive onViewportChange={setZoom} />
      <span className="absolute right-1.5 top-1.5 font-mono text-[8px] text-ink-3">Z{zoom.toFixed(1)}</span>
      {onCenter && <span className="absolute bottom-1.5 right-1.5 font-mono text-[8px] text-ink-3">click markers to inspect</span>}
    </div>
  )
}

export function coordLabel(p: GeoPoint) {
  return fmtCoords(p.lat, p.lng)
}
