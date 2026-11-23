import { useMemo, useState } from 'react'
import { Bell, CheckCheck, Search, Radio, Siren, ShieldCheck, Volume2, VolumeX, Filter, Trash2 } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, EmptyState, InlineAlert, Divider, Tabs, Toggle, KeyValue, Tag, Modal } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { audio } from '@/services/audio'
import { cn, fmtDateTime } from '@/lib/utils'

const KINDS = ['all', 'incident', 'emergency', 'alert', 'failure', 'pending', 'success'] as const

export default function Alerts() {
  const s = useEngine()
  const soundEnabled = usePrefs((p) => p.soundEnabled)
  const setPref = usePrefs((p) => p.set)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [confirm, setConfirm] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastText, setBroadcastText] = useState('Attention all operators: simulated drill in progress. Acknowledge when ready.')

  const alerts = useMemo(() => {
    const t = q.toLowerCase()
    return s.notifications
      .filter((n) => {
        if (filter !== 'all' && n.type !== filter) return false
        if (t && !`${n.title} ${n.body}`.toLowerCase().includes(t)) return false
        if (tab === 'unread' && n.read) return false
        if (tab === 'critical' && n.severity !== 'critical') return false
        return true
      })
      .slice()
      .sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
  }, [s.notifications, filter, q, tab])

  const unread = s.notifications.filter((n) => !n.read).length
  const critical = s.notifications.filter((n) => n.severity === 'critical').length

  const testSound = () => {
    audio.play('alert')
    setPref('soundEnabled', true)
  }

  const broadcast = () => {
    s.notify({ type: 'emergency', title: 'SIMULATED BROADCAST', body: broadcastText, severity: 'critical', module: 'crisis', href: '/communications/dispatch' })
    s.emit('CRISIS.BROADCAST', { text: broadcastText })
    setBroadcastOpen(false)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRISIS · ALERTS"
        title="Alert Centre"
        subtitle="The full simulated notification feed. Every alert is generated locally and clearly marked fictional."
        icon={Bell}
        meta={
          <>
            <span className="badge badge-red">{unread} UNREAD</span>
            <span className="badge badge-amber">{critical} CRITICAL</span>
            <span className="badge badge-grey">{s.notifications.length} TOTAL</span>
            <span className="badge badge-cyan">{soundEnabled ? 'SOUND ON' : 'SOUND OFF'}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setPref('soundEnabled', !soundEnabled)}>{soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />} {soundEnabled ? 'Mute' : 'Unmute'}</button>
            <button type="button" className="btn btn-sm" onClick={testSound}><Siren size={11} /> Test alert</button>
            <button type="button" className="btn btn-sm" onClick={() => s.markAllRead()}><CheckCheck size={11} /> Mark all read</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total alerts" value={s.notifications.length} icon={Bell} accent="cyan" />
        <StatCard label="Unread" value={unread} icon={Bell} accent="amber" />
        <StatCard label="Critical" value={critical} icon={Siren} accent="red" />
        <StatCard label="Read" value={s.notifications.filter((n) => n.read).length} icon={ShieldCheck} accent="green" />
      </div>

      <Panel title="Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Alert title or body…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">TYPE</p><Select className="w-32" value={filter} onChange={setFilter} options={KINDS.map((k) => ({ value: k, label: k === 'all' ? 'All types' : k }))} /></div>
          <div className="flex gap-1">
            <button type="button" className="btn btn-sm" onClick={() => setBroadcastOpen(true)}><Radio size={10} /> Broadcast</button>
            <button type="button" className="btn btn-sm" onClick={() => setConfirm(true)}><Trash2 size={10} /> Clear all</button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <Panel title="Alert Feed" icon={Bell} bodyClassName="p-0"
          actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: s.notifications.length }, { id: 'unread', label: 'Unread', count: unread }, { id: 'critical', label: 'Critical', count: critical }]} />}
        >
          <ul className="max-h-[56vh] divide-y divide-line-soft overflow-y-auto">
            {alerts.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-2 px-2.5 py-2', !n.read && 'bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]')}>
                <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', n.severity === 'critical' ? 'bg-red' : n.severity === 'elevated' ? 'bg-amber' : 'bg-green')} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('text-[10.5px]', n.read ? 'text-ink-2' : 'font-medium text-ink')}>{n.title}</span>
                    <SeverityPill value={n.severity} />
                    <span className="badge badge-grey">{n.type}</span>
                    {!n.read && <span className="badge badge-cyan">NEW</span>}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-3">{n.body}</span>
                  <span className="mono mt-0.5 block text-[7.5px] text-ink-3">{fmtDateTime(n.ts)} · {n.module} · SIMULATED</span>
                </span>
                <button type="button" className="btn btn-sm !px-1.5 shrink-0" onClick={() => s.markRead(n.id)} disabled={n.read} title="Mark read">
                  <CheckCheck size={9} />
                </button>
              </li>
            ))}
            {alerts.length === 0 && <li><EmptyState icon={Bell} title="No alerts match" message="Adjust the filters or wait for the simulation to generate more." /></li>}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel title="Alert Mix" icon={ShieldCheck}>
            {KINDS.filter((k) => k !== 'all').map((k) => {
              const n = s.notifications.filter((x) => x.type === k).length
              const pct = (n / Math.max(1, s.notifications.length)) * 100
              return (
                <div key={k} className="mb-1.5">
                  <div className="flex justify-between"><span className="text-[10px] capitalize text-ink-2">{k}</span><span className="mono text-[8.5px] text-ink-3">{n}</span></div>
                  <div className="h-1 bg-[#16212b]"><div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </Panel>

          <Panel title="Notification Settings" icon={Radio}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Sound on alerts</span><Toggle checked={soundEnabled} onChange={(v) => setPref('soundEnabled', v)} label="" /></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Simulation autosave</span><Toggle checked={s.autoUpdate} onChange={() => s.togglePause()} label="" /></div>
            </div>
            <Divider />
            <KeyValue
              items={[
                { k: 'Volume', v: `${Math.round(usePrefs.getState().volume * 100)}%` },
                { k: 'Feed size', v: String(s.notifications.length) },
                { k: 'Critical', v: String(critical) },
              ]}
            />
          </Panel>

          <Panel title="Alert Legend" icon={Bell}>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green" /><span className="text-[10px] text-ink-2">Low — informational</span></div>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber" /><span className="text-[10px] text-ink-2">Elevated — review</span></div>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red" /><span className="text-[10px] text-ink-2">Critical — escalate</span></div>
            </div>
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#f5b942">FICTIONAL ALERTS</Tag><Tag tone="#38db91">NO REAL NOTIFICATIONS</Tag></div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Simulated alerting">
        Alerts are produced by the engine and local rules. No email, SMS, push or pager is involved, and nothing is sent to a
        real recipient.
      </InlineAlert>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Clear All Alerts" subtitle="Removes every notification from the demo feed" icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setConfirm(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { s.clearNotifications(); setConfirm(false) }}><Trash2 size={11} /> Clear feed</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">This clears the in-memory alert feed for this session. A fresh reset of the simulation restores the seed alerts.</p>
        <div className="mt-2"><StatusPill value="pending" label={`${s.notifications.length} ALERTS`} /></div>
      </Modal>

      <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="Simulated Broadcast" subtitle="Adds a critical alert to the feed and the event bus" icon={Radio}
        footer={<>
          <button type="button" className="btn" onClick={() => setBroadcastOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={broadcast} disabled={!broadcastText.trim()}><Radio size={11} /> Broadcast</button>
        </>}
      >
        <div className="space-y-2">
          <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="field min-h-[90px] text-[11px]" />
          <p className="font-mono text-[8.5px] text-ink-3">No network. The alert is appended locally and lights up the notification centre.</p>
        </div>
      </Modal>

    </Screen>
  )
}
