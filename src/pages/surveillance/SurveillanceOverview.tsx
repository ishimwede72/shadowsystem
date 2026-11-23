import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cctv, Camera, Radio, ShieldAlert, LayoutGrid, Activity, ArrowUpRight, Eye,
  PlayCircle, WifiOff, MapPin,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, KeyValue, Progress, InlineAlert, Divider, SeverityPill } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, HeatStrip } from '@/components/charts'
import { SyntheticCamera } from '@/components/feeds/SyntheticCamera'
import { useEngine } from '@/services/engine'
import { cn, relTime } from '@/lib/utils'

export default function SurveillanceOverview() {
  const navigate = useNavigate()
  const s = useEngine()
  const [focus, setFocus] = useState<string | null>(s.cameras[0]?.id ?? null)
  const cam = s.cameras.find((c) => c.id === focus) ?? s.cameras[0]

  const online = s.cameras.filter((c) => c.status === 'online')
  const degraded = s.cameras.filter((c) => c.status === 'degraded' || c.status === 'maintenance')
  const recording = s.cameras.filter((c) => c.recording)
  const openIncidents = s.surveillanceIncidents.filter((i) => i.status === 'open')

  const traffic = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ t: `${i * 4}m`, motion: Math.round(4 + Math.abs(Math.sin(i / 2.3)) * 22 + (i % 4)), signal: Math.round(70 + Math.cos(i / 1.7) * 18) })),
    [],
  )

  const byZone = useMemo(() => {
    const m = new Map<string, number>()
    s.cameras.forEach((c) => m.set(c.zone, (m.get(c.zone) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.cameras])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SURVEILLANCE · OVERVIEW"
        title="Surveillance Grid"
        subtitle="A fictional facility camera grid rendered entirely in the browser. No real camera, stream or device is accessed."
        icon={Cctv}
        meta={
          <>
            <span className="badge badge-green">{online.length}/{s.cameras.length} ONLINE</span>
            <span className="badge badge-amber">{degraded.length} DEGRADED</span>
            <span className="badge badge-cyan">{recording.length} RECORDING</span>
            <span className="badge badge-grey">SYNTHETIC FEEDS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/surveillance/floors')}><LayoutGrid size={11} /> Floors</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/surveillance/cameras')}><Cctv size={11} /> Camera wall</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Cameras" value={s.cameras.length} icon={Camera} accent="cyan" onClick={() => navigate('/surveillance/cameras')} />
        <StatCard label="Online" value={online.length} icon={Radio} accent="green" />
        <StatCard label="Degraded" value={degraded.length} icon={WifiOff} accent="amber" />
        <StatCard label="Recording" value={recording.length} icon={PlayCircle} accent="blue" />
        <StatCard label="Open incidents" value={openIncidents.length} icon={ShieldAlert} accent="red" onClick={() => navigate('/surveillance/incidents')} />
        <StatCard label="Zones" value={byZone.length} icon={MapPin} accent="cyan" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <Panel
          title="Primary Feed"
          icon={Eye}
          subtitle={cam ? `${cam.location} · floor ${cam.floor}` : undefined}
          bodyClassName="p-0"
          actions={cam ? <StatusPill value={cam.status} /> : undefined}
        >
          {cam && (
            <>
              <SyntheticCamera seed={cam.id} kind={undefined} className="aspect-video" scan />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line bg-[#0b1319] px-2.5 py-2 sm:grid-cols-4">
                <KeyValue cols={1} items={[{ k: 'Camera', v: cam.id }]} />
                <KeyValue cols={1} items={[{ k: 'Resolution', v: cam.resolution }]} />
                <KeyValue cols={1} items={[{ k: 'Signal', v: `${cam.signal}%` }]} />
                <KeyValue cols={1} items={[{ k: 'Frame rate', v: `${cam.fps} fps` }]} />
              </div>
            </>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Feed Selector" icon={LayoutGrid} bodyClassName="p-0" actions={<span className="badge badge-grey">{s.cameras.length}</span>}>
            <div className="grid max-h-[236px] grid-cols-2 gap-1 overflow-y-auto p-1">
              {s.cameras.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFocus(c.id)}
                  className={cn('relative overflow-hidden border text-left', focus === c.id ? 'border-[var(--accent)]' : 'border-line hover:border-line-strong')}
                >
                  <div className="grid grid-cols-4 gap-x-1 p-1 font-mono text-[7.5px] leading-tight text-ink-3">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="truncate opacity-40">{String((i * 37 + c.signal) % 100).padStart(2, '0')}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-line-soft px-1 py-0.5">
                    <span className="truncate font-mono text-[8px] text-ink-2">{c.id}</span>
                    <span className={cn('h-1.5 w-1.5 rounded-full', c.status === 'online' ? 'bg-green' : c.status === 'degraded' ? 'bg-amber' : 'bg-red')} />
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Open Incidents" icon={ShieldAlert} bodyClassName="p-0"
            actions={<button type="button" className="icon-btn" aria-label="Open incidents" title="Open incidents" onClick={() => navigate('/surveillance/incidents')}><ArrowUpRight size={12} /></button>}
          >
            <ul className="max-h-[190px] divide-y divide-line-soft overflow-y-auto">
              {openIncidents.slice(0, 6).map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-2 px-2.5 py-1.5">
                  <span className="min-w-0">
                    <span className="flex items-center gap-1">
                      <span className="mono text-[9px] uppercase tracking-wider text-ink-3">{i.cameraId}</span>
                      <SeverityPill value={i.severity} />
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-ink-2">{i.detail}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[8px] text-ink-3">{relTime(i.timestamp)}</span>
                </li>
              ))}
              {openIncidents.length === 0 && <li className="px-2.5 py-3 text-[10.5px] text-ink-3">No open incidents.</li>}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Motion Volume" icon={Activity} className="lg:col-span-2" subtitle="Synthetic motion detections per window">
          <AreaTrend
            data={traffic}
            keys={[{ key: 'motion', color: PALETTE.cyan, label: 'Motion events' }, { key: 'signal', color: PALETTE.green, label: 'Avg signal %' }]}
            height={190}
          />
          <ChartLegend items={[{ label: 'Motion events', color: PALETTE.cyan }, { label: 'Average signal', color: PALETTE.green }]} />
        </Panel>
        <Panel title="Cameras by Zone" icon={MapPin}>
          <Donut
            data={byZone.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red][i % 5] }))}
            height={168}
            centerLabel="CAMERAS"
            centerValue={String(s.cameras.length)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Camera Roster" icon={Camera} bodyClassName="p-0" actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/surveillance/cameras')}>Open wall <ArrowUpRight size={10} /></button>}>
          <table className="data-table">
            <thead><tr><th>Camera</th><th>Location</th><th>Zone</th><th>Floor</th><th>Signal</th><th>Status</th><th>Rec</th></tr></thead>
            <tbody>
              {s.cameras.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => setFocus(c.id)} data-selected={focus === c.id}>
                  <td className="mono text-[10px] text-[var(--accent)]">{c.id}</td>
                  <td className="text-[10.5px] text-ink">{c.label}</td>
                  <td className="text-[10.5px]">{c.zone}</td>
                  <td className="mono text-[10px]">{c.floor}</td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      <Progress value={c.signal} height={2} className="w-10" color={c.signal > 80 ? PALETTE.green : c.signal > 50 ? PALETTE.amber : PALETTE.red} />
                      <span className="mono text-[9px] text-ink-3">{c.signal}%</span>
                    </span>
                  </td>
                  <td><StatusPill value={c.status} /></td>
                  <td><span className={cn('mono text-[8.5px] uppercase', c.recording ? 'text-red' : 'text-ink-3')}>{c.recording ? 'REC' : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-3">
          <Panel title="Coverage by Floor" icon={LayoutGrid}>
            {[1, 2, 3, 4].map((f) => {
              const cams = s.cameras.filter((c) => c.floor === f)
              const on = cams.filter((c) => c.status === 'online').length
              return (
                <div key={f} className="mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-ink-2">Floor {f}</span>
                    <span className="mono text-[9.5px] text-ink-3">{on}/{cams.length} online</span>
                  </div>
                  <Progress value={cams.length ? (on / cams.length) * 100 : 0} color={on === cams.length ? PALETTE.green : PALETTE.amber} height={3} />
                </div>
              )
            })}
            <Divider />
            <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
              Facility layout is fictional. Floors, zones and camera positions are generated for demonstration purposes.
            </p>
          </Panel>

          <Panel title="Signal Health" icon={Radio} subtitle="Camera signal strength samples">
            <HeatStrip data={s.cameras.map((c) => c.signal)} />
            <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3">
              <span>WEAK</span><span>STRONG</span>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Recent Surveillance Events" icon={ShieldAlert} bodyClassName="p-0">
        <ul className="divide-y divide-line-soft">
          {s.surveillanceIncidents.slice(0, 8).map((i) => (
            <li key={i.id} className="flex items-center gap-2 px-2.5 py-[5px]">
              <span className="mono w-24 shrink-0 text-[9.5px] text-[var(--accent)]">{i.cameraId}</span>
              <SeverityPill value={i.severity} />
              <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-2">{i.detail}</span>
              <span className="mono hidden shrink-0 text-[8.5px] uppercase text-ink-3 sm:block">{i.type}</span>
              <span className="shrink-0 font-mono text-[8.5px] text-ink-3">{relTime(i.timestamp)}</span>
              <StatusPill value={i.status} dot={false} />
            </li>
          ))}
        </ul>
      </Panel>

      <InlineAlert tone="amber" title="Synthetic video only">
        Every feed is a generated SVG animation. This module never opens a webcam, connects to a stream, or records footage.
        All locations, people-shaped indicators and events are fictional.
      </InlineAlert>
    </Screen>
  )
}
