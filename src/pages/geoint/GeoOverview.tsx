import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe2, Crosshair, Route as RouteIcon, ShieldAlert, MapPin, Navigation,
  ArrowUpRight, Radio, Compass, Layers,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, KeyValue, Progress, InlineAlert, Divider } from '@/components/ui'
import { WorldMap } from '@/components/maps/WorldMap'
import { AreaTrend, Donut, PALETTE, ChartLegend, HeatStrip } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { CITIES } from '@/data/vocabulary'
import { cn, fmtCoords, relTime } from '@/lib/utils'

export default function GeoOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const markers = useMemo(
    () => [
      ...s.targets.map((t) => ({
        id: t.id,
        label: t.codename,
        lat: t.position.lat,
        lng: t.position.lng,
        tone: (t.risk === 'severe' || t.risk === 'high' ? 'red' : t.risk === 'elevated' ? 'amber' : 'cyan') as 'red' | 'amber' | 'cyan',
        kind: 'target' as const,
        pulse: t.moving,
        meta: t.city,
      })),
      ...s.geofences.filter((g) => g.active).map((g) => ({
        id: g.id,
        label: g.name,
        lat: g.center.lat,
        lng: g.center.lng,
        tone: 'green' as const,
        kind: 'city' as const,
        meta: `${g.radiusKm}km`,
      })),
    ],
    [s.targets, s.geofences],
  )

  const regions = useMemo(() => {
    const map = new Map<string, number>()
    s.targets.forEach((t) => map.set(t.country, (map.get(t.country) ?? 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [s.targets])

  const activitySeries = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        t: `D${i + 1}`,
        fixes: Math.round(18 + Math.sin(i / 1.8) * 9 + (i % 5) * 2),
        events: Math.round(6 + Math.cos(i / 2.1) * 4 + (i % 3)),
      })),
    [],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="GLOBAL INTELLIGENCE · OVERVIEW"
        title="Global Intelligence"
        subtitle="Geospatial intelligence overview: tracked fictional targets, movement patterns, geofences and regional activity."
        icon={Globe2}
        meta={
          <>
            <span className="badge badge-cyan">{s.targets.length} TARGETS</span>
            <span className="badge badge-green">{s.targets.filter((t) => t.moving).length} MOVING</span>
            <span className="badge badge-grey">{s.geofences.filter((g) => g.active).length} ACTIVE FENCES</span>
            <span className="badge badge-blue">{s.routes.length} ROUTES</span>
          </>
        }
        actions={<button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/geoint/world')}><Globe2 size={11} /> Open world map</button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tracked targets" value={s.targets.length} icon={Crosshair} accent="cyan" onClick={() => navigate('/geoint/targets')} />
        <StatCard label="In motion" value={s.targets.filter((t) => t.moving).length} icon={Navigation} accent="green" />
        <StatCard label="Geofences" value={s.geofences.length} icon={ShieldAlert} accent="amber" onClick={() => navigate('/geoint/geofencing')} />
        <StatCard label="Routes" value={s.routes.length} icon={RouteIcon} accent="blue" onClick={() => navigate('/geoint/routes')} />
        <StatCard label="Location fixes" value={s.targets.reduce((a, t) => a + t.trail.length, 0)} icon={MapPin} accent="cyan" />
        <StatCard label="Countries" value={new Set(s.targets.map((t) => t.country)).size} icon={Compass} accent="blue" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Operational Map" icon={Globe2} bodyClassName="p-0" className="min-h-[400px]"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/geoint/world')}>Full view <ArrowUpRight size={10} /></button>}
        >
          <WorldMap markers={markers} className="h-[400px]" onSelect={(id) => navigate(`/geoint/targets?q=${id}`)} showLegend />
        </Panel>

        <div className="space-y-3">
          <Panel title="Regional Distribution" icon={Layers}>
            <Donut
              data={regions.slice(0, 6).map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i] }))}
              height={170}
              centerLabel="REGIONS"
              centerValue={String(regions.length)}
            />
            <div className="grid grid-cols-2 gap-1">
              {regions.slice(0, 6).map(([name, count], i) => (
                <span key={name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate font-mono text-[8.5px] uppercase text-ink-3">
                    <span className="h-1.5 w-1.5 shrink-0" style={{ background: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i] }} />
                    {name}
                  </span>
                  <span className="mono text-[9px] text-ink-2">{count}</span>
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Movement Feed" icon={Radio} bodyClassName="p-0">
            <div className="max-h-[190px] overflow-y-auto font-terminal text-[10px]">
              {s.targets.filter((t) => t.moving).slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center gap-1.5 border-b border-line-soft/40 px-2 py-[3px]">
                  <span className="dot shrink-0 animate-pulse bg-green" />
                  <span className="shrink-0 text-[var(--accent)]">{t.codename}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-3">{fmtCoords(t.position.lat, t.position.lng)}</span>
                  <span className="shrink-0 text-ink-3">{t.speedKts}kt</span>
                </div>
              ))}
              {s.targets.filter((t) => t.moving).length === 0 && <p className="p-2 text-ink-3">No targets in motion.</p>}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Collection Activity" icon={MapPin} className="lg:col-span-2" subtitle="Simulated location fixes and derived events">
          <AreaTrend
            data={activitySeries}
            keys={[{ key: 'fixes', color: PALETTE.cyan, label: 'Fixes' }, { key: 'events', color: PALETTE.amber, label: 'Events' }]}
            height={190}
          />
          <ChartLegend items={[{ label: 'Location fixes', color: PALETTE.cyan }, { label: 'Derived events', color: PALETTE.amber }]} />
        </Panel>
        <Panel title="Coverage Heat" icon={Layers} subtitle="Fixes by simulated region">
          <HeatStrip data={regions.map(([, v]) => v * 12)} />
          <Divider />
          <KeyValue
            cols={1}
            items={[
              { k: 'Highest activity', v: regions[0]?.[0] ?? '—' },
              { k: 'Active fences', v: String(s.geofences.filter((g) => g.active).length) },
              { k: 'Trail points', v: String(s.targets.reduce((a, t) => a + t.trail.length, 0)) },
              { k: 'Projection', v: 'Natural Earth' },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Target Risers" icon={Crosshair} bodyClassName="p-0" actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/geoint/targets')}>All targets <ArrowUpRight size={10} /></button>}>
          <table className="data-table">
            <thead><tr><th>Target</th><th>Location</th><th>Movement</th><th>Risk</th></tr></thead>
            <tbody>
              {s.targets.slice(0, 7).map((t) => (
                <tr key={t.id} className="cursor-pointer" onClick={() => navigate(`/geoint/targets?q=${t.id}`)}>
                  <td className="mono text-[10px] text-[var(--accent)]">{t.codename}</td>
                  <td className="text-[10.5px]">{t.city}</td>
                  <td><span className={cn('mono text-[9px] uppercase', t.moving ? 'text-green' : 'text-ink-3')}>{t.moving ? `${t.speedKts} kt` : 'static'}</span></td>
                  <td className={cn('mono text-[9px] uppercase', t.risk === 'severe' || t.risk === 'high' ? 'text-red' : t.risk === 'elevated' ? 'text-amber' : 'text-green')}>{t.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Geofence Status" icon={ShieldAlert} bodyClassName="p-0" actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/geoint/geofencing')}>Manage <ArrowUpRight size={10} /></button>}>
          <ul className="divide-y divide-line-soft">
            {s.geofences.slice(0, 6).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <span className="min-w-0">
                  <span className="block truncate text-[10.5px] text-ink">{g.name}</span>
                  <span className="block font-mono text-[8.5px] text-ink-3">{g.radiusKm} km radius · {g.triggers} triggers</span>
                </span>
                <StatusPill value={g.active ? 'active' : 'inactive'} label={g.active ? 'ARMED' : 'OFF'} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent Location Events" icon={MapPin} bodyClassName="p-0">
        <ul className="divide-y divide-line-soft">
          {s.targets.flatMap((t) => t.activity.map((a) => ({ ...a, codename: t.codename, city: t.city }))).sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 8).map((a, i) => (
            <li key={i} className="flex items-center gap-2 px-2.5 py-1.5">
              <MapPin size={10} className="shrink-0 text-ink-3" />
              <span className="mono w-20 shrink-0 text-[9.5px] text-[var(--accent)]">{a.codename}</span>
              <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-2">{a.label} · {a.city}</span>
              <span className="mono hidden shrink-0 text-[8.5px] text-ink-3 sm:block">{fmtCoords(a.lat, a.lng)}</span>
              <span className="shrink-0 font-mono text-[8.5px] text-ink-3">{relTime(a.ts)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Scenario Coverage" icon={Compass}>
          <div className="space-y-2">
            {CITIES.slice(0, 8).map((c) => {
              const count = s.targets.filter((t) => t.country === c.country).length
              return (
                <div key={c.city}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-ink-2">{c.city}, {c.country}</span>
                    <span className="mono text-[9.5px] text-ink-3">{count} targets</span>
                  </div>
                  <Progress value={(count / Math.max(1, s.targets.length)) * 100} color={PALETTE.cyan} height={2} />
                </div>
              )
            })}
          </div>
        </Panel>
        <Panel title="Module Notes" icon={Globe2}>
          <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
            <li>• All markers use generated coordinates around real city anchors.</li>
            <li>• Movement advances on engine ticks; pause and replay are supported.</li>
            <li>• Geofence triggers are simulated counters, not real alerts.</li>
            <li>• Browser location can optionally be used with explicit consent, and stopped instantly.</li>
          </ul>
          <InlineAlert tone="cyan" title="No real tracking">
            Nothing on this page locates, identifies or monitors a real person or device.
          </InlineAlert>
        </Panel>
      </div>
    </Screen>
  )
}
