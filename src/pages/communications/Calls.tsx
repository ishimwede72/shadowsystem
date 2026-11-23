import { useEffect, useMemo, useState } from 'react'
import {
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Mic, MicOff,
  Volume2, VolumeX, Pause, Play, Download, Filter, Radio, Clock, Users, Signal,
  ShieldCheck, Circle, BarChart3,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, Divider, KeyValue, Tag, Avatar, Modal, Toggle, Progress } from '@/components/ui'
import { Donut, PALETTE, AreaTrend, ChartLegend, RadialGauge } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { audio } from '@/services/audio'
import { cn, downloadFile, pad, relTime, toCSV } from '@/lib/utils'

export default function Calls() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sel, setSel] = useState<string | null>(s.calls[0]?.id ?? null)
  const [dialOpen, setDialOpen] = useState(false)
  const [target, setTarget] = useState(s.operators[0]?.id ?? '')
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(true)
  const [hold, setHold] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const active = s.calls.find((c) => c.id === sel)
  const live = s.calls.filter((c) => c.status === 'active')

  useEffect(() => {
    if (active?.status !== 'active') return
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(t)
  }, [active?.status])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.calls.filter((c) => {
      const op = s.operators.find((o) => o.id === c.operatorId)
      if (t && !`${op?.callsign ?? ''} ${c.channel} ${c.id}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && c.status !== status) return false
      return true
    })
  }, [s.calls, s.operators, q, status])

  const dial = () => {
    const op = s.operators.find((o) => o.id === target)
    if (!op) return
    const call = s.addCall({ operatorId: op.id, direction: 'outgoing', status: 'active', started: new Date().toISOString(), duration: 0, channel: 'SECURE-VOICE' })
    setSel(call.id)
    setElapsed(0)
    setDialOpen(false)
    audio.play('notify')
    s.notify({ type: 'success', title: 'Call connected (simulated)', body: op.callsign, severity: 'low', module: 'comms' })
  }

  const end = () => {
    if (!active) return
    s.updateCall(active.id, { status: 'ended', duration: active.status === 'active' ? Math.max(3, elapsed) : active.duration })
    s.notify({ type: 'success', title: 'Call ended', body: `${active.id} closed locally`, severity: 'low', module: 'comms' })
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMUNICATIONS · CALLS"
        title="Voice Channel"
        subtitle="Simulated voice calls with a local console. No microphone access, media stream or dialling occurs."
        icon={Phone}
        meta={
          <>
            <span className="badge badge-cyan">{s.calls.length} RECORDS</span>
            <span className="badge badge-green">{live.length} LIVE</span>
            <span className="badge badge-amber">{s.calls.filter((c) => c.status === 'missed').length} MISSED</span>
            <span className="badge badge-grey">NO MEDIA</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-calls.csv', toCSV(s.calls.map(({ id, operatorId, direction, status, started, duration, channel }) => ({ id, operatorId, direction, status, started, duration, channel }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setDialOpen(true)}><PhoneCall size={11} /> New call</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Calls" value={s.calls.length} icon={Phone} accent="cyan" />
        <StatCard label="Live" value={live.length} icon={PhoneCall} accent="green" />
        <StatCard label="Missed" value={s.calls.filter((c) => c.status === 'missed').length} icon={PhoneMissed} accent="red" />
        <StatCard label="Talk time" value={`${Math.round(s.calls.reduce((a, c) => a + c.duration, 0) / 60)}m`} icon={Clock} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
        <div className="space-y-3">
          <Panel title="Console" icon={Radio}>
            {active ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
                <div className="border border-line bg-bg p-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar seed={s.operators.find((o) => o.id === active.operatorId)?.avatarSeed ?? 'x'} size={36} status={active.status === 'active' ? 'online' : 'offline'} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] text-ink">{s.operators.find((o) => o.id === active.operatorId)?.callsign ?? active.operatorId}</p>
                      <p className="mono text-[8px] text-ink-3">{active.channel} · {active.direction}</p>
                    </div>
                    <StatusPill value={active.status} />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="mono text-[22px] tabular text-[var(--accent)]">{pad(minutes)}:{pad(seconds)}</span>
                    <span className="mono text-[8px] text-ink-3">{active.status === 'active' ? 'ELAPSED' : 'RECORDED'}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <span key={i} className="w-1 bg-[var(--accent)]" style={{ height: `${4 + Math.abs(Math.sin((i + elapsed) / 2.4)) * 18}px`, opacity: active.status === 'active' ? 0.85 : 0.25 }} />
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    <button type="button" className={cn('btn btn-sm !px-0', muted && 'btn-primary')} onClick={() => setMuted((v) => !v)} title="Mute">{muted ? <MicOff size={11} /> : <Mic size={11} />}</button>
                    <button type="button" className={cn('btn btn-sm !px-0', !speaker && 'btn-primary')} onClick={() => setSpeaker((v) => !v)} title="Speaker">{speaker ? <Volume2 size={11} /> : <VolumeX size={11} />}</button>
                    <button type="button" className={cn('btn btn-sm !px-0', hold && 'btn-primary')} onClick={() => setHold((v) => !v)} title="Hold">{hold ? <Play size={11} /> : <Pause size={11} />}</button>
                    <button type="button" className="btn btn-sm !px-0 btn-danger" onClick={end} title="End call"><Phone size={11} /></button>
                  </div>
                </div>
                <div>
                  <p className="label-xs mb-1">SIGNAL</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between"><span className="text-[9.5px] text-ink-3">Strength</span><span className="mono text-[8.5px] text-green">{hold ? 42 : 92}%</span></div>
                    <Progress value={hold ? 42 : 92} height={3} color={PALETTE.green} />
                    <div className="flex items-center justify-between"><span className="text-[9.5px] text-ink-3">Jitter</span><span className="mono text-[8.5px] text-ink-3">{hold ? 24 : 8} ms</span></div>
                    <div className="flex items-center justify-between"><span className="text-[9.5px] text-ink-3">Packet loss</span><span className="mono text-[8.5px] text-ink-3">{hold ? 4.2 : 0.1}%</span></div>
                  </div>
                  <Divider />
                  <div className="flex flex-wrap gap-1">
                    <Tag tone="#28d8ea">{muted ? 'MUTED' : 'OPEN MIC'}</Tag>
                    <Tag tone="#38db91">{speaker ? 'SPEAKER' : 'HEADSET'}</Tag>
                    <Tag tone="#f5b942">{hold ? 'ON HOLD' : 'LIVE'}</Tag>
                  </div>
                  <p className="mt-1.5 font-mono text-[7.5px] leading-relaxed text-ink-3">Controls are cosmetic — the browser never opens a microphone or a media stream.</p>
                </div>
              </div>
            ) : <EmptyState icon={Phone} title="No call selected" message="Pick a record below or place a simulated call." />}
          </Panel>

          <Panel title="Call Records" icon={PhoneIncoming} bodyClassName="p-0"
            actions={<span className="mono text-[8.5px] text-ink-3">{filtered.length} / {s.calls.length}</span>}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-2.5 py-1.5">
              <div className="relative min-w-[170px] flex-1">
                <Filter size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter calls by operator, id or channel…" className="field pl-7" />
              </div>
              <Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'ringing', label: 'Ringing' }, { value: 'ended', label: 'Ended' }, { value: 'missed', label: 'Missed' }]} />
            </div>
            <div className="max-h-[40vh] overflow-auto">
              <table className="data-table min-w-[640px]">
                <thead><tr><th>ID</th><th>Operator</th><th>Direction</th><th>Channel</th><th>Started</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.map((c) => {
                    const op = s.operators.find((o) => o.id === c.operatorId)
                    return (
                      <tr key={c.id} className="cursor-pointer" data-selected={sel === c.id} onClick={() => setSel(c.id)}>
                        <td className="mono text-[8.5px] text-ink-3">{c.id}</td>
                        <td>
                          <span className="flex items-center gap-1">
                            {c.direction === 'incoming' ? <PhoneIncoming size={9} className="text-green" /> : c.status === 'missed' ? <PhoneMissed size={9} className="text-red" /> : <PhoneOutgoing size={9} className="text-cyan" />}
                            <span className="text-[10px] text-ink">{op?.callsign ?? c.operatorId}</span>
                          </span>
                        </td>
                        <td className="mono text-[8.5px] text-ink-3">{c.direction}</td>
                        <td className="text-[9.5px] text-ink-3">{c.channel}</td>
                        <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(c.started)}</td>
                        <td className="mono text-[9.5px] text-ink-3">{pad(Math.floor(c.duration / 60))}:{pad(c.duration % 60)}</td>
                        <td><StatusPill value={c.status} dot={false} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <EmptyState icon={Phone} title="No calls match" />}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Call Quality" icon={Signal}>
            <RadialGauge value={hold ? 62 : 94} color={hold ? '#f5b942' : '#38db91'} height={160} label="MOS SCORE" suffix="%" />
            <p className="text-center font-mono text-[8px] text-ink-3">Generated quality metric</p>
          </Panel>

          <Panel title="Mix" icon={Users}>
            <Donut
              data={['active', 'ringing', 'ended', 'missed'].map((st, i) => ({ name: st, value: s.calls.filter((c) => c.status === st).length, color: [PALETTE.green, PALETTE.blue, '#65788b', PALETTE.red][i] }))}
              height={150}
              centerLabel="CALLS"
              centerValue={String(s.calls.length)}
            />
          </Panel>

          <Panel title="Traffic" icon={Clock}>
            <AreaTrend
              data={Array.from({ length: 14 }, (_, i) => ({ t: `${pad(i * 2)}:00`, v: 2 + Math.round(Math.abs(Math.sin(i / 2)) * 7) }))}
              keys={[{ key: 'v', color: PALETTE.cyan, label: 'Calls' }]}
              height={140}
            />
            <ChartLegend items={[{ label: 'Calls per 2h window', color: PALETTE.cyan }]} />
          </Panel>

          <Panel title="Console Options" icon={ShieldCheck}>
            <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Push-to-talk</span><Toggle checked={!muted} onChange={(v) => setMuted(!v)} label="" /></div>
            <Divider />
            <KeyValue items={[{ k: 'Codec', v: 'SIMULATED' }, { k: 'Encryption', v: 'REPRESENTED' }, { k: 'Media', v: 'NONE' }]} />
          </Panel>
        </div>
      </div>

      <Panel title="Directional Split" icon={BarChart3} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Direction</th><th>Total</th><th>Answered</th><th>Missed</th><th>Avg duration</th></tr></thead>
          <tbody>
            {(['incoming', 'outgoing'] as const).map((d) => {
              const list = s.calls.filter((c) => c.direction === d)
              const avg = Math.round(list.reduce((a, c) => a + c.duration, 0) / Math.max(1, list.length))
              return (
                <tr key={d}>
                  <td className="text-[10px] capitalize text-ink">{d}</td>
                  <td className="mono text-[9.5px] text-ink-3">{list.length}</td>
                  <td className="mono text-[9.5px] text-green">{list.filter((c) => c.status === 'ended' || c.status === 'active').length}</td>
                  <td className="mono text-[9.5px] text-red">{list.filter((c) => c.status === 'missed').length}</td>
                  <td className="mono text-[9.5px] text-ink-3">{pad(Math.floor(avg / 60))}:{pad(avg % 60)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <InlineAlert tone="amber" title="No real telephony">
        Calls are records in local state. Nothing is dialled, no audio is captured, and no telephone network is contacted.
      </InlineAlert>

      <Modal open={dialOpen} onClose={() => setDialOpen(false)} title="Place Simulated Call" subtitle="Creates a local call record" icon={PhoneCall}
        footer={<>
          <button type="button" className="btn" onClick={() => setDialOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={dial}><PhoneCall size={11} /> Connect</button>
        </>}
      >
        <div className="space-y-3">
          <Select label="Operator" value={target} onChange={setTarget} options={s.operators.map((o) => ({ value: o.id, label: `${o.callsign} — ${o.role}` }))} />
          <div className="border border-line bg-bg p-2">
            <p className="label-xs mb-1">PREVIEW</p>
            <div className="flex items-center gap-2">
              <Avatar seed={s.operators.find((o) => o.id === target)?.avatarSeed ?? 'x'} size={28} />
              <div><p className="text-[10.5px] text-ink">{s.operators.find((o) => o.id === target)?.displayName}</p><p className="mono text-[8px] text-ink-3">{s.operators.find((o) => o.id === target)?.unit}</p></div>
            </div>
          </div>
          <p className="font-mono text-[8.5px] leading-relaxed text-ink-3"><Circle size={7} className="mr-1 inline text-amber" />The call state is simulated for the demonstration. No microphone is opened.</p>
        </div>
      </Modal>

    </Screen>
  )
}
