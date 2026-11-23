import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessagesSquare, Radio, Phone, Users, ArrowUpRight, Lock, Wifi, Signal,
  Send, PhoneCall, ShieldCheck, Hash, Megaphone, BarChart3,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, InlineAlert, Divider, KeyValue, Tag, Progress, Timestamp } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, pad, relTime } from '@/lib/utils'

export default function CommsOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const unread = s.channels.reduce((a, c) => a + c.unread, 0)
  const activeCalls = s.calls.filter((c) => c.status === 'active' || c.status === 'ringing')
  const online = s.operators.filter((o) => o.status === 'online')

  const traffic = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ t: `${pad(i)}:00`, msgs: 12 + Math.round(Math.abs(Math.sin(i / 2.4)) * 28), calls: 2 + Math.round(Math.abs(Math.cos(i / 3)) * 5) })),
    [],
  )

  const kindMix = useMemo(() => {
    const m = new Map<string, number>()
    s.channels.forEach((c) => m.set(c.kind, (m.get(c.kind) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.channels])

  const lastByChannel = useMemo(() => {
    const m = new Map<string, (typeof s.messages)[number]>()
    s.messages.forEach((msg) => m.set(msg.channelId, msg))
    return m
  }, [s.messages])

  const encryptedPct = Math.round((s.messages.filter((m) => m.encrypted).length / Math.max(1, s.messages.length)) * 100)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMUNICATIONS · OVERVIEW"
        title="Comms Centre"
        subtitle="Encrypted-style chat, direct calls and dispatch for the fictional operator network."
        icon={MessagesSquare}
        meta={
          <>
            <span className="badge badge-cyan">{s.channels.length} CHANNELS</span>
            <span className="badge badge-amber">{unread} UNREAD</span>
            <span className="badge badge-green">{online.length} ONLINE</span>
            <span className="badge badge-grey">{activeCalls.length} CALLS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/communications/calls')}><PhoneCall size={11} /> Calls</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/communications/dispatch')}><Megaphone size={11} /> Dispatch</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Messages" value={s.messages.length} icon={Send} accent="cyan" onClick={() => navigate('/communications/messages')} />
        <StatCard label="Unread" value={unread} icon={MessagesSquare} accent="amber" />
        <StatCard label="Operators online" value={online.length} icon={Users} accent="green" onClick={() => navigate('/communications/calls')} />
        <StatCard label="Encrypted" value={`${encryptedPct}%`} icon={Lock} accent="blue" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Traffic" icon={Signal} className="lg:col-span-2" subtitle="Messages and calls per hour (generated)">
          <AreaTrend data={traffic} keys={[{ key: 'msgs', color: PALETTE.cyan, label: 'Messages' }, { key: 'calls', color: PALETTE.blue, label: 'Calls' }]} height={190} />
          <ChartLegend items={[{ label: 'Messages', color: PALETTE.cyan }, { label: 'Calls', color: PALETTE.blue }]} />
        </Panel>
        <Panel title="Channel Mix" icon={Hash}>
          <Donut data={kindMix.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.blue, PALETTE.amber, PALETTE.green][i % 4] }))} height={170} centerLabel="CHANNELS" centerValue={String(s.channels.length)} />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
        <Panel title="Channels" icon={MessagesSquare} bodyClassName="p-0"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/communications/messages')}>Open chat <ArrowUpRight size={10} /></button>}
        >
          <ul className="max-h-[38vh] divide-y divide-line-soft overflow-y-auto">
            {s.channels.map((c) => {
              const last = lastByChannel.get(c.id)
              return (
                <li key={c.id} className={cn(c.unread > 0 && 'bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]')}>
                  <button type="button" onClick={() => navigate(`/communications/messages?c=${c.id}`)} className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left hover:bg-elevated">
                    <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border border-line', c.kind === 'dispatch' ? 'text-amber' : c.kind === 'broadcast' ? 'text-red' : 'text-[var(--accent)]')}>
                      {c.kind === 'dispatch' ? <Radio size={10} /> : c.kind === 'broadcast' ? <Megaphone size={10} /> : c.kind === 'direct' ? <Users size={10} /> : <Hash size={10} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[10.5px] text-ink">{c.name}</span>
                        <span className="badge badge-grey">{c.kind}</span>
                        {c.unread > 0 && <span className="badge badge-cyan">{c.unread}</span>}
                      </span>
                      <span className="block truncate text-[9.5px] text-ink-3">{last ? `${last.operatorId} · ${last.body}` : c.topic}</span>
                    </span>
                    <span className="mono shrink-0 text-[7.5px] text-ink-3">{last ? relTime(last.ts) : '—'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel title="Active Calls" icon={Phone} bodyClassName="p-0"
            actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/communications/calls')}>All <ArrowUpRight size={9} /></button>}
          >
            <ul className="divide-y divide-line-soft">
              {activeCalls.slice(0, 4).map((c) => {
                const op = s.operators.find((o) => o.id === c.operatorId)
                return (
                  <li key={c.id} className="flex items-center gap-2 px-2.5 py-1.5">
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-line text-[9px] text-ink-2">{op?.avatarSeed?.[0]?.toUpperCase() ?? '?'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] text-ink">{op?.callsign ?? c.operatorId}</span>
                      <span className="mono block text-[8px] text-ink-3">{c.direction} · {c.channel}</span>
                    </span>
                    <StatusPill value={c.status} dot={false} />
                  </li>
                )
              })}
              {activeCalls.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No active calls.</li>}
            </ul>
          </Panel>

          <Panel title="Operators" icon={Users} bodyClassName="p-0">
            <ul className="max-h-[170px] divide-y divide-line-soft overflow-y-auto">
              {s.operators.map((o) => (
                <li key={o.id} className="flex items-center gap-2 px-2.5 py-1">
                  <span className={cn('h-1.5 w-1.5 rounded-full', o.status === 'online' ? 'bg-green' : o.status === 'away' ? 'bg-amber' : 'bg-ink-3')} />
                  <span className="min-w-0 flex-1 truncate text-[10px] text-ink-2">{o.callsign}</span>
                  <span className="mono text-[8px] text-ink-3">{o.role}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Delivery Health" icon={Wifi}>
          {(['sending', 'sent', 'delivered', 'read'] as const).map((d) => {
            const n = s.messages.filter((m) => m.delivery === d).length
            const pct = (n / Math.max(1, s.messages.length)) * 100
            return (
              <div key={d} className="mb-1.5">
                <div className="flex justify-between"><span className="text-[10px] capitalize text-ink-2">{d}</span><span className="mono text-[8.5px] text-ink-3">{n}</span></div>
                <Progress value={pct} height={2} />
              </div>
            )
          })}
          <Divider />
          <KeyValue items={[{ k: 'Encrypted', v: `${encryptedPct}%` }, { k: 'With attachments', v: String(s.messages.filter((m) => m.attachments?.length).length) }]} />
        </Panel>

        <Panel title="Message Volume by Channel" icon={BarChart3}>
          <BarsTrend
            horizontal
            data={s.channels.slice(0, 6).map((c) => ({ name: c.name.slice(0, 14), v: s.messages.filter((m) => m.channelId === c.id).length }))}
            keys={[{ key: 'v', color: PALETTE.cyan, label: 'Messages' }]}
            height={180}
            xKey="name"
          />
        </Panel>

        <Panel title="Network Status" icon={ShieldCheck}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Relay</span><StatusPill value="online" label="NOMINAL" /></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">E2E layer</span><StatusPill value="active" label="SIMULATED" /></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Delay</span><span className="mono text-[9px] text-ink-3">{12 + (s.tick % 9)} ms</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Last packet</span><Timestamp ts={s.messages[s.messages.length - 1]?.ts ?? new Date().toISOString()} mode="time" /></div>
          </div>
          <Divider />
          <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL</Tag><Tag tone="#f5b942">FICTIONAL</Tag><Tag tone="#38db91">NO NETWORK</Tag></div>
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Simulated communications">
        Channels, operators, calls and messages are generated. Nothing is transmitted, dialled or delivered to a real person.
      </InlineAlert>
    </Screen>
  )
}
