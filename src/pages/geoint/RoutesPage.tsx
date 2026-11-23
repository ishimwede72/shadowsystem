import { useMemo, useState } from 'react'
import { Route as RouteIcon, Plus, Navigation, MapPin, Timer, Compass, Download } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, Select, Slider, InlineAlert, Divider, EmptyState, StatCard, Tabs } from '@/components/ui'
import { WorldMap } from '@/components/maps/WorldMap'
import { useEngine } from '@/services/engine'
import { CITIES } from '@/data/vocabulary'
import { downloadFile, fmtCoords, toCSV } from '@/lib/utils'

export default function RoutesPage() {
  const s = useEngine()
  const [selected, setSelected] = useState(s.routes[0]?.id ?? null)
  const [fromCity, setFromCity] = useState<string>(CITIES[0].city)
  const [toCity, setToCity] = useState<string>(CITIES[3].city)
  const [waypointCount, setWaypointCount] = useState(1)
  const [customized, setCustomized] = useState<{ id: string; from: string; to: string; waypoints: number }[]>([])

  const route = s.routes.find((r) => r.id === selected)

  const preview = useMemo(() => {
    const a = CITIES.find((c) => c.city === fromCity)!
    const b = CITIES.find((c) => c.city === toCity)!
    const mid = {
      lat: (a.lat + b.lat) / 2 + (waypointCount - 1) * 1.4,
      lng: (a.lng + b.lng) / 2 - (waypointCount - 1) * 1.2,
    }
    const waypoints = [ { lat: a.lat, lng: a.lng }, ...(waypointCount > 0 ? [mid] : []), { lat: b.lat, lng: b.lng } ]
    return { a, b, waypoints, distance: Math.round(Math.hypot(a.lat - b.lat, a.lng - b.lng) * 111) }
  }, [fromCity, toCity, waypointCount])

  const markers = useMemo(
    () =>
      preview.waypoints.map((w, i) => ({
        id: `wp-${i}`,
        label: i === 0 ? preview.a.city : i === preview.waypoints.length - 1 ? preview.b.city : `WP-${i}`,
        lat: w.lat,
        lng: w.lng,
        tone: (i === 0 ? 'green' : i === preview.waypoints.length - 1 ? 'red' : 'amber') as 'green' | 'red' | 'amber',
        kind: 'city' as const,
      })),
    [preview],
  )

  const arcs = useMemo(
    () =>
      preview.waypoints.slice(0, -1).map((w, i) => ({
        id: `arc-${i}`,
        from: w,
        to: preview.waypoints[i + 1],
        tone: 'cyan' as const,
        dashed: true,
      })),
    [preview],
  )

  const createRoute = () => {
    setCustomized((c) => [{ id: `RTE-${String(900 + c.length)}`, from: fromCity, to: toCity, waypoints: waypointCount }, ...c])
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="GLOBAL INTELLIGENCE · ROUTE SIMULATOR"
        title="Route Simulator"
        subtitle="Construct fictional routes between demonstration locations with waypoints, distance and ETA."
        icon={RouteIcon}
        meta={
          <>
            <span className="badge badge-cyan">{s.routes.length} PREDEFINED</span>
            <span className="badge badge-grey">{customized.length} CUSTOM</span>
            <span className="badge badge-amber">GENERATED GEOGRAPHY</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadFile(`shadow-routes-${Date.now()}.csv`, toCSV(s.routes.map(({ id, name, from, to, distanceKm, eta }) => ({ id, name, from, to, distanceKm, eta }))), 'text/csv')}
          >
            <Download size={11} /> Export routes
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Route library" value={s.routes.length} icon={RouteIcon} accent="cyan" />
        <StatCard label="Custom routes" value={customized.length} icon={Plus} accent="green" />
        <StatCard label="Total distance" value={`${(s.routes.reduce((a, r) => a + r.distanceKm, 0) / 1000).toFixed(1)}k km`} icon={Navigation} accent="blue" />
        <StatCard label="Average ETA" value={s.routes[0]?.eta ?? '—'} icon={Timer} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Panel title="Route Preview" icon={MapPin} bodyClassName="p-0" className="min-h-[360px]"
            actions={<span className="badge badge-grey">{preview.distance.toLocaleString()} KM (EST)</span>}
          >
            <WorldMap markers={markers} arcs={arcs} showLegend={false} className="h-[360px]" />
          </Panel>

          <Panel title="Route Library" icon={RouteIcon} bodyClassName="p-0"
            actions={<Tabs size="sm" className="border-0" value="lib" onChange={() => {}} tabs={[{ id: 'lib', label: 'Predefined', count: s.routes.length }]} />}
          >
            <table className="data-table">
              <thead><tr><th>Route</th><th>From → To</th><th>Waypoints</th><th>Distance</th><th>ETA</th><th></th></tr></thead>
              <tbody>
                {s.routes.map((r) => (
                  <tr key={r.id} data-selected={selected === r.id}>
                    <td className="mono text-[10px] text-[var(--accent)]">{r.id}</td>
                    <td className="text-[10.5px] text-ink">{r.name}</td>
                    <td className="mono text-[10px]">{r.waypoints.length}</td>
                    <td className="mono text-[10px]">{r.distanceKm.toLocaleString()} km</td>
                    <td className="mono text-[10px]">{r.eta}</td>
                    <td><button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelected(r.id)}>Inspect</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Build a Route" icon={Plus} subtitle="Fictional origin and destination">
            <div className="space-y-2.5">
              <Select label="Origin" value={fromCity} onChange={setFromCity} options={CITIES.map((c) => ({ value: c.city, label: `${c.city}, ${c.country}` }))} />
              <Select label="Destination" value={toCity} onChange={setToCity} options={CITIES.filter((c) => c.city !== fromCity).map((c) => ({ value: c.city, label: `${c.city}, ${c.country}` }))} />
              <Slider label="Waypoints" min={0} max={4} value={waypointCount} onChange={setWaypointCount} />
              <div className="border border-line bg-bg p-2">
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Origin', v: `${preview.a.city} (${fmtCoords(preview.a.lat, preview.a.lng)})` },
                    { k: 'Destination', v: `${preview.b.city} (${fmtCoords(preview.b.lat, preview.b.lng)})` },
                    { k: 'Waypoints', v: String(waypointCount + 2) + ' total' },
                    { k: 'Estimated distance', v: `${preview.distance.toLocaleString()} km` },
                    { k: 'Estimated time', v: `${Math.max(1, Math.round(preview.distance / 780))}h ${Math.round((preview.distance / 780 % 1) * 60)}m` },
                  ]}
                />
              </div>
              <button type="button" className="btn btn-primary w-full" onClick={createRoute}><Plus size={11} /> Add to custom routes</button>
            </div>
          </Panel>

          {route && (
            <Panel title="Selected Route" icon={Navigation} subtitle={route.id} actions={<StatusPill value="active" label="LIBRARY" />}>
              <KeyValue
                cols={1}
                items={[
                  { k: 'Name', v: route.name },
                  { k: 'Origin', v: route.from },
                  { k: 'Destination', v: route.to },
                  { k: 'Waypoints', v: String(route.waypoints.length) },
                  { k: 'Distance', v: `${route.distanceKm.toLocaleString()} km` },
                  { k: 'ETA', v: route.eta },
                ]}
              />
              <Divider label="WAYPOINT COORDINATES" />
              <ul className="space-y-1">
                {route.waypoints.map((w, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="mono text-[9.5px] text-ink-3">WP-{i}</span>
                    <span className="mono text-[9.5px] text-ink-2">{fmtCoords(w.lat, w.lng)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {customized.length > 0 && (
            <Panel title="Custom Routes" icon={Compass} bodyClassName="p-0">
              <ul className="divide-y divide-line-soft">
                {customized.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-2.5 py-1.5">
                    <span>
                      <span className="block text-[10.5px] text-ink">{c.from} → {c.to}</span>
                      <span className="block font-mono text-[8.5px] text-ink-3">{c.id} · {c.waypoints} waypoints</span>
                    </span>
                    <StatusPill value="pending" label="CUSTOM" dot={false} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Route Comparison" icon={RouteIcon}>
          <ul className="space-y-1.5">
            {s.routes.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span className="w-36 shrink-0 truncate text-[10.5px] text-ink-2">{r.name}</span>
                <div className="h-1 flex-1 bg-[#16212b]">
                  <div className="h-full bg-cyan" style={{ width: `${(r.distanceKm / 11200) * 100}%` }} />
                </div>
                <span className="mono w-20 text-right text-[9.5px] text-ink-3">{r.distanceKm.toLocaleString()} km</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Simulation Notes" icon={Compass}>
          <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
            <li>• Distances are straight-line approximations between generated coordinates.</li>
            <li>• ETA assumes a constant demonstration velocity — no real routing engine is used.</li>
            <li>• Waypoints can be added to create natural-looking cinematic arcs.</li>
            <li>• Route geometry is drawn with quadratic curves for a broadcast-friendly look.</li>
          </ul>
          {s.routes.length === 0 && <EmptyState icon={RouteIcon} title="No routes" />}
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Generated routes">
        Routes connect fictional positions. They are not travel plans and do not correspond to real journeys or people.
      </InlineAlert>
    </Screen>
  )
}

