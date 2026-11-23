import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MessagesSquare, Send, Lock, Unlock, Search, Hash, Users, Radio, Megaphone,
  Paperclip, CheckCheck, Smile, ShieldCheck, Pin, Trash2, ArrowDown, Info, Filter,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, InlineAlert, Divider, KeyValue, Toggle, EmptyState, Avatar, Tag, Modal } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, fmtDateTime, relTime } from '@/lib/utils'

const KIND_ICON = { channel: Hash, direct: Users, dispatch: Radio, broadcast: Megaphone } as const

export default function CommsMessages() {
  const [params, setParams] = useSearchParams()
  const s = useEngine()
  const [channelId, setChannelId] = useState(params.get('c') ?? s.channels[0]?.id ?? '')
  const [body, setBody] = useState('')
  const [encrypted, setEncrypted] = useState(true)
  const [q, setQ] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const c = params.get('c')
    if (c) { setChannelId(c); setParams({}, { replace: true }) }
  }, [params, setParams])

  const channel = s.channels.find((c) => c.id === channelId) ?? s.channels[0]
  const me = s.operators.find((o) => o.id === s.currentOperatorId) ?? s.operators[0]

  const messages = useMemo(() => {
    const t = q.toLowerCase()
    return s.messages
      .filter((m) => m.channelId === channel?.id)
      .filter((m) => {
        if (t && !m.body.toLowerCase().includes(t)) return false
        if (filterMode === 'encrypted' && !m.encrypted) return false
        if (filterMode === 'unencrypted' && m.encrypted) return false
        if (filterMode === 'attachments' && !m.attachments?.length) return false
        return true
      })
      .slice()
      .sort((a, b) => +new Date(a.ts) - +new Date(b.ts))
  }, [s.messages, channel?.id, q, filterMode])

  useEffect(() => {
    if (channel) s.setChannelUnread(channel.id, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.id])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length, channel?.id])

  const send = () => {
    if (!body.trim() || !channel) return
    s.sendMessage(channel.id, body.trim(), encrypted)
    setBody('')
  }

  const unread = s.channels.reduce((a, c) => a + c.unread, 0)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="COMMUNICATIONS · MESSAGES"
        title="Operator Chat"
        subtitle="Encrypted-style conversation between simulated operators. Messages never leave this browser."
        icon={MessagesSquare}
        meta={
          <>
            <span className="badge badge-cyan">{s.channels.length} CHANNELS</span>
            <span className="badge badge-amber">{unread} UNREAD</span>
            <span className="badge badge-green">{s.messages.length} MESSAGES</span>
            <span className="badge badge-grey">{s.messages.filter((m) => m.encrypted).length} ENCRYPTED</span>
          </>
        }
        actions={
          <>
            <button type="button" className={cn('btn btn-sm', searchOpen && 'btn-primary')} onClick={() => setSearchOpen((v) => !v)}><Search size={11} /> Search</button>
            <button type="button" className={cn('btn btn-sm', showInfo && 'btn-primary')} onClick={() => setShowInfo((v) => !v)}><Info size={11} /> Info</button>
            <button type="button" className="btn btn-sm" onClick={() => setClearOpen(true)}><Trash2 size={11} /> Clear</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Channels" value={s.channels.length} icon={Hash} accent="cyan" />
        <StatCard label="Unread" value={unread} icon={MessagesSquare} accent="amber" />
        <StatCard label="Encrypted" value={`${Math.round((s.messages.filter((m) => m.encrypted).length / Math.max(1, s.messages.length)) * 100)}%`} icon={Lock} accent="green" />
        <StatCard label="Attachments" value={s.messages.filter((m) => m.attachments?.length).length} icon={Paperclip} accent="blue" />
      </div>

      {searchOpen && (
        <Panel title="Search & Filter" icon={Filter} bodyClassName="py-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <p className="label-xs mb-1">MESSAGE TEXT</p>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this channel…" className="field pl-7" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {[['all', 'All'], ['encrypted', 'Encrypted'], ['unencrypted', 'Plain'], ['attachments', 'Files']].map(([v, l]) => (
                <button key={v} type="button" className={cn('btn btn-sm', filterMode === v && 'btn-primary')} onClick={() => setFilterMode(v)}>{l}</button>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 xl:grid-cols-[250px_1fr]">
        <Panel title="Channels" icon={Hash} bodyClassName="p-0"
          actions={<span className="mono text-[8.5px] text-ink-3">{s.channels.length}</span>}
        >
          <ul className="max-h-[62vh] divide-y divide-line-soft overflow-y-auto">
            {s.channels.map((c) => {
              const Icon = KIND_ICON[c.kind]
              const last = [...s.messages].reverse().find((m) => m.channelId === c.id)
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setChannelId(c.id)} data-selected={channelId === c.id}
                    className="flex w-full items-start gap-2 px-2 py-1.5 text-left hover:bg-elevated"
                  >
                    <Icon size={11} className={cn('mt-0.5 shrink-0', c.unread ? 'text-[var(--accent)]' : 'text-ink-3')} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <span className={cn('truncate text-[10.5px]', c.unread ? 'font-medium text-ink' : 'text-ink-2')}>{c.name}</span>
                        {c.unread > 0 && <span className="badge badge-cyan">{c.unread}</span>}
                      </span>
                      <span className="block truncate text-[8.5px] text-ink-3">{last ? `${last.operatorId}: ${last.body}` : c.topic}</span>
                    </span>
                    {last && <span className="mono shrink-0 text-[7px] text-ink-3">{last.ts.slice(11, 16)}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel
            title={channel?.name ?? 'Channel'}
            subtitle={channel ? `${channel.kind.toUpperCase()} · ${channel.members.length} members · ${channel.topic}` : undefined}
            icon={channel ? KIND_ICON[channel.kind] : Hash}
            bodyClassName="p-0"
            actions={
              <div className="flex items-center gap-1.5">
                <span className="mono text-[8px] text-ink-3">{messages.length} msgs</span>
                <StatusPill value="online" label="LOCAL" />
              </div>
            }
          >
            <div ref={listRef} className="h-[46vh] min-h-[260px] overflow-y-auto px-2.5 py-2">
              {messages.length === 0 && <EmptyState icon={MessagesSquare} title="No messages" message="Send the first simulated message in this channel." />}
              {messages.map((m, i) => {
                const op = s.operators.find((o) => o.id === m.operatorId)
                const mine = m.operatorId === me?.id
                const prev = messages[i - 1]
                const grouped = prev && prev.operatorId === m.operatorId && +new Date(m.ts) - +new Date(prev.ts) < 240_000
                return (
                  <div key={m.id} className={cn('flex gap-2', mine && 'flex-row-reverse', grouped ? 'mt-0.5' : 'mt-2.5')}>
                    <span className={cn('h-6 w-6 shrink-0', grouped && 'opacity-0')}>
                      <Avatar seed={op?.avatarSeed ?? m.operatorId} size={24} />
                    </span>
                    <div className={cn('max-w-[76%] min-w-0', mine && 'items-end text-right')}>
                      {!grouped && (
                        <div className={cn('mb-0.5 flex items-center gap-1.5', mine && 'justify-end')}>
                          <span className="text-[9.5px] text-ink-2">{op?.callsign ?? m.operatorId}</span>
                          <span className="mono text-[7.5px] text-ink-3">{m.ts.slice(11, 16)}</span>
                          {m.encrypted ? <Lock size={7} className="text-green" /> : <Unlock size={7} className="text-amber" />}
                        </div>
                      )}
                      <div className={cn('inline-block border px-2 py-1 text-left', mine ? 'border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--accent-soft)]' : 'border-line bg-elevated')}>
                        <p className="whitespace-pre-wrap break-words text-[10.5px] leading-relaxed text-ink-2">{m.body}</p>
                        {m.attachments?.length ? (
                          <div className="mt-1 space-y-0.5">
                            {m.attachments.map((a) => (
                              <span key={a.name} className="flex items-center gap-1 border border-line bg-bg px-1.5 py-0.5 font-mono text-[8px] text-ink-3"><Paperclip size={7} /> {a.name} <span className="text-ink-3/60">({a.kind})</span></span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={cn('mt-0.5 flex items-center gap-1', mine && 'justify-end')}>
                        <span className={cn('mono text-[7px] uppercase', m.delivery === 'read' ? 'text-green' : 'text-ink-3')}>{m.delivery}</span>
                        {m.delivery !== 'sending' && <CheckCheck size={7} className="text-ink-3" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-line p-2">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setEncrypted((v) => !v)} className={cn('btn btn-sm !py-0.5', encrypted ? 'btn-primary' : '')}>
                  {encrypted ? <Lock size={9} /> : <Unlock size={9} />} {encrypted ? 'Encrypted' : 'Plain'}
                </button>
                <span className="mono text-[8px] text-ink-3">{encrypted ? 'Messages are tagged as encrypted locally. No cipher is applied.' : 'Messages will be tagged as unencrypted in this demo.'}</span>
                <button type="button" className="icon-btn ml-auto" title="Emoji" onClick={() => setBody((b) => b + ' ▮')}><Smile size={10} /></button>
                <button type="button" className="icon-btn" title="Attach" onClick={() => setBody((b) => b + ' [attachment: file.pdf] ')}><Paperclip size={10} /></button>
              </div>
              <div className="flex items-end gap-1.5">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder={`Message ${channel?.name ?? ''}… (Enter to send)`}
                  className="field min-h-[52px] flex-1 resize-none text-[11px]"
                />
                <button type="button" className="btn btn-primary h-[52px] px-3" title="Send message" aria-label="Send message" onClick={send} disabled={!body.trim()}><Send size={13} /></button>
              </div>
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="Channel Intel" icon={ShieldCheck}>
              <KeyValue
                items={[
                  { k: 'Kind', v: channel?.kind.toUpperCase() ?? '—' },
                  { k: 'Members', v: String(channel?.members.length ?? 0) },
                  { k: 'Messages', v: String(s.messages.filter((m) => m.channelId === channel?.id).length) },
                  { k: 'Topic', v: channel?.topic ?? '—' },
                ]}
              />
            </Panel>
            <Panel title="Members" icon={Users}>
              <ul className="space-y-1">
                {(channel?.members ?? []).slice(0, 6).map((id) => {
                  const op = s.operators.find((o) => o.id === id)
                  return (
                    <li key={id} className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', op?.status === 'online' ? 'bg-green' : 'bg-ink-3')} />
                      <span className="truncate text-[10px] text-ink-2">{op?.callsign ?? id}</span>
                    </li>
                  )
                })}
                {!channel?.members.length && <li className="text-[10px] text-ink-3">No members listed.</li>}
              </ul>
            </Panel>
            <Panel title="Composer" icon={Send}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Encrypt by default</span><Toggle checked={encrypted} onChange={setEncrypted} label="" /></div>
                <p className="text-[9px] leading-relaxed text-ink-3">Encryption is a visual tag in this demo. Use the Cryptography module for real local AES.</p>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {showInfo && (
        <Panel title="About Chat" icon={Info}>
          <div className="grid gap-2 sm:grid-cols-3">
            <div><p className="label-xs mb-1">DELIVERY</p><p className="text-[10px] leading-relaxed text-ink-2">Messages progress from sending → sent → delivered → read via a local timer.</p></div>
            <div><p className="label-xs mb-1">STORAGE</p><p className="text-[10px] leading-relaxed text-ink-2">Kept in the zustand engine store for the session. Nothing is uploaded.</p></div>
            <div><p className="label-xs mb-1">FICTION</p><p className="text-[10px] leading-relaxed text-ink-2">Operators, channels and traffic are generated by the demo.</p></div>
          </div>
          <Divider />
          <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL STORE</Tag><Tag tone="#38db91">ZERO NETWORK</Tag><Tag tone="#f5b942">SIMULATED OPERATORS</Tag></div>
        </Panel>
      )}

      <Panel title="Recent Activity" icon={ArrowDown} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Time</th><th>Channel</th><th>Operator</th><th>Excerpt</th><th>Enc</th><th>Delivery</th></tr></thead>
          <tbody>
            {[...s.messages].reverse().slice(0, 8).map((m) => {
              const ch = s.channels.find((c) => c.id === m.channelId)
              const op = s.operators.find((o) => o.id === m.operatorId)
              return (
                <tr key={m.id} className="cursor-pointer" onClick={() => setChannelId(m.channelId)}>
                  <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{fmtDateTime(m.ts)}</td>
                  <td className="text-[10px] text-ink-2">{ch?.name ?? m.channelId}</td>
                  <td className="text-[9.5px] text-ink-3">{op?.callsign ?? m.operatorId}</td>
                  <td className="max-w-[280px] truncate text-[9.5px] text-ink-3">{m.body}</td>
                  <td>{m.encrypted ? <Lock size={8} className="text-green" /> : <Unlock size={8} className="text-amber" />}</td>
                  <td className="mono text-[8px] uppercase text-ink-3">{m.delivery}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <InlineAlert tone="cyan" title="No real messaging">
        This is a chat mock-up over generated operator data. No message is transmitted, and the encryption badge does not apply
        a cipher.
      </InlineAlert>

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="Clear Channel" subtitle={channel?.name} icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setClearOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { if (channel) s.clearChannel(channel.id); setClearOpen(false) }}><Trash2 size={11} /> Clear channel</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          This permanently removes every message in this channel from the local session store. Other channels are untouched, and
          resetting the simulation regenerates the seed messages.
        </p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><Pin size={9} /> {messages.length} messages in view · {relTime(new Date().toISOString())}</div>
      </Modal>
    </Screen>
  )
}
