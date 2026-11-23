import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Crosshair, Play, Pause, Square, Navigation, Gauge, Route as RouteIcon,
  Download, Search, MapPin, Radio, Compass,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, Progress, Select, Slider, InlineAlert, EmptyState, Tabs, StatCard, Divider } from '@/components/ui'
import { WorldMap } from '@/components/maps/WorldMap'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtCoords, toCSV, clamp } from '@/lib/utils'
import { PALETTE, BarsTrend } from '@/components/charts'

export default function Targets() {
  const [params] = useSearchParams()
  const s = useEngine()
  const [selected, setSelected] = useState<string | null>(params.get('q') ?? s.targets[0]?.id ?? null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [playing, setPlaying] = useState(false)
  const [playIdx, setPlayIdx] = useState(0)
  const [speed] = useState(1)
  const [tab, setTab] = useState('detail')

  const target = s.targets.find((t) => t.id === selected)

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.targets.filter((x) => {
      if (t && !`${x.codename} ${x.name} ${x.city} ${x.country}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && x.status !== status) return false
      return true
    })
  }, [s.targets, q, status])

  const replay = () => {
    if (!target) return
    setPlaying(true)
    setPlayIdx(0)
    let i = 0
    const interval = setInterval(() => {
      i += 1
      if (i > target.trail.length - 1) {
        clearInterval(interval)
        setPlaying(false)
        return
      }
      setPlayIdx(i)
    }, 700 / speed)
  }

  const markers = useMemo(() => {
    const list = filtered.map((t) => ({
      id: t.id,
      label: t.codename,
      lat: t.id === selected && playing ? target?.trail[playIdx]?.lat ?? t.position.lat : t.position.lat,
      lng: t.id === selected && playing ? target?.trail[playIdx]?.lng ?? t.position.lng : t.position.lng,
      tone: (t.risk === 'severe' || t.risk === 'high' ? 'red' : t.risk === 'elevated' ? 'amber' : 'cyan') as 'red' | 'amber' | 'cyan',
      kind: 'target' as const,
      pulse: t.moving,
      meta: `${t.city} · ${t.status}`,
    }))
    return list
  }, [filtered, selected, playing, playIdx, target])

  const routes = target
    ? [{ id: 'trail', from: target.trail[0], to: target.trail[target.trail.length - 1], tone: 'green' as const }]
    : []

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="GLOBAL INTELLIGENCE · TARGETS"
        title="Fictional Target Management"
        subtitle="Generated target profiles with simulated movement, routes and location history. No real person is tracked."
        icon={Crosshair}
        meta={
          <>
            <span className="badge badge-cyan">{s.targets.length} TRACKED</span>
            <span className="badge badge-green">{s.targets.filter((t) => t.moving).length} IN MOTION</span>
            <span className="badge badge-amber">SYNTHETIC PROFILES</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => s.targets.forEach((t) => { if (!t.moving) s.toggleTargetMoving(t.id) })}>
              <Play size={11} /> Start all
            </button>
            <button type="button" className="btn btn-sm" onClick={() => s.targets.forEach((t) => { if (t.moving) s.toggleTargetMoving(t.id) })}>
              <Pause size={11} /> Pause all
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadFile(`shadow-targets-${Date.now()}.csv`, toCSV(s.targets.map(({ id, codename, name, role, status, city, country, risk, speedKts }) => ({ id, codename, name, role, status, city, country, risk, speedKts }))), 'text/csv')}
            >
              <Download size={11} /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tracked" value={s.targets.length} icon={Crosshair} accent="cyan" />
        <StatCard label="In motion" value={s.targets.filter((t) => t.moving).length} icon={Navigation} accent="green" />
        <StatCard label="High risk" value={s.targets.filter((t) => t.risk === 'high' || t.risk === 'severe').length} icon={Compass} accent="red" />
        <StatCard label="Lost / dormant" value={s.targets.filter((t) => t.status === 'lost' || t.status === 'dormant').length} icon={Radio} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <Panel title="Target Map" icon={MapPin} bodyClassName="p-0" className="min-h-[420px]"
            actions={<span className="badge badge-grey">{filtered.length} shown</span>}
          >
            <WorldMap markers={markers} arcs={routes} selectedId={selected} onSelect={setSelected} showLegend className="h-[420px]" />
          </Panel>

          <Panel title="Target Registry" icon={Crosshair} bodyClassName="p-0"
            actions={
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="relative">
                  <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="field h-6 w-32 pl-6 text-[10px]" />
                </div>
                <Select className="w-28" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All status' }, { value: 'tracked', label: 'Tracked' }, { value: 'dormant', label: 'Dormant' }, { value: 'lost', label: 'Lost' }, { value: 'confirmed', label: 'Confirmed' }]} />
              </div>
            }
          >
            <table className="data-table min-w-[720px]">
              <thead><tr><th>Target</th><th>Codename</th><th>City</th><th>Movement</th><th>Risk</th><th>Status</th><th>Controls</th></tr></thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} data-selected={selected === t.id} className="cursor-pointer" onClick={() => setSelected(t.id)}>
                    <td className="mono text-[10px] text-[var(--accent)]">{t.id}</td>
                    <td className="text-ink">{t.codename}</td>
                    <td className="text-[10.5px]">{t.city}, {t.country}</td>
                    <td>
                      <span className={cn('flex items-center gap-1 font-mono text-[9px] uppercase', t.moving ? 'text-green' : 'text-ink-3')}>
                        {t.moving ? <Navigation size={9} /> : <Square size={9} />} {t.moving ? `${t.speedKts} kt` : 'static'}
                      </span>
                    </td>
                    <td className={cn('mono text-[9px] uppercase', t.risk === 'severe' || t.risk === 'high' ? 'text-red' : t.risk === 'elevated' ? 'text-amber' : 'text-green')}>{t.risk}</td>
                    <td><StatusPill value={t.status} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm !px-1.5"
                        title={t.moving ? 'Pause tracking' : 'Start tracking'}
                        aria-label={`${t.moving ? 'Pause' : 'Start'} tracking ${t.codename}`}
                        onClick={(e) => { e.stopPropagation(); s.toggleTargetMoving(t.id) }}
                      >
                        {t.moving ? <Pause size={9} /> : <Play size={9} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Crosshair} title="No targets match" />}
          </Panel>
        </div>

        <div className="space-y-3">
          {target ? (
            <>
              <Panel title={target.codename} subtitle={target.id} icon={Crosshair} actions={<StatusPill value={target.status} />}>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Fictional name', v: target.name },
                    { k: 'Role', v: target.role },
                    { k: 'Position', v: fmtCoords(target.position.lat, target.position.lng) },
                    { k: 'Last recorded', v: fmtCoords(target.lastPosition.lat, target.lastPosition.lng) },
                    { k: 'Movement', v: target.moving ? 'MOVING' : 'STATIONARY' },
                    { k: 'Speed', v: `${target.speedKts} knots` },
                    { k: 'Heading', v: `${target.heading}°` },
                    { k: 'Mission', v: s.missions.find((m) => m.id === target.missionId)?.code ?? 'UNASSIGNED' },
                  ]}
                />
                <Divider label="MOVEMENT CONTROLS" />
                <div className="flex gap-1.5">
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.toggleTargetMoving(target.id)}>
                    {target.moving ? <Pause size={10} /> : <Play size={10} />} {target.moving ? 'Pause' : 'Start'}
                  </button>
                  <button type="button" className="btn btn-sm flex-1" onClick={() => { if (target.moving) s.toggleTargetMoving(target.id) }}>
                    <Square size={10} /> Stop
                  </button>
                </div>
                <div className="mt-2">
                  <Slider label="Movement speed" min={0} max={60} value={target.speedKts} onChange={() => {}} suffix=" kt" />
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.setTargetPosition(target.id, clamp(target.position.lat + 0.05, -85, 85), target.position.lng + 0.05)}>
                    <Navigation size={10} /> Step
                  </button>
                  <button type="button" className="btn btn-sm flex-1" onClick={replay}>
                    <RouteIcon size={10} /> Replay
                  </button>
                </div>
                {playing && <Progress className="mt-2" value={(playIdx / Math.max(1, target.trail.length - 1)) * 100} color={PALETTE.green} showValue label="Replaying trail" />}
              </Panel>

              <Panel title="Velocity Profile" icon={Gauge} subtitle="Simulated movement history">
                <BarsTrend
                  data={target.trail.map((_, i) => ({ t: String(i + 1), speed: Math.round(8 + Math.abs(Math.sin(i)) * 42) }))}
                  keys={[{ key: 'speed', color: PALETTE.cyan, label: 'knots' }]}
                  height={130}
                  xKey="t"
                />
              </Panel>

              <Panel title="Location Timeline" icon={MapPin} bodyClassName="p-0"
                actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'detail', label: 'Detail' }, { id: 'raw', label: 'Raw' }]} />}
              >
                {tab === 'detail' ? (
                  <ul className="max-h-[280px] divide-y divide-line-soft overflow-y-auto">
                    {target.activity.map((a, i) => (
                      <li key={i} className="px-2.5 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] text-ink-2">{a.label}</span>
                          <span className="mono text-[8.5px] text-ink-3">{new Date(a.ts).toISOString().slice(11, 19)}</span>
                        </div>
                        <p className="mono text-[8.5px] text-ink-3">{fmtCoords(a.lat, a.lng)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <pre className="max-h-[280px] overflow-auto p-2 font-terminal text-[9.5px] leading-relaxed text-ink-2">
                    {JSON.stringify({ id: target.id, codename: target.codename, trail: target.trail, activity: target.activity }, null, 2)}
                  </pre>
                )}
              </Panel>
            </>
          ) : (
            <Panel title="Target Detail"><EmptyState icon={Crosshair} title="Select a target" message="Choose a row or map marker to inspect movement history." /></Panel>
          )}
        </div>
      </div>

      <InlineAlert tone="amber" title="Synthetic target profiles">
        Codename, biography, movement and coordinates are randomly generated. No real individual is described, tracked or
        located by this module.
      </InlineAlert>
    </Screen>
  )
}
