import { useMemo, useState } from 'react'
import {
  Users, Search, Download, ShieldCheck, Signal, MapPin, Clock, Filter,
  UserCheck, UserX, Radio, BadgeCheck, Send,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, Divider, KeyValue, Tag, Avatar, Modal, Progress } from '@/components/ui'
import { Donut, PALETTE, RadarMetric, BarsTrend, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'

const CLEARANCE_COLOR: Record<string, string> = { C1: '#65788b', C2: '#377eff', C3: '#28d8ea', C4: '#f5b942', OMEGA: '#f14e61' }

export default function Operators() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [clearance, setClearance] = useState('all')
  const [selected, setSelected] = useState<string | null>(s.operators[0]?.id ?? null)
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgBody, setMsgBody] = useState('')

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.operators.filter((o) => {
      if (t && !`${o.callsign} ${o.displayName} ${o.role} ${o.unit}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && o.status !== status) return false
      if (clearance !== 'all' && o.clearance !== clearance) return false
      return true
    })
  }, [s.operators, q, status, clearance])

  const op = s.operators.find((o) => o.id === selected)

  const byStatus = useMemo(() => {
    const m = new Map<string, number>()
    s.operators.forEach((o) => m.set(o.status, (m.get(o.status) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.operators])

  const byUnit = useMemo(() => {
    const m = new Map<string, number>()
    s.operators.forEach((o) => m.set(o.unit, (m.get(o.unit) ?? 0) + 1))
    return Array.from(m.entries()).map(([unit, n]) => ({ unit, n })).sort((a, b) => b.n - a.n)
  }, [s.operators])

  const assume = (id: string) => {
    s.setOperator(id)
    s.notify({ type: 'success', title: 'Operator identity assumed', body: `${s.operators.find((o) => o.id === id)?.callsign} is now the active operator`, severity: 'low', module: 'comms' })
  }

  const direct = () => {
    if (!op) return
    const ch = s.channels.find((c) => c.kind === 'direct' && c.members.includes(op.id))
    s.sendMessage(ch?.id ?? s.channels[0]?.id ?? '', msgBody, true)
    setMsgOpen(false)
    setMsgBody('')
    s.notify({ type: 'success', title: 'Message queued', body: `Direct message to ${op.callsign}`, severity: 'low', module: 'comms' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMUNICATIONS · OPERATORS"
        title="Operator Roster"
        subtitle="Directory of simulated operators, roles, clearances and presence across the network."
        icon={Users}
        meta={
          <>
            <span className="badge badge-cyan">{s.operators.length} OPERATORS</span>
            <span className="badge badge-green">{s.operators.filter((o) => o.status === 'online').length} ONLINE</span>
            <span className="badge badge-amber">{new Set(s.operators.map((o) => o.unit)).size} UNITS</span>
            <span className="badge badge-grey">SIMULATED</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-operators.csv', toCSV(s.operators.map(({ id, callsign, displayName, role, clearance, status, unit, lastSeen }) => ({ id, callsign, displayName, role, clearance, status, unit, lastSeen }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setMsgOpen(true)} disabled={!op}><Send size={11} /> Message operator</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Roster" value={s.operators.length} icon={Users} accent="cyan" />
        <StatCard label="Online" value={s.operators.filter((o) => o.status === 'online').length} icon={UserCheck} accent="green" />
        <StatCard label="Field" value={s.operators.filter((o) => o.status === 'field').length} icon={MapPin} accent="blue" />
        <StatCard label="Away / offline" value={s.operators.filter((o) => o.status === 'away' || o.status === 'offline').length} icon={UserX} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Filters" icon={Filter}>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <p className="label-xs mb-1">SEARCH</p>
                <div className="relative">
                  <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Callsign, name, role or unit…" className="field pl-7" />
                </div>
              </div>
              <div><p className="label-xs mb-1">STATUS</p><Select className="w-28" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any' }, { value: 'online', label: 'Online' }, { value: 'field', label: 'Field' }, { value: 'away', label: 'Away' }, { value: 'offline', label: 'Offline' }]} /></div>
              <div><p className="label-xs mb-1">CLEARANCE</p><Select className="w-32" value={clearance} onChange={setClearance} options={[{ value: 'all', label: 'Any' }, { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }, { value: 'C3', label: 'C3' }, { value: 'C4', label: 'C4' }, { value: 'OMEGA', label: 'OMEGA' }]} /></div>
            </div>
          </Panel>

          <Panel title="Roster" icon={Users} bodyClassName="p-0"
            actions={<span className="mono text-[8.5px] text-ink-3">{filtered.length} shown</span>}
          >
            <div className="max-h-[46vh] overflow-auto">
              <table className="data-table min-w-[720px]">
                <thead><tr><th>Operator</th><th>Callsign</th><th>Role</th><th>Unit</th><th>Clearance</th><th>Status</th><th>Last seen</th></tr></thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="cursor-pointer" data-selected={selected === o.id} onClick={() => setSelected(o.id)}>
                      <td>
                        <span className="flex items-center gap-1.5">
                          <Avatar seed={o.avatarSeed} size={18} />
                          <span className="text-[10px] text-ink">{o.displayName}</span>
                        </span>
                      </td>
                      <td className="mono text-[9px] text-[var(--accent)]">{o.callsign}</td>
                      <td className="text-[9.5px] text-ink-3">{o.role}</td>
                      <td className="text-[9.5px] text-ink-3">{o.unit}</td>
                      <td><span className="badge" style={{ color: CLEARANCE_COLOR[o.clearance], borderColor: CLEARANCE_COLOR[o.clearance] + '55' }}>{o.clearance}</span></td>
                      <td><StatusPill value={o.status} dot={false} /></td>
                      <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(o.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <EmptyState icon={Users} title="No operators match" />}
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Presence Mix" icon={Signal}>
              <Donut data={byStatus.map(([name, value], i) => ({ name, value, color: [PALETTE.green, PALETTE.blue, PALETTE.amber, '#65788b'][i % 4] }))} height={160} centerLabel="OPERATORS" centerValue={String(s.operators.length)} />
            </Panel>
            <Panel title="Unit Strength" icon={ShieldCheck}>
              <BarsTrend horizontal data={byUnit} keys={[{ key: 'n', color: PALETTE.cyan, label: 'Operators' }]} height={170} xKey="unit" />
              <ChartLegend items={[{ label: 'Operators per unit', color: PALETTE.cyan }]} />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {op ? (
            <Panel title={op.callsign} subtitle={op.displayName} icon={BadgeCheck} actions={<StatusPill value={op.status} />}>
              <div className="flex items-center gap-2 border-b border-line-soft pb-2">
                <Avatar seed={op.avatarSeed} size={40} status={op.status === 'online' ? 'online' : 'offline'} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-ink">{op.displayName}</p>
                  <p className="mono text-[8.5px] text-ink-3">{op.role} · {op.unit}</p>
                  <p className="mono text-[8px] text-ink-3">{op.email}</p>
                </div>
              </div>
              <KeyValue
                items={[
                  { k: 'Callsign', v: op.callsign },
                  { k: 'Clearance', v: op.clearance },
                  { k: 'Status', v: op.status.toUpperCase() },
                  { k: 'Unit', v: op.unit },
                  { k: 'Last seen', v: relTime(op.lastSeen) },
                ]}
              />
              <Divider label="ACCESS" />
              <div className="flex items-center gap-1.5">
                <Progress value={op.clearance === 'OMEGA' ? 100 : op.clearance === 'C4' ? 84 : op.clearance === 'C3' ? 68 : op.clearance === 'C2' ? 50 : 30} height={4} className="flex-1" color={CLEARANCE_COLOR[op.clearance]} />
                <span className="mono text-[8.5px] text-ink-3">{op.clearance}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button type="button" className="btn btn-sm" onClick={() => setMsgOpen(true)}><Send size={10} /> Message</button>
                <button type="button" className="btn btn-sm" onClick={() => assume(op.id)} disabled={s.currentOperatorId === op.id}>
                  <Radio size={10} /> {s.currentOperatorId === op.id ? 'Active' : 'Assume'}
                </button>
              </div>
            </Panel>
          ) : <Panel title="Operator"><EmptyState icon={Users} title="Select an operator" /></Panel>}

          <Panel title="Coverage" icon={MapPin}>
            <RadarMetric
              data={['C1', 'C2', 'C3', 'C4', 'OMEGA'].map((c) => ({ axis: c, value: s.operators.filter((o) => o.clearance === c).length * 20 }))}
              height={170}
            />
            <p className="text-center font-mono text-[8px] text-ink-3">Scored by operator count per clearance tier</p>
          </Panel>

          <Panel title="Shift Window" icon={Clock}>
            <KeyValue
              items={[
                { k: 'Now', v: fmtDateTime(new Date().toISOString()) },
                { k: 'On duty', v: String(s.operators.filter((o) => o.status === 'online' || o.status === 'field').length) },
                { k: 'Total', v: String(s.operators.length) },
              ]}
            />
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">DIRECTORY</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
          </Panel>
        </div>
      </div>

      <Panel title="Units" icon={ShieldCheck} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Unit</th><th>Operators</th><th>Online</th><th>Highest clearance</th><th>Lead</th></tr></thead>
          <tbody>
            {byUnit.map(({ unit, n }) => {
              const list = s.operators.filter((o) => o.unit === unit)
              const order = ['C1', 'C2', 'C3', 'C4', 'OMEGA']
              const top = [...list].sort((a, b) => order.indexOf(b.clearance) - order.indexOf(a.clearance))[0]
              return (
                <tr key={unit}>
                  <td className="text-[10px] text-ink">{unit}</td>
                  <td className="mono text-[9.5px] text-ink-3">{n}</td>
                  <td className="mono text-[9.5px] text-green">{list.filter((o) => o.status === 'online').length}</td>
                  <td><span className="badge" style={{ color: CLEARANCE_COLOR[top?.clearance ?? 'C1'] }}>{top?.clearance ?? '—'}</span></td>
                  <td className="text-[9.5px] text-ink-3">{top?.callsign ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <InlineAlert tone="cyan" title="Fictional personnel">
        Every operator, callsign and role is invented for the demonstration. No real individual or organisation is represented.
      </InlineAlert>

      <Modal open={msgOpen} onClose={() => setMsgOpen(false)} title="Direct Message" subtitle={op ? `${op.callsign} · ${op.displayName}` : ''} icon={Send}
        footer={<>
          <button type="button" className="btn" onClick={() => setMsgOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={direct} disabled={!msgBody.trim()}><Send size={11} /> Send</button>
        </>}
      >
        <div className="space-y-2">
          <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} className="field min-h-[90px] text-[11px]" placeholder="Write a simulated message…" />
          <div className="flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><ShieldCheck size={9} /> Delivered to the local chat channel only. No network call.</div>
        </div>
      </Modal>

    </Screen>
  )
}
