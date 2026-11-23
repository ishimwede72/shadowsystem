import { useMemo, useState } from 'react'
import {
  Megaphone, Radio, Send, Users, ShieldAlert, Download, Lock, Unlock,
  CheckCheck, Sparkles, Layers, Siren, Bell, MapPin, BarChart3,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, InlineAlert, Divider, KeyValue, Toggle, EmptyState, Avatar, Modal, Progress } from '@/components/ui'
import { BarsTrend, Donut, PALETTE, AreaTrend, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtDateTime, pad, relTime, toCSV, downloadFile } from '@/lib/utils'

const TEMPLATES = [
  { id: 'drill', label: 'Drill notice', body: 'SIMULATED DRILL: All operators — this is a fictional exercise. Acknowledge receipt when able.' },
  { id: 'recall', label: 'Recall', body: 'SIMULATED RECALL: Operators on shift, report to the comms console for a coordination check-in.' },
  { id: 'commhold', label: 'Comms hold', body: 'SIMULATED COMMS HOLD: Keep channels clear for priority traffic for the next ten minutes.' },
  { id: 'standdown', label: 'Stand down', body: 'SIMULATED STAND DOWN: The exercise is complete. Resume normal simulated operations.' },
  { id: 'custom', label: 'Custom', body: '' },
]

interface DispatchLog {
  id: string
  body: string
  scope: string
  channelId: string
  encryption: boolean
  priority: 'routine' | 'priority' | 'flash'
  ts: string
  recipients: number
}

