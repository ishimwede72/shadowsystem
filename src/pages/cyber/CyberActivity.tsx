import { useMemo, useState } from 'react'
import { Activity, Download, Search, ShieldCheck, Server } from 'lucide-react'
import { Panel, PageHeader, Screen, SeverityPill, StatusPill, Select, Tabs, EmptyState, InlineAlert, StatCard, KeyValue } from '@/components/ui'
import { AreaTrend, PALETTE, Donut } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, fmtTime, toCSV } from '@/lib/utils'

export default function CyberActivity() {
  const cyberEvents = useEngine((s) => s.cyberEvents)
  const allActivity = useEngine((s) => s.activity)
  const activity = useMemo(() => allActivity.filter((a) => a.module === 'cyber'), [allActivity])
  const bus = useEngine((s) => s.bus)
  const [q, setQ] = useState('')
  const [sev, setSev] = useState('all')
  const [tab, setTab] = useState('events')

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return cyberEvents.filter((e) => {
      if (t && !`${e.type} ${e.source} ${e.target} ${e.detail}`.toLowerCase().includes(t)) return false
      if (sev !== 'all' && e.severity !== sev) return false
      return true
    })
  }, [cyberEvents, q, sev])

  const cyberBus = useMemo(() => bus.filter((b) => b.topic.startsWith('CYBER')), [bus])

  const timeline = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        t: `${String(i).padStart(2, '0')}h`,
        events: Math.round(3 + Math.sin(i / 2.1) * 4 + (i % 4)),
        blocked: Math.round(1 + Math.cos(i / 2.6) * 3 + (i % 3)),
      })),
    [],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · ACTIVITY"
        title="Cyber Activity Stream"
        subtitle="Every simulated security event, operator action and bus message from the cyber modules."
        icon={Activity}
        meta={
          <>
            <span className="badge badge-grey">{cyberEvents.length} EVENTS</span>
            <span className="badge badge-cyan">{activity.length} OPERATOR ACTIONS</span>
            <span className="badge badge-blue">{cyberBus.length} BUS MESSAGES</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadFile(`shadow-cyber-events-${Date.now()}.csv`, toCSV(filtered.map(({ id, type, severity, source, target, detail, timestamp, blocked }) => ({ id, type, severity, source, target, detail, timestamp, blocked }))), 'text/csv')}
          >
            <Download size={11} /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total events" value={cyberEvents.length} icon={Activity} accent="cyan" />
        <StatCard label="Blocked" value={cyberEvents.filter((e) => e.blocked).length} icon={ShieldCheck} accent="green" />
        <StatCard label="Passed" value={cyberEvents.filter((e) => !e.blocked).length} icon={Server} accent="amber" />
        <StatCard label="Critical" value={cyberEvents.filter((e) => e.severity === 'critical').length} icon={Activity} accent="red" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Event Timeline" icon={Activity} className="lg:col-span-2">
          <AreaTrend
            data={timeline}
            keys={[{ key: 'events', color: PALETTE.cyan, label: 'Events' }, { key: 'blocked', color: PALETTE.red, label: 'Blocked' }]}
            height={180}
          />
        </Panel>
        <Panel title="Severity Mix" icon={ShieldCheck}>
          <Donut
            data={[
              { name: 'Critical', value: cyberEvents.filter((e) => e.severity === 'critical').length, color: PALETTE.red },
              { name: 'Elevated', value: cyberEvents.filter((e) => e.severity === 'elevated').length, color: PALETTE.amber },
              { name: 'Low', value: cyberEvents.filter((e) => e.severity === 'low').length, color: PALETTE.green },
            ]}
            height={170}
          />
        </Panel>
      </div>

      <Panel title="Activity Records" icon={Activity} bodyClassName="p-0"
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Tabs className="border-0" size="sm" value={tab} onChange={setTab} tabs={[
              { id: 'events', label: 'Events', count: filtered.length },
              { id: 'operator', label: 'Operator', count: activity.length },
              { id: 'bus', label: 'Bus', count: cyberBus.length },
            ]} />
          </div>
        }
      >
        {tab !== 'bus' && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-2.5 py-2">
            <div className="relative min-w-[180px] flex-1">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="field pl-7" />
            </div>
            <Select className="w-32" value={sev} onChange={setSev} options={[{ value: 'all', label: 'All severity' }, { value: 'critical', label: 'Critical' }, { value: 'elevated', label: 'Elevated' }, { value: 'low', label: 'Low' }]} />
          </div>
        )}

        {tab === 'events' && (
          <div className="max-h-[55vh] overflow-auto">
            <table className="data-table min-w-[760px]">
              <thead><tr><th>Timestamp</th><th>Type</th><th>Source</th><th>Target</th><th>Severity</th><th>Result</th></tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="mono whitespace-nowrap text-[9.5px]">{fmtDateTime(e.timestamp)}</td>
                    <td className="text-[10.5px] text-ink">{e.type}</td>
                    <td className="mono text-[9.5px] text-ink-3">{e.source}</td>
                    <td className="mono text-[9.5px] text-ink-3">{e.target}</td>
                    <td><SeverityPill value={e.severity} /></td>
                    <td><StatusPill value={e.blocked ? 'active' : 'pending'} label={e.blocked ? 'BLOCKED' : 'PASSED'} dot={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Activity} title="No matching events" />}
          </div>
        )}

        {tab === 'operator' && (
          <div className="max-h-[55vh] overflow-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td className="mono whitespace-nowrap text-[9.5px]">{fmtTime(a.ts)}</td>
                    <td className="mono text-[9.5px] text-ink-3">{a.actor}</td>
                    <td className="text-[10.5px] text-ink">{a.action}</td>
                    <td className="text-[10px] text-ink-3">{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activity.length === 0 && <EmptyState icon={Server} title="No operator actions yet" message="Open the terminal or firewall to generate cyber activity." />}
          </div>
        )}

        {tab === 'bus' && (
          <div className="max-h-[55vh] overflow-auto p-2">
            {cyberBus.length === 0 ? (
              <EmptyState icon={Activity} title="No cyber bus messages" message="Trigger a firewall toggle or access sequence to publish events." />
            ) : (
              <ul className="space-y-1">
                {cyberBus.map((b) => (
                  <li key={b.id} className="border border-line-soft px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[10px] text-[var(--accent)]">{b.topic}</span>
                      <span className="mono text-[9px] text-ink-3">{fmtTime(b.ts)}</span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-ink-3">{JSON.stringify(b.payload)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Event Categories" icon={Activity}>
          <ul className="space-y-1.5">
            {Array.from(new Set(cyberEvents.map((e) => e.type))).map((type) => {
              const count = cyberEvents.filter((e) => e.type === type).length
              return (
                <li key={type} className="flex items-center justify-between border-b border-line-soft/50 pb-1">
                  <span className="truncate text-[10.5px] text-ink-2">{type}</span>
                  <span className="mono text-[10px] text-ink-3">{count}</span>
                </li>
              )
            })}
          </ul>
        </Panel>
        <Panel title="Stream Vitals" icon={ShieldCheck}>
          <KeyValue
            items={[
              { k: 'Blocked ratio', v: `${((cyberEvents.filter((e) => e.blocked).length / Math.max(1, cyberEvents.length)) * 100).toFixed(1)}%` },
              { k: 'Unique sources', v: String(new Set(cyberEvents.map((e) => e.source)).size) },
              { k: 'Unique targets', v: String(new Set(cyberEvents.map((e) => e.target)).size) },
              { k: 'Latest event', v: cyberEvents[0] ? fmtTime(cyberEvents[0].timestamp) : '—' },
            ]}
          />
          <InlineAlert tone="cyan" title="Generated stream">
            All events originate from the local simulator. Nothing was observed, captured or detected on a real network.
          </InlineAlert>
        </Panel>
      </div>
    </Screen>
  )
}
