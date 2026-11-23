import { useMemo, useState } from 'react'
import { Activity, Download, Search, Filter, Trash2 } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Tabs, EmptyState, Select, InlineAlert } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'
import { NAV_GROUPS } from '@/config/nav'

export default function ActivityHistory() {
  const activity = useEngine((s) => s.activity)
  const bus = useEngine((s) => s.bus)
  const [tab, setTab] = useState<'activity' | 'bus'>('activity')
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('all')
  const [module, setModule] = useState('all')

  const filtered = useMemo(() => {
    let list = activity
    if (q) {
      const t = q.toLowerCase()
      list = list.filter((a) => `${a.action} ${a.actor} ${a.module} ${a.detail}`.toLowerCase().includes(t))
    }
    if (level !== 'all') list = list.filter((a) => a.level === level)
    if (module !== 'all') list = list.filter((a) => a.module === module)
    return list
  }, [activity, q, level, module])

  const filteredBus = useMemo(() => {
    if (!q) return bus
    const t = q.toLowerCase()
    return bus.filter((b) => `${b.topic} ${JSON.stringify(b.payload)}`.toLowerCase().includes(t))
  }, [bus, q])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMAND CENTER · AUDIT TRAIL"
        title="Activity History"
        subtitle="Every engine action, operator gesture and bus event, recorded locally."
        icon={Activity}
        meta={
          <>
            <span className="badge badge-cyan">{activity.length} activity entries</span>
            <span className="badge badge-blue">{bus.length} bus events</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadFile(`shadow-activity-${Date.now()}.csv`, toCSV(filtered.map(({ id, ts, module, actor, action, level }) => ({ id, ts, module, actor, action, level }))), 'text/csv')}
            >
              <Download size={11} /> Export CSV
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadFile(`shadow-bus-${Date.now()}.json`, JSON.stringify(bus, null, 2), 'application/json')}
            >
              <Download size={11} /> Export bus JSON
            </button>
          </>
        }
      />

      <Panel
        title={tab === 'activity' ? 'Activity Log' : 'Event Bus Trace'}
        icon={Filter}
        bodyClassName="p-0"
        actions={
          <Tabs
            size="sm"
            className="border-0"
            tabs={[
              { id: 'activity', label: 'Activity', count: activity.length },
              { id: 'bus', label: 'Event bus', count: bus.length },
            ]}
            value={tab}
            onChange={(v) => setTab(v as 'activity' | 'bus')}
          />
        }
      >
        <div className="flex flex-wrap items-end gap-2 border-b border-line p-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, actors, topics…" className="field pl-7" />
          </div>
          {tab === 'activity' && (
            <>
              <Select
                className="w-32"
                value={level}
                onChange={setLevel}
                options={[
                  { value: 'all', label: 'All levels' },
                  { value: 'info', label: 'Info' },
                  { value: 'success', label: 'Success' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
              <Select
                className="w-40"
                value={module}
                onChange={setModule}
                options={[{ value: 'all', label: 'All modules' }, ...NAV_GROUPS.map((g) => ({ value: g.id, label: g.label })), { value: 'system', label: 'System' }]}
              />
            </>
          )}
          <span className="mono ml-auto text-[10px] text-ink-3">
            {tab === 'activity' ? filtered.length : filteredBus.length} results
          </span>
        </div>

        {tab === 'activity' ? (
          <div className="max-h-[62vh] overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-24">Time</th>
                  <th className="w-20">Level</th>
                  <th className="w-24">Module</th>
                  <th className="w-24">Actor</th>
                  <th>Action</th>
                  <th className="w-40">Detail</th>
                  <th className="w-20">Age</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="mono whitespace-nowrap text-[10px]">{fmtDateTime(a.ts)}</td>
                    <td><StatusPill value={a.level === 'info' ? 'info' : a.level} /></td>
                    <td className="mono text-[10px] uppercase">{a.module}</td>
                    <td className="mono text-[10px] text-ink-3">{a.actor}</td>
                    <td className="text-ink">{a.action}</td>
                    <td className="truncate text-[10.5px] text-ink-3">{a.detail}</td>
                    <td className="mono text-[10px]">{relTime(a.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Trash2} title="No activity matched" message="Adjust the filters or generate new events from any module." />}
          </div>
        ) : (
          <div className="max-h-[62vh] overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-24">Time</th>
                  <th className="w-16">Severity</th>
                  <th className="w-64">Topic</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredBus.map((b) => (
                  <tr key={b.id}>
                    <td className="mono whitespace-nowrap text-[10px]">{fmtDateTime(b.ts)}</td>
                    <td>{b.severity ? <StatusPill value={b.severity} /> : <span className="mono text-[10px] text-ink-3">low</span>}</td>
                    <td className="mono text-[10.5px] text-[var(--accent)]">{b.topic}</td>
                    <td className={cn('truncate font-mono text-[10px] text-ink-3')}>{JSON.stringify(b.payload)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBus.length === 0 && (
              <EmptyState
                icon={Activity}
                title="No bus events yet"
                message="Run a mission, execute a transfer or toggle a camera to publish events onto the shared bus."
              />
            )}
          </div>
        )}
      </Panel>

      <InlineAlert tone="cyan" title="Local audit trail">
        This log lives in browser memory for the current session only. Exports happen entirely on your device.
      </InlineAlert>
    </Screen>
  )
}
