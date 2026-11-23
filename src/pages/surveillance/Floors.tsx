import { useMemo, useState } from 'react'
import { Building2, Layers, Camera, ArrowUpRight, Users, DoorOpen, ShieldAlert, Radio } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, Progress, InlineAlert, Divider, Select, EmptyState, StatCard, Tag } from '@/components/ui'
import { SyntheticCamera } from '@/components/feeds/SyntheticCamera'
import { useEngine } from '@/services/engine'
import { cn } from '@/lib/utils'

export default function Floors() {
  const s = useEngine()
  const [floor, setFloor] = useState('1')
  const [selected, setSelected] = useState<string | null>(null)

  const floors = useMemo(() => Array.from(new Set(s.cameras.map((c) => c.floor))).sort((a, b) => a - b), [s.cameras])
  const cams = s.cameras.filter((c) => c.floor === Number(floor))
  const zoneGroups = useMemo(() => {
    const m = new Map<string, typeof cams>()
    cams.forEach((c) => m.set(c.zone, [...(m.get(c.zone) ?? []), c]))
    return Array.from(m.entries())
  }, [cams])

  const cam = s.cameras.find((c) => c.id === selected)

  // deterministic pseudo floor plan
  const rooms = useMemo(() => {
    const letters = 'ABCDEFGH'
    return Array.from({ length: 8 }, (_, i) => {
      const c = cams[i % Math.max(1, cams.length)]
      return {
        id: `${letters[i]}-${floor}`,
        label: c ? c.zone : 'STORAGE',
        camId: c?.id,
        x: (i % 4) * 25,
        y: Math.floor(i / 4) * 50,
        w: 25,
        h: 50,
        people: (i * 3 + Number(floor) * 2) % 6,
        door: i % 3 === 0,
      }
    })
  }, [cams, floor])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SURVEILLANCE · FLOOR PLAN"
        title="Facility Floors"
        subtitle="A fictional building with four floors. Select a floor to see zone coverage, camera placement and synthesised occupancy."
        icon={Building2}
        meta={
          <>
            <span className="badge badge-cyan">{floors.length} FLOORS</span>
            <span className="badge badge-grey">{s.cameras.length} CAMERAS</span>
            <span className="badge badge-green">{s.cameras.filter((c) => c.status === 'online').length} ONLINE</span>
            <span className="badge badge-amber">FICTIONAL FACILITY</span>
          </>
        }
        actions={<Select className="w-36" value={floor} onChange={setFloor} options={floors.map((f) => ({ value: String(f), label: `Floor ${f}` }))} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Floor" value={`L${floor}`} icon={Building2} accent="cyan" />
        <StatCard label="Cameras on floor" value={cams.length} icon={Camera} accent="blue" />
        <StatCard label="Zones" value={zoneGroups.length} icon={Layers} accent="green" />
        <StatCard label="Synthetic occupancy" value={rooms.reduce((a, r) => a + r.people, 0)} icon={Users} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <Panel title={`Floor ${floor} Plan`} icon={Layers} subtitle="Camera placement map · schematic" bodyClassName="p-2">
            <div className="relative aspect-[2/1] w-full overflow-hidden border border-line bg-[#070d12]">
              <div className="absolute inset-0 grid-bg opacity-40" />
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => r.camId && setSelected(r.camId)}
                  className={cn(
                    'absolute flex flex-col justify-between border p-1 text-left transition-colors',
                    r.camId === selected ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[#243542] hover:border-[#365064]',
                  )}
                  style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
                >
                  <span className="flex items-start justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-ink-3">{r.id}</span>
                    {r.camId && <span className="h-1.5 w-1.5 rounded-full bg-cyan" title="camera" />}
                  </span>
                  <span>
                    <span className="block truncate text-[9px] uppercase text-ink-2">{r.label}</span>
                    <span className="flex items-center gap-1 font-mono text-[7.5px] text-ink-3">
                      {r.door && <DoorOpen size={7} />} {r.people} occ · {r.camId ? 'CAM' : 'NO CAM'}
                    </span>
                  </span>
                </button>
              ))}
              <span className="absolute bottom-1 right-1.5 font-mono text-[7.5px] text-ink-3">SCHEMATIC · NOT TO SCALE</span>
            </div>
          </Panel>

          <Panel title={`Cameras on Floor ${floor}`} icon={Camera} bodyClassName="p-0">
            <table className="data-table">
              <thead><tr><th>Camera</th><th>Zone</th><th>Location</th><th>Signal</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {cams.map((c) => (
                  <tr key={c.id} data-selected={selected === c.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                    <td className="mono text-[10px] text-[var(--accent)]">{c.id}</td>
                    <td className="text-[10.5px]">{c.zone}</td>
                    <td className="text-[10.5px] text-ink-2">{c.location}</td>
                    <td className="mono text-[10px]">{c.signal}%</td>
                    <td><StatusPill value={c.status} /></td>
                    <td><button type="button" className="btn btn-sm btn-ghost !px-1.5" onClick={(e) => { e.stopPropagation(); s.setCameraStatus(c.id, c.status === 'online' ? 'offline' : 'online') }}>toggle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cams.length === 0 && <EmptyState icon={Camera} title="No cameras on this floor" />}
          </Panel>
        </div>

        <div className="space-y-3">
          {cam && (
            <Panel title={cam.id} subtitle={cam.location} icon={Camera} actions={<StatusPill value={cam.status} />}>
              <SyntheticCamera seed={cam.id} className="aspect-video border border-line" moving={cam.status === 'online'} />
              <KeyValue
                cols={1}
                items={[
                  { k: 'Zone', v: cam.zone },
                  { k: 'Floor', v: String(cam.floor) },
                  { k: 'Signal', v: `${cam.signal}%` },
                  { k: 'Resolution', v: cam.resolution },
                  { k: 'Favourite', v: cam.favorite ? 'YES' : 'NO' },
                ]}
              />
            </Panel>
          )}

          <Panel title="Zone Coverage" icon={Layers}>
            {zoneGroups.map(([z, list]) => (
              <div key={z} className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-2">{z}</span>
                  <span className="mono text-[9px] text-ink-3">{list.filter((c) => c.status === 'online').length}/{list.length} online</span>
                </div>
                <Progress value={(list.filter((c) => c.status === 'online').length / list.length) * 100} height={2} color={list.every((c) => c.status === 'online') ? '#38db91' : '#f5b942'} />
              </div>
            ))}
            {zoneGroups.length === 0 && <EmptyState icon={Layers} title="No zones" />}
          </Panel>

          <Panel title="Floor Summary" icon={Building2}>
            <KeyValue
              items={[
                { k: 'Floor', v: `L${floor}` },
                { k: 'Rooms', v: String(rooms.length) },
                { k: 'Cameras', v: String(cams.length) },
                { k: 'Recording', v: String(cams.filter((c) => c.recording).length) },
                { k: 'Offline', v: String(cams.filter((c) => c.status !== 'online').length) },
                { k: 'Occupancy', v: `${rooms.reduce((a, r) => a + r.people, 0)} sim` },
              ]}
            />
            <Divider />
            <div className="flex flex-wrap gap-1">
              <Tag tone="#28d8ea">SCHEMATIC</Tag>
              <Tag tone="#38db91">FICTIONAL</Tag>
              <Tag tone="#f5b942">NO REAL BUILDING</Tag>
            </div>
          </Panel>

          <Panel title="Quick Nav" icon={ArrowUpRight}>
            <div className="grid grid-cols-2 gap-1">
              {floors.map((f) => (
                <button key={f} type="button" onClick={() => { setFloor(String(f)); setSelected(null) }} className={cn('btn btn-sm', floor === String(f) && 'btn-primary')}>
                  <Layers size={9} /> Floor {f}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[9.5px] text-ink-3">
              <Radio size={9} /> Feeds update as you switch floors.
            </div>
          </Panel>

          <Panel title="Open Incidents" icon={ShieldAlert} bodyClassName="p-0">
            <ul className="max-h-[160px] divide-y divide-line-soft overflow-y-auto">
              {s.surveillanceIncidents.filter((i) => i.status === 'open').map((i) => (
                <li key={i.id} className="px-2 py-1">
                  <span className="mono text-[8.5px] text-[var(--accent)]">{i.cameraId}</span>
                  <span className="ml-1.5 text-[10px] text-ink-2">{i.detail}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional facility">
        Floors, rooms, cameras and occupancy counts are invented. The schematic is not derived from any real floor plan.
      </InlineAlert>
    </Screen>
  )
}
