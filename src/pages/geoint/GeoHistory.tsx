import { useMemo, useState } from 'react'
import { History, MapPin, Search, Download, Filter } from 'lucide-react'
import { Panel, PageHeader, Screen, Select, StatusPill, Tabs, EmptyState, InlineAlert, KeyValue, Divider, StatCard } from '@/components/ui'
import { WorldMap } from '@/components/maps/WorldMap'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtCoords, fmtDateTime, toCSV, relTime } from '@/lib/utils'
import { HeatStrip, PALETTE } from '@/components/charts'

export default function GeoHistory() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [targetId, setTargetId] = useState('all')
  const [tab, setTab] = useState('events')
  const [selected, setSelected] = useState<string | null>(null)

  const events = useMemo(() => {
    return s.targets
      .flatMap((t) => t.activity.map((a) => ({ ...a, targetId: t.id, codename: t.codename, city: t.city, missionId: t.missionId })))
      .sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
  }, [s.targets])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return events.filter((e) => {
      if (targetId !== 'all' && e.targetId !== targetId) return false
      if (t && !`${e.codename} ${e.label} ${e.city}`.toLowerCase().includes(t)) return false
      return true
    })
  }, [events, q, targetId])

  const trails = useMemo(() => {
    const list = (targetId === 'all' ? s.targets : s.targets.filter((t) => t.id === targetId))
    return list.flatMap((t) => t.trail.map((p) => ({ id: `${t.id}-${p.lat}-${p.lng}`, label: t.codename, lat: p.lat, lng: p.lng, tone: 'cyan' as const, kind: 'city' as const })))
  }, [s.targets, targetId])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="GLOBAL INTELLIGENCE · LOCATION HISTORY"
        title="Location History"
        subtitle="A generated timeline of fictional location events with coordinates, scenario links and event descriptions."
        icon={History}
        meta={
          <>
            <span className="badge badge-grey">{events.length} EVENTS</span>
            <span className="badge badge-cyan">{s.targets.length} TARGETS</span>
            <span className="badge badge-amber">SYNTHETIC COORDINATES</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadFile(`shadow-geohistory-${Date.now()}.csv`, toCSV(filtered.map(({ ts, codename, label, lat, lng, city, missionId }) => ({ ts, codename, label, lat, lng, city, missionId }))), 'text/csv')}
          >
            <Download size={11} /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total events" value={events.length} icon={History} accent="cyan" />
        <StatCard label="Distinct cities" value={new Set(events.map((e) => e.city)).size} icon={MapPin} accent="blue" />
        <StatCard label="Latest fix" value={events[0] ? relTime(events[0].ts) : '—'} icon={MapPin} accent="green" />
        <StatCard label="Trail points" value={s.targets.reduce((a, t) => a + t.trail.length, 0)} icon={MapPin} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <Panel title="Trail Map" icon={MapPin} bodyClassName="p-0" className="min-h-[340px]">
          <WorldMap markers={trails.slice(0, 60)} selectedId={selected} onSelect={setSelected} showLegend={false} className="h-[340px]" />
        </Panel>
        <Panel title="Filter & Inspect" icon={Filter}>
          <div className="space-y-2">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="field pl-7" />
            </div>
            <Select label="Target" value={targetId} onChange={setTargetId} options={[{ value: 'all', label: 'All targets' }, ...s.targets.map((t) => ({ value: t.id, label: `${t.codename} · ${t.city}` }))]} />
          </div>
          <Divider />
          <KeyValue
            items={[
              { k: 'Filtered events', v: String(filtered.length) },
              { k: 'Target scope', v: targetId === 'all' ? 'ALL' : targetId },
              { k: 'Date range', v: 'ROLLING GENERATED' },
              { k: 'Source', v: 'SIM ENGINE' },
            ]}
          />
          <Divider label="ACTIVITY DENSITY" />
          <HeatStrip data={filtered.slice(0, 24).map((_, i) => 20 + ((i * 17) % 70))} />
          <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3">
            <span>OLDEST</span><span>NEWEST</span>
          </div>
        </Panel>
      </div>

      <Panel title="Event Timeline" icon={History} bodyClassName="p-0"
        actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'events', label: 'Events', count: filtered.length }, { id: 'tracks', label: 'Tracks', count: s.targets.length }]} />}
      >
        {tab === 'events' ? (
          <>
            <div className="max-h-[52vh] overflow-auto">
              <table className="data-table min-w-[760px]">
                <thead><tr><th>Timestamp</th><th>Target</th><th>Location label</th><th>Coordinates</th><th>City</th><th>Scenario</th><th>Description</th></tr></thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={`${e.targetId}-${i}`} className="cursor-pointer" onClick={() => setSelected(e.targetId)}>
                      <td className="mono whitespace-nowrap text-[9.5px]">{fmtDateTime(e.ts)}</td>
                      <td className="mono text-[10px] text-[var(--accent)]">{e.codename}</td>
                      <td className="text-[10.5px] text-ink-2">{e.label}</td>
                      <td className="mono text-[9.5px] text-ink-3">{fmtCoords(e.lat, e.lng)}</td>
                      <td className="text-[10.5px]">{e.city}</td>
                      <td className="mono text-[9.5px] text-ink-3">{s.missions.find((m) => m.id === e.missionId)?.code ?? 'AD-HOC'}</td>
                      <td className="max-w-[220px] truncate text-[10px] text-ink-3">Generated location fix in demonstration scenario.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <EmptyState icon={History} title="No events match" />}
            </div>
            <div className="flex items-center justify-between border-t border-line bg-[#0d151d] px-2.5 py-1.5">
              <span className="mono text-[9.5px] text-ink-3">{filtered.length} of {events.length} events</span>
              <StatusPill value="active" label="GENERATED" dot={false} />
            </div>
          </>
        ) : (
          <div className="max-h-[52vh] overflow-auto">
            <table className="data-table">
              <thead><tr><th>Target</th><th>City</th><th className="text-right">Trail points</th><th>First fix</th><th>Latest fix</th><th>Status</th></tr></thead>
              <tbody>
                {s.targets.map((t) => (
                  <tr key={t.id} className="cursor-pointer" onClick={() => setSelected(t.id)}>
                    <td className="mono text-[10px] text-[var(--accent)]">{t.codename}</td>
                    <td className="text-[10.5px]">{t.city}</td>
                    <td className="mono text-right text-[10px]">{t.trail.length}</td>
                    <td className="mono text-[9.5px] text-ink-3">{fmtCoords(t.trail[0]?.lat ?? 0, t.trail[0]?.lng ?? 0)}</td>
                    <td className="mono text-[9.5px] text-ink-3">{fmtCoords(t.position.lat, t.position.lng)}</td>
                    <td><StatusPill value={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Event Composition" icon={Filter} subtitle="Distribution of generated event labels">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {Array.from(new Set(events.map((e) => e.label))).map((label) => {
            const count = events.filter((e) => e.label === label).length
            return (
              <li key={label} className="flex items-center gap-2">
                <span className="w-36 shrink-0 truncate text-[10.5px] text-ink-2">{label}</span>
                <div className="h-1 flex-1 bg-[#16212b]">
                  <div className="h-full" style={{ width: `${(count / events.length) * 100}%`, background: PALETTE.cyan }} />
                </div>
                <span className="mono w-8 text-right text-[9.5px] text-ink-3">{count}</span>
              </li>
            )
          })}
        </ul>
      </Panel>

      <InlineAlert tone="amber" title="Generated record">
        Location events, coordinates and timestamps are synthetic. They do not describe any real movement, device or person.
      </InlineAlert>
    </Screen>
  )
}