export default function Dispatch() {
  const s = useEngine()
  const [scope, setScope] = useState('all')
  const [template, setTemplate] = useState('drill')
  const [body, setBody] = useState(TEMPLATES[0].body)
  const [priority, setPriority] = useState<'routine' | 'priority' | 'flash'>('priority')
  const [encrypt, setEncrypt] = useState(true)
  const [targets, setTargets] = useState<string[]>([])
  const [logs, setLogs] = useState<DispatchLog[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const channels = s.channels.filter((c) => c.kind === 'dispatch' || c.kind === 'broadcast')
  const [channelId, setChannelId] = useState(channels[0]?.id ?? s.channels[0]?.id ?? '')

  const pool = useMemo(() => {
    if (scope === 'all') return s.operators
    if (scope === 'online') return s.operators.filter((o) => o.status === 'online' || o.status === 'field')
    if (scope === 'unit') return s.operators.filter((o) => targets.length === 0 || targets.includes(o.unit))
    return s.operators
  }, [s.operators, scope, targets])

  const units = Array.from(new Set(s.operators.map((o) => o.unit)))

  const applyTemplate = (id: string) => {
    setTemplate(id)
    const t = TEMPLATES.find((x) => x.id === id)
    if (t) setBody(t.body)
  }

  const send = () => {
    if (!body.trim() || !channelId) return
    s.sendMessage(channelId, body.trim(), encrypt)
    s.notify({
      type: priority === 'flash' ? 'emergency' : 'success',
      title: priority === 'flash' ? 'FLASH DISPATCH (simulated)' : 'Dispatch sent (simulated)',
      body: `${body.slice(0, 70)}${body.length > 70 ? '…' : ''}`,
      severity: priority === 'flash' ? 'critical' : 'low',
      module: 'comms',
      href: '/communications/dispatch',
    })
    s.emit('COMMS.DISPATCH_SENT', { channelId, priority, recipients: pool.length })
    setLogs((l) => [{
      id: `DSP-${pad(l.length + 1)}`,
      body,
      scope,
      channelId,
      encryption: encrypt,
      priority,
      ts: new Date().toISOString(),
      recipients: pool.length,
    }, ...l])
    setConfirmOpen(false)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMUNICATIONS · DISPATCH"
        title="Dispatch Console"
        subtitle="Compose a simulated broadcast to the operator network. Everything stays in local state."
        icon={Megaphone}
        meta={
          <>
            <span className="badge badge-cyan">{pool.length} RECIPIENTS</span>
            <span className="badge badge-amber">{priority.toUpperCase()}</span>
            <span className="badge badge-grey">{logs.length} SENT</span>
            <span className="badge badge-green">{channels.length} DISPATCH CHANNELS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-dispatch.csv', toCSV(logs.map(({ id, body, scope, priority, recipients, ts }) => ({ id, body, scope, priority, recipients, ts }))), 'text/csv')} disabled={!logs.length}><Download size={11} /> Export log</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setConfirmOpen(true)} disabled={!body.trim()}><Send size={11} /> Send dispatch</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Recipients" value={pool.length} icon={Users} accent="cyan" />
        <StatCard label="Sent" value={logs.length} icon={Send} accent="green" />
        <StatCard label="Flash" value={logs.filter((l) => l.priority === 'flash').length} icon={Siren} accent="red" />
        <StatCard label="Encrypted" value={`${logs.length ? Math.round((logs.filter((l) => l.encryption).length / logs.length) * 100) : 100}%`} icon={Lock} accent="blue" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Compose" icon={Megaphone}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select label="Template" value={template} onChange={applyTemplate} options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} />
            <Select label="Channel" value={channelId} onChange={setChannelId} options={(channels.length ? channels : s.channels).map((c) => ({ value: c.id, label: `${c.name} · ${c.kind}` }))} />
          </div>
          <div className="mt-2">
            <label className="field-label" htmlFor="dispatch-body">Message</label>
            <textarea id="dispatch-body" value={body} onChange={(e) => setBody(e.target.value)} className="field min-h-[110px] text-[11px]" placeholder="Write a simulated dispatch…" />
            <div className="mt-1 flex items-center justify-between font-mono text-[8px] text-ink-3">
              <span>BROADCAST · FICTIONAL CONTENT ONLY</span>
              <span>{body.length} chars</span>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Select label="Scope" value={scope} onChange={setScope} options={[{ value: 'all', label: 'All operators' }, { value: 'online', label: 'On duty only' }, { value: 'unit', label: 'By unit' }]} />
            <Select label="Priority" value={priority} onChange={(v) => setPriority(v as typeof priority)} options={[{ value: 'routine', label: 'Routine' }, { value: 'priority', label: 'Priority' }, { value: 'flash', label: 'Flash' }]} />
            <div className="flex items-end"><div className="flex w-full items-center justify-between border border-line bg-bg px-2 py-1.5"><span className="text-[10px] text-ink-2">Encrypt tag</span><Toggle checked={encrypt} onChange={setEncrypt} label="" /></div></div>
          </div>

          {scope === 'unit' && (
            <div className="mt-2">
              <p className="field-label">Units</p>
              <div className="flex flex-wrap gap-1">
                {units.map((u) => (
                  <button key={u} type="button" onClick={() => setTargets((t) => (t.includes(u) ? t.filter((x) => x !== u) : [...t, u]))}
                    className={cn('btn btn-sm', targets.includes(u) && 'btn-primary')}
                  >{u}</button>
                ))}
                {targets.length === 0 && <span className="font-mono text-[8.5px] text-ink-3">No unit selected = all units.</span>}
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill value={priority === 'flash' ? 'escalated' : priority === 'priority' ? 'monitoring' : 'active'} label={priority.toUpperCase()} />
            <span className="mono text-[8.5px] text-ink-3">{pool.length} recipients · {encrypt ? 'ENCRYPTED TAG' : 'PLAIN'}</span>
            <button type="button" className="btn btn-sm ml-auto" onClick={() => setBody('')}><Sparkles size={10} /> Clear</button>
          </div>

          <Divider label="PREVIEW" />
          <div className="border border-line bg-bg p-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <Megaphone size={10} className="text-[var(--accent)]" />
              <span className="text-[9px] uppercase tracking-wider text-ink-3">DISPATCH · {priority.toUpperCase()}</span>
              {encrypt ? <Lock size={8} className="text-green" /> : <Unlock size={8} className="text-amber" />}
            </div>
            <p className="whitespace-pre-wrap text-[10.5px] leading-relaxed text-ink-2">{body || 'Message preview appears here…'}</p>
            <p className="mt-1.5 font-mono text-[7.5px] text-ink-3">SIMULATED · NO RECIPIENT WILL BE CONTACTED</p>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Recipients" icon={Users} bodyClassName="p-2"
            actions={<span className="mono text-[8.5px] text-ink-3">{pool.length} of {s.operators.length}</span>}
          >
            <ul className="max-h-[240px] space-y-0.5 overflow-y-auto">
              {pool.map((o) => (
                <li key={o.id} className="flex items-center gap-1.5 border-b border-line-soft/50 px-1 py-0.5 last:border-0">
                  <Avatar seed={o.avatarSeed} size={16} />
                  <span className="min-w-0 flex-1 truncate text-[10px] text-ink-2">{o.callsign}</span>
                  <span className="mono text-[8px] text-ink-3">{o.unit}</span>
                  <span className={cn('h-1 w-1 rounded-full', o.status === 'online' ? 'bg-green' : o.status === 'field' ? 'bg-blue' : 'bg-ink-3')} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Coverage" icon={MapPin}>
            <Donut
              data={units.map((u, i) => ({ name: u, value: pool.filter((o) => o.unit === u).length, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
              height={160}
              centerLabel="UNITS"
              centerValue={String(new Set(pool.map((o) => o.unit)).size)}
            />
          </Panel>

          <Panel title="Priority Rules" icon={ShieldAlert}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li><span className="mono text-green">ROUTINE</span> — logged silently.</li>
              <li><span className="mono text-amber">PRIORITY</span> — raises a standard alert.</li>
              <li><span className="mono text-red">FLASH</span> — raises a critical alert.</li>
            </ul>
            <Divider />
            <KeyValue items={[{ k: 'Session', v: s.sessionId ?? 'local' }, { k: 'Operator', v: s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? '—' }]} />
          </Panel>
        </div>
      </div>

      <Panel title="Dispatch Log" icon={Layers} bodyClassName="p-0"
        actions={<span className="mono text-[8.5px] text-ink-3">{logs.length} this session</span>}
      >
        <table className="data-table">
          <thead><tr><th>ID</th><th>Sent</th><th>Priority</th><th>Scope</th><th>Recipients</th><th>Channel</th><th>Message</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="mono text-[8.5px] text-[var(--accent)]">{l.id}</td>
                <td className="mono whitespace-nowrap text-[8px] text-ink-3">{fmtDateTime(l.ts)}</td>
                <td><StatusPill value={l.priority === 'flash' ? 'escalated' : l.priority === 'priority' ? 'monitoring' : 'active'} label={l.priority.toUpperCase()} dot={false} /></td>
                <td className="text-[9.5px] text-ink-3">{l.scope}</td>
                <td className="mono text-[9px] text-ink-3">{l.recipients}</td>
                <td className="mono text-[8.5px] text-ink-3">{s.channels.find((c) => c.id === l.channelId)?.name ?? l.channelId}</td>
                <td className="max-w-[320px] truncate text-[9.5px] text-ink-3">{l.body}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={7}><EmptyState icon={Megaphone} title="No dispatches yet" message="Compose a message and send it to see the log." /></td></tr>}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Dispatch Volume by Priority" icon={BarChart3}>
          <BarsTrend
            data={['routine', 'priority', 'flash'].map((p) => ({ p, n: logs.filter((l) => l.priority === p).length }))}
            keys={[{ key: 'n', color: PALETTE.cyan, label: 'Dispatches' }]}
            height={170}
            xKey="p"
          />
          <ChartLegend items={[{ label: 'Dispatches sent', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Acknowledgements" icon={CheckCheck}>
          <div className="space-y-1.5">
            {pool.slice(0, 6).map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                <span className="w-16 truncate text-[9.5px] text-ink-3">{o.callsign}</span>
                <Progress value={logs.length === 0 ? 0 : Math.min(100, 30 + ((i * 13 + s.tick) % 70))} height={3} className="flex-1" color={PALETTE.green} />
                <span className="mono w-8 text-right text-[8px] text-ink-3">{logs.length === 0 ? '—' : `${Math.min(100, 30 + ((i * 13 + s.tick) % 70))}%`}</span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[8px] leading-relaxed text-ink-3">Acknowledgement percentages are decorative placeholders.</p>
        </Panel>
      </div>

      <Panel title="Channel Activity" icon={Radio}>
        <AreaTrend
          data={Array.from({ length: 14 }, (_, i) => ({ t: `${pad(i * 2)}:00`, d: 1 + Math.round(Math.abs(Math.sin(i / 2.2)) * 6) }))}
          keys={[{ key: 'd', color: PALETTE.amber, label: 'Dispatches' }]}
          height={160}
        />
        <ChartLegend items={[{ label: 'Dispatch volume (generated)', color: PALETTE.amber }]} />
      </Panel>

      <InlineAlert tone="amber" title="Simulated broadcast">
        Dispatches appear in the local chat channel and alert feed only. No email, SMS, pager, radio or push notification is
        delivered to any real recipient.
      </InlineAlert>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Dispatch" subtitle={`${pool.length} simulated recipients · ${priority}`} icon={Megaphone}
        footer={<>
          <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
          <button type="button" className={cn('btn', priority === 'flash' ? 'btn-danger' : 'btn-primary')} onClick={send}><Send size={11} /> {priority === 'flash' ? 'Send flash dispatch' : 'Send dispatch'}</button>
        </>}
      >
        <div className="space-y-2">
          <div className="border border-line bg-bg p-2">
            <p className="whitespace-pre-wrap text-[10.5px] leading-relaxed text-ink-2">{body}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <KeyValue cols={1} items={[{ k: 'Scope', v: scope.toUpperCase() }, { k: 'Recipients', v: String(pool.length) }]} />
            <KeyValue cols={1} items={[{ k: 'Priority', v: priority.toUpperCase() }, { k: 'Encrypted tag', v: encrypt ? 'YES' : 'NO' }]} />
          </div>
          <p className="font-mono text-[8.5px] leading-relaxed text-ink-3"><Bell size={8} className="mr-1 inline" />Sending raises a local alert and event-bus message. {relTime(new Date().toISOString())}</p>
        </div>
      </Modal>

    </Screen>
  )
}
