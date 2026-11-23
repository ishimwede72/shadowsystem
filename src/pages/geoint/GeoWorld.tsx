import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe2, Layers, Play, Pause, Square, Navigation, Crosshair, MapPin,
  Route as RouteIcon, ShieldAlert, Search, ArrowUpRight, Radio,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, InlineAlert, Toggle, Progress, Divider, EmptyState, Tabs } from '@/components/ui'
import { WorldMap, type MapMarker, type MapArc, type MapRing } from '@/components/maps/WorldMap'
import { useEngine } from '@/services/engine'
import { cn, fmtCoords, fmtDateTime, relTime } from '@/lib/utils'
import { CITIES } from '@/data/vocabulary'

export default function GeoWorld() {
  const navigate = useNavigate()
  const s = useEngine()
  const [selected, setSelected] = useState<string | null>(s.targets[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [layers, setLayers] = useState({ targets: true, missions: true, nodes: true, incidents: true, fences: false, trails: true })
  const [zoom, setZoom] = useState(1)
  const [tab, setTab] = useState('targets')
  const [consent, setConsent] = useState<'idle' | 'granted' | 'denied'>('idle')

  const target = s.targets.find((t) => t.id === selected)

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = []
    if (layers.targets) {
      s.targets.forEach((t) =>
        m.push({
          id: t.id,
          label: t.codename,
          lat: t.position.lat,
          lng: t.position.lng,
          tone: t.risk === 'severe' || t.risk === 'high' ? 'red' : t.risk === 'elevated' ? 'amber' : 'cyan',
          kind: 'target',
          pulse: t.moving,
          meta: `${t.city} · ${t.status.toUpperCase()}`,
        }),
      )
    }
    if (layers.missions) {
      s.missions.filter((x) => x.status === 'active' || x.status === 'paused').forEach((x, i) => {
        const city = CITIES[(i * 5 + 2) % CITIES.length]
        m.push({ id: x.id, label: x.code, lat: city.lat, lng: city.lng, tone: 'amber', kind: 'mission', meta: `${x.progress}% · ${x.status}` })
      })
    }
    if (layers.nodes) {
      s.networkNodes.filter((n) => n.status !== 'offline').slice(0, 10).forEach((n, i) => {
        const city = CITIES[(i * 3 + 7) % CITIES.length]
        m.push({ id: n.id, label: n.hostname, lat: city.lat, lng: city.lng, tone: 'blue', kind: 'node', meta: n.type })
      })
    }
    if (layers.incidents) {
      s.crisisIncidents.forEach((c, i) => {
        const city = CITIES[(i * 9 + 4) % CITIES.length]
        m.push({ id: c.id, label: c.id, lat: city.lat, lng: city.lng, tone: c.severity === 'critical' ? 'red' : 'amber', kind: 'alert', pulse: c.severity === 'critical', meta: c.title })
      })
    }
    if (layers.fences) {
      s.geofences.filter((g) => g.active).forEach((g) => {
        m.push({ id: g.id, label: g.name, lat: g.center.lat, lng: g.center.lng, tone: 'green', kind: 'city', meta: `${g.radiusKm}km` })
      })
    }
    return m
  }, [s.targets, s.missions, s.networkNodes, s.crisisIncidents, s.geofences, layers])

  const arcs = useMemo<MapArc[]>(() => {
    const a: MapArc[] = []
    if (layers.trails) {
      s.targets.filter((t) => t.moving).slice(0, 6).forEach((t, i) =>
        a.push({ id: `tr-${t.id}`, from: t.lastPosition, to: t.position, tone: i % 2 ? 'green' : 'cyan' }),
      )
    }
    s.routes.slice(0, 3).forEach((r) => {
      const from = r.waypoints[0]
      const to = r.waypoints[r.waypoints.length - 1]
      a.push({ id: r.id, from, to, tone: 'blue', dashed: true, label: r.name })
    })
    return a
  }, [s.targets, s.routes, layers.trails])

  const rings = useMemo<MapRing[]>(
    () =>
      layers.fences
        ? s.geofences.filter((g) => g.active).map((g) => ({ id: g.id, center: g.center, radiusKm: g.radiusKm, tone: g.color, label: g.name }))
        : [],
    [s.geofences, layers.fences],
  )

  const filteredTargets = s.targets.filter((t) => !search || `${t.codename} ${t.name} ${t.city}`.toLowerCase().includes(search.toLowerCase()))

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setConsent('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setConsent('granted'),
      () => setConsent('denied'),
      { timeout: 8000 },
    )
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="GLOBAL INTELLIGENCE · GEOSPATIAL"
        title="World Map"
        subtitle="Map-first geospatial intelligence. Pan, zoom, filter layers and inspect fictional targets."
        icon={Globe2}
        meta={
          <>
            <span className="badge badge-cyan">{markers.length} MARKERS</span>
            <span className="badge badge-grey">{s.targets.filter((t) => t.moving).length} IN MOTION</span>
            <span className="badge badge-blue">ZOOM {zoom.toFixed(2)}x</span>
            <span className="badge badge-amber">SIMULATED COORDINATES</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/geoint/targets')}><Crosshair size={11} /> Targets</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/geoint/routes')}><RouteIcon size={11} /> Routes</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel
            title="Global Operations Map"
            icon={Globe2}
            subtitle="Natural Earth projection · fictional telemetry"
            bodyClassName="p-0"
            className="min-h-[520px]"
            actions={
              <>
                <div className="relative">
                  <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find target…" className="field h-6 w-32 pl-6 text-[10px]" />
                </div>
                <span className="badge badge-grey">Z {zoom.toFixed(2)}</span>
              </>
            }
          >
            <WorldMap
              markers={markers}
              arcs={arcs}
              rings={rings}
              selectedId={selected}
              onSelect={(id) => {
                if (id.startsWith('TGT')) setSelected(id)
              }}
              onViewportChange={setZoom}
              className="h-[520px]"
            />
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Map Layers" icon={Layers}>
              <div className="space-y-1.5">
                {(Object.keys(layers) as (keyof typeof layers)[]).map((k) => (
                  <div key={k} className="flex items-center justify-between border-b border-line-soft/50 pb-1">
                    <span className="text-[10.5px] capitalize text-ink-2">{k}</span>
                    <Toggle checked={layers[k]} onChange={(v) => setLayers((l) => ({ ...l, [k]: v }))} label="" />
                  </div>
                ))}
              </div>
              <Divider />
              <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
                Layer state is local to this view. Rendered from the shared simulation store.
              </p>
            </Panel>

            <Panel title="Region Focus" icon={Navigation} subtitle="Jump the map to a simulated region">
              <div className="grid grid-cols-2 gap-1">
                {CITIES.slice(0, 10).map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    className="btn btn-sm justify-start !px-2 !text-[9px]"
                    onClick={() => {
                      const t = s.targets.find((x) => x.city === c.city) ?? s.targets[0]
                      if (t) setSelected(t.id)
                    }}
                  >
                    <MapPin size={9} /> {c.city}
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <InlineAlert tone="amber" title="Fictional geography">
            All coordinates, targets, movements and incidents are generated. Shown country outlines come from the public
            Natural Earth dataset and carry no operational meaning.
          </InlineAlert>
        </div>

        <div className="space-y-3">
          <Panel title="Selected Target" icon={Crosshair} subtitle={target?.id} actions={target && <StatusPill value={target.status} />}>
            {target ? (
              <div className="space-y-3">
                <div>
                  <p className="label-xs">CODENAME</p>
                  <p className="font-display text-lg font-semibold uppercase tracking-wide text-ink">{target.codename}</p>
                  <p className="text-[11px] text-ink-3">{target.name} · {target.role}</p>
                </div>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Position', v: fmtCoords(target.position.lat, target.position.lng) },
                    { k: 'Last fix', v: fmtCoords(target.lastPosition.lat, target.lastPosition.lng) },
                    { k: 'City', v: `${target.city}, ${target.country}` },
                    { k: 'Movement', v: target.moving ? `MOVING · ${target.speedKts} kt` : 'STATIONARY' },
                    { k: 'Heading', v: `${target.heading}°` },
                    { k: 'Risk', v: target.risk.toUpperCase() },
                    { k: 'Mission', v: s.missions.find((m) => m.id === target.missionId)?.code ?? '—' },
                  ]}
                />
                <div className="flex gap-1.5">
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.toggleTargetMoving(target.id)}>
                    {target.moving ? <Pause size={10} /> : <Play size={10} />} {target.moving ? 'Pause' : 'Start'}
                  </button>
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.setTargetPosition(target.id, target.position.lat + 0.02, target.position.lng + 0.02)}>
                    <Square size={10} /> Step
                  </button>
                </div>
                <div>
                  <p className="label-xs mb-1">ACTIVITY TRAIL</p>
                  <ul className="max-h-[120px] space-y-1 overflow-y-auto">
                    {target.activity.map((a, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 border-b border-line-soft/50 pb-1">
                        <span className="min-w-0">
                          <span className="block truncate text-[10px] text-ink-2">{a.label}</span>
                          <span className="block font-mono text-[8.5px] text-ink-3">{fmtCoords(a.lat, a.lng)}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[8px] text-ink-3">{relTime(a.ts)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <EmptyState icon={Crosshair} title="No target selected" message="Click a marker on the map or pick one below." />
            )}
          </Panel>

          <Panel title="Tracked Targets" icon={Radio} bodyClassName="p-0"
            actions={<button type="button" className="icon-btn" aria-label="Open targets" title="Open targets" onClick={() => navigate('/geoint/targets')}><ArrowUpRight size={12} /></button>}
          >
            <div className="max-h-[260px] overflow-y-auto">
              {filteredTargets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={cn('flex w-full items-center justify-between gap-2 border-b border-line-soft px-2 py-1.5 text-left', selected === t.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-elevated')}
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] text-ink">{t.codename}</span>
                    <span className="block truncate text-[9px] text-ink-3">{t.city}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {t.moving && <span className="dot animate-pulse bg-green" />}
                    <span className={cn('mono text-[8.5px] uppercase', t.risk === 'severe' || t.risk === 'high' ? 'text-red' : t.risk === 'elevated' ? 'text-amber' : 'text-ink-3')}>{t.risk}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Consent Location Demo" icon={ShieldAlert} subtitle="Optional · explicit consent">
            {consent === 'idle' && (
              <>
                <p className="text-[10.5px] leading-relaxed text-ink-2">
                  You may optionally share <strong className="text-ink">your own browser location</strong> to see how a demo
                  marker would sit on the map. It is never stored, logged or transmitted.
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" className="btn btn-sm flex-1" onClick={requestLocation}><Crosshair size={10} /> Share location</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConsent('denied')}>No thanks</button>
                </div>
              </>
            )}
            {consent === 'granted' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-2">Location sharing</span>
                  <StatusPill value="active" label="ACTIVE" />
                </div>
                <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
                  Browser permission granted. The coordinates are held in memory only while this page is open.
                </p>
                <button type="button" className="btn btn-sm btn-danger w-full" onClick={() => setConsent('idle')}>
                  <Square size={10} /> Stop sharing immediately
                </button>
              </div>
            )}
            {consent === 'denied' && (
              <div className="space-y-2">
                <p className="text-[10.5px] text-ink-2">Default mode remains active: all coordinates shown are fictional.</p>
                <button type="button" className="btn btn-sm w-full" onClick={() => setConsent('idle')}>Reconsider</button>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Simulated Locations" icon={MapPin} bodyClassName="p-0"
        actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'targets', label: 'Targets' }, { id: 'fences', label: 'Geofences' }, { id: 'routes', label: 'Routes' }]} />}
      >
        {tab === 'targets' && (
          <table className="data-table">
            <thead><tr><th>Target</th><th>Codename</th><th>Coordinates</th><th>City</th><th>Linked mission</th><th>Status</th></tr></thead>
            <tbody>
              {s.targets.map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => setSelected(t.id)}>
                  <td className="mono text-[10px] text-[var(--accent)]">{t.id}</td>
                  <td className="text-ink">{t.codename}</td>
                  <td className="mono text-[9.5px] text-ink-2">{fmtCoords(t.position.lat, t.position.lng)}</td>
                  <td className="text-[10.5px]">{t.city}</td>
                  <td className="mono text-[9.5px] text-ink-3">{s.missions.find((m) => m.id === t.missionId)?.code ?? '—'}</td>
                  <td><StatusPill value={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'fences' && (
          <table className="data-table">
            <thead><tr><th>Geofence</th><th>Center</th><th>Radius</th><th>Triggers</th><th>Active</th></tr></thead>
            <tbody>
              {s.geofences.map((g) => (
                <tr key={g.id}>
                  <td className="text-ink">{g.name}</td>
                  <td className="mono text-[9.5px] text-ink-2">{fmtCoords(g.center.lat, g.center.lng)}</td>
                  <td className="mono text-[10px]">{g.radiusKm} km</td>
                  <td className="mono text-[10px]">{g.triggers}</td>
                  <td><Toggle checked={g.active} onChange={() => s.toggleGeofence(g.id)} label="" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'routes' && (
          <table className="data-table">
            <thead><tr><th>Route</th><th>From → To</th><th>Waypoints</th><th>Distance</th><th>ETA</th></tr></thead>
            <tbody>
              {s.routes.map((r) => (
                <tr key={r.id}>
                  <td className="mono text-[10px] text-[var(--accent)]">{r.id}</td>
                  <td className="text-ink">{r.name}</td>
                  <td className="mono text-[10px]">{r.waypoints.length}</td>
                  <td className="mono text-[10px]">{r.distanceKm.toLocaleString()} km</td>
                  <td className="mono text-[10px]">{r.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Recent Location Events" icon={MapPin} bodyClassName="p-0">
        <div className="max-h-[260px] overflow-y-auto">
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>Target</th><th>Event</th><th>Coordinates</th><th>Scenario</th></tr></thead>
            <tbody>
              {s.targets.flatMap((t) => t.activity.map((a) => ({ ...a, target: t }))).sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 14).map((a, i) => (
                <tr key={`${a.target.id}-${i}`}>
                  <td className="mono whitespace-nowrap text-[9.5px]">{fmtDateTime(a.ts)}</td>
                  <td className="mono text-[10px] text-[var(--accent)]">{a.target.codename}</td>
                  <td className="text-[10.5px] text-ink-2">{a.label}</td>
                  <td className="mono text-[9.5px] text-ink-3">{fmtCoords(a.lat, a.lng)}</td>
                  <td className="mono text-[9.5px] text-ink-3">{s.missions.find((m) => m.id === a.target.missionId)?.code ?? 'AD-HOC'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Progress value={75} label="Rendering budget" color="#28d8ea" height={2} />
    </Screen>
  )
}
