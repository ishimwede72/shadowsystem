import { useMemo, useState } from 'react'
import { CircleDot, Crosshair, Plus, ShieldAlert, Radar, Bell, ToggleLeft } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, Toggle, Slider, InlineAlert, Divider, Select, StatCard, Modal } from '@/components/ui'
import { WorldMap, type MapRing } from '@/components/maps/WorldMap'
import { useEngine } from '@/services/engine'
import { CITIES } from '@/data/vocabulary'
import { cn, fmtCoords } from '@/lib/utils'

export default function Geofencing() {
  const s = useEngine()
  const [selected, setSelected] = useState(s.geofences[0]?.id ?? null)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState<string>(CITIES[0].city)
  const [radius, setRadius] = useState(12)
  const [alerts, setAlerts] = useState<{ id: string; fence: string; ts: string; kind: 'enter' | 'exit'; target: string }[]>([
    { id: 'ALT-001', fence: 'ZURICH FINANCIAL DISTRICT', ts: new Date(Date.now() - 240_000).toISOString(), kind: 'enter', target: 'NIGHTJAR' },
    { id: 'ALT-002', fence: 'SINGAPORE PORT ZONE', ts: new Date(Date.now() - 890_000).toISOString(), kind: 'exit', target: 'GRAYFIN' },
    { id: 'ALT-003', fence: 'DUBAI AIRPORT RING', ts: new Date(Date.now() - 1_500_000).toISOString(), kind: 'enter', target: 'CINDER' },
  ])

  const fence = s.geofences.find((g) => g.id === selected)

  const rings: MapRing[] = useMemo(
    () => s.geofences.filter((g) => g.active).map((g) => ({ id: g.id, center: g.center, radiusKm: g.radiusKm, tone: g.color })),
    [s.geofences],
  )

  const markers = useMemo(
    () => [
      ...s.targets.map((t) => ({
        id: t.id,
        label: t.codename,
        lat: t.position.lat,
        lng: t.position.lng,
        tone: 'cyan' as const,
        kind: 'target' as const,
        pulse: t.moving,
      })),
      ...s.geofences.map((g) => ({
        id: g.id,
        label: g.name,
        lat: g.center.lat,
        lng: g.center.lng,
        tone: (g.active ? 'green' : 'cyan') as 'green' | 'cyan',
        kind: 'city' as const,
        meta: `${g.radiusKm} km`,
      })),
    ],
    [s.targets, s.geofences],
  )

  const create = () => {
    if (!name.trim()) return
    const c = CITIES.find((x) => x.city === city)!
    s.addGeofence({
      name: name.toUpperCase(),
      center: { lat: c.lat, lng: c.lng },
      radiusKm: radius,
      active: true,
      color: '#28d8ea',
    })
    setCreateOpen(false)
    setName('')
  }

  const simulateAlert = () => {
    if (!fence) return
    const t = s.targets[Math.floor(Math.random() * s.targets.length)]
    const kind = Math.random() > 0.5 ? 'enter' : 'exit'
    setAlerts((a) => [
      { id: `ALT-${String(a.length + 4).padStart(3, '0')}`, fence: fence.name, ts: new Date().toISOString(), kind, target: t.codename },
      ...a,
    ])
    s.notify({
      type: 'incident',
      title: `Geofence ${kind === 'enter' ? 'entry' : 'exit'} (simulated)`,
      body: `${t.codename} ${kind === 'enter' ? 'entered' : 'left'} ${fence.name}`,
      severity: 'elevated',
      module: 'geoint',
    })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="GLOBAL INTELLIGENCE · GEOFENCING"
        title="Geofencing"
        subtitle="Draw fictional boundaries and trigger simulated entry/exit alerts. No real geography or device is monitored."
        icon={ShieldAlert}
        meta={
          <>
            <span className="badge badge-green">{s.geofences.filter((g) => g.active).length} ARMED</span>
            <span className="badge badge-grey">{s.geofences.length} DEFINED</span>
            <span className="badge badge-amber">{alerts.length} SIMULATED ALERTS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={simulateAlert}><Bell size={11} /> Trigger demo alert</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}><Plus size={11} /> New geofence</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Geofences" value={s.geofences.length} icon={CircleDot} accent="cyan" />
        <StatCard label="Armed" value={s.geofences.filter((g) => g.active).length} icon={Radar} accent="green" />
        <StatCard label="Triggers" value={s.geofences.reduce((a, g) => a + g.triggers, 0)} icon={Bell} accent="amber" />
        <StatCard label="Total radius" value={`${s.geofences.reduce((a, g) => a + g.radiusKm, 0)} km`} icon={Crosshair} accent="blue" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Panel title="Geofence Map" icon={Radar} bodyClassName="p-0" className="min-h-[400px]"
            actions={<span className="badge badge-grey">{rings.length} ARMED RINGS</span>}
          >
            <WorldMap markers={markers} rings={rings} selectedId={selected} onSelect={setSelected} className="h-[400px]" />
          </Panel>

          <Panel title="Defined Geofences" icon={CircleDot} bodyClassName="p-0">
            <table className="data-table">
              <thead><tr><th>Geofence</th><th>Center</th><th>Radius</th><th>Triggers</th><th>Armed</th><th></th></tr></thead>
              <tbody>
                {s.geofences.map((g) => (
                  <tr key={g.id} data-selected={selected === g.id} className="cursor-pointer" onClick={() => setSelected(g.id)}>
                    <td>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                        <span className="text-[10.5px] text-ink">{g.name}</span>
                      </span>
                    </td>
                    <td className="mono text-[9.5px] text-ink-3">{fmtCoords(g.center.lat, g.center.lng)}</td>
                    <td className="mono text-[10px]">{g.radiusKm} km</td>
                    <td className="mono text-[10px]">{g.triggers}</td>
                    <td onClick={(e) => e.stopPropagation()}><Toggle checked={g.active} onChange={() => s.toggleGeofence(g.id)} label="" /></td>
                    <td><span className={cn('mono text-[8.5px] uppercase', g.active ? 'text-green' : 'text-ink-3')}>{g.active ? 'ARMED' : 'OFF'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="space-y-3">
          {fence && (
            <Panel title={fence.name} subtitle={fence.id} icon={CircleDot} actions={<StatusPill value={fence.active ? 'active' : 'inactive'} label={fence.active ? 'ARMED' : 'OFF'} />}>
              <KeyValue
                cols={1}
                items={[
                  { k: 'Center', v: fmtCoords(fence.center.lat, fence.center.lng) },
                  { k: 'Radius', v: `${fence.radiusKm} km` },
                  { k: 'Triggers', v: String(fence.triggers) },
                  { k: 'State', v: fence.active ? 'ARMED' : 'DISARMED' },
                  { k: 'Mode', v: 'SIMULATED' },
                ]}
              />
              <Divider label="CONTROLS" />
              <button type="button" className="btn btn-sm w-full" onClick={() => s.toggleGeofence(fence.id)}>
                <ToggleLeft size={11} /> {fence.active ? 'Disarm fence' : 'Arm fence'}
              </button>
              <button type="button" className="btn btn-sm w-full mt-1.5" onClick={simulateAlert}><Bell size={11} /> Simulate boundary event</button>
            </Panel>
          )}

          <Panel title="Alert Stream" icon={Bell} bodyClassName="p-0" actions={<span className="badge badge-amber">{alerts.length}</span>}>
            <ul className="max-h-[260px] divide-y divide-line-soft overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[9px] uppercase tracking-wider text-ink-3">{a.id}</span>
                    <span className={cn('badge', a.kind === 'enter' ? 'badge-green' : 'badge-amber')}>{a.kind.toUpperCase()}</span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-ink-2">
                    <span className="text-[var(--accent)]">{a.target}</span> {a.kind === 'enter' ? 'entered' : 'left'} {a.fence}
                  </p>
                  <p className="mono text-[8.5px] text-ink-3">{new Date(a.ts).toISOString().slice(11, 19)}Z · SIMULATED</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Boundary Rules" icon={ShieldAlert}>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
              <li>• Armed fences generate simulated entry and exit events.</li>
              <li>• Triggers increment a demonstration counter only.</li>
              <li>• Alerts feed the global notification centre.</li>
              <li>• No GPS device, person or vehicle is monitored.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional boundaries">
        Geofences exist only inside the simulation. Circles are visual constructs — no real-world geolocation service or
        device tracking is involved.
      </InlineAlert>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Define Geofence"
        subtitle="Fictional boundary for demonstration alerts"
        icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={create} disabled={!name.trim()}><Plus size={11} /> Create fence</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="fence-name">Fence name</label>
            <input id="fence-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ZURICH HARBOR PERIMETER" />
          </div>
          <Select label="Anchor city" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c.city, label: `${c.city}, ${c.country}` }))} />
          <Slider label="Radius" min={1} max={80} value={radius} onChange={setRadius} suffix=" km" />
          <div className="border border-line bg-bg p-2">
            <KeyValue
              items={[
                { k: 'Center', v: fmtCoords(CITIES.find((c) => c.city === city)!.lat, CITIES.find((c) => c.city === city)!.lng) },
                { k: 'Radius', v: `${radius} km` },
              ]}
            />
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
