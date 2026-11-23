import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send, Lock, ShieldCheck, User, ArrowRight, Paperclip, Ghost, KeyRound, Eye } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, EmptyState, InlineAlert, KeyValue, Divider, Tag, Avatar } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn } from '@/lib/utils'

interface ChatMsg {
  id: string
  from: 'vendor' | 'me'
  text: string
  ts: string
}

const SCRIPTS: Record<string, string[]> = {
  default: [
    'Vetting complete. Items are props — printed fiction only.',
    'Escrow is simulated. Nothing here is functional.',
    'Delivery window is generated, not a real shipment.',
    'Understood. Keeping the demo compliant.',
  ],
}

export default function Messages() {
  const s = useEngine()
  const operators = s.operators
  const [vendorId, setVendorId] = useState(s.vendors[0]?.id ?? '')
  const [threads, setThreads] = useState<Record<string, ChatMsg[]>>(() => {
    const base: Record<string, ChatMsg[]> = {}
    s.vendors.forEach((v, i) => {
      base[v.id] = [
        { id: `${v.id}-1`, from: 'vendor', text: `Channel open. ${v.handle} here. All goods are fictional props.`, ts: new Date(Date.now() - (i + 2) * 1_800_000).toISOString() },
        { id: `${v.id}-2`, from: 'me', text: 'Confirmed. Requesting catalogue availability only.', ts: new Date(Date.now() - (i + 1) * 1_600_000).toISOString() },
        ...(i % 3 === 0 ? [{ id: `${v.id}-3`, from: 'vendor' as const, text: 'Catalogue attached as demo data. No transmissible payload.', ts: new Date(Date.now() - (i + 1) * 1_500_000).toISOString() }] : []),
      ]
    })
    return base
  })
  const [draft, setDraft] = useState('')
  const [scrambled, setScrambled] = useState(true)
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const vendor = s.vendors.find((v) => v.id === vendorId)
  const messages = threads[vendorId] ?? []

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, vendorId])

  const send = () => {
    if (!draft.trim() || !vendor) return
    const msg: ChatMsg = { id: `${vendorId}-${Date.now()}`, from: 'me', text: draft.trim(), ts: new Date().toISOString() }
    setThreads((t) => ({ ...t, [vendorId]: [...(t[vendorId] ?? []), msg] }))
    setDraft('')
    setTyping(true)
    window.setTimeout(() => {
      const replies = SCRIPTS.default
      const reply = replies[Math.floor(Math.random() * replies.length)]
      setThreads((t) => ({ ...t, [vendorId]: [...(t[vendorId] ?? []), { id: `${vendorId}-${Date.now() + 1}`, from: 'vendor', text: reply, ts: new Date().toISOString() }] }))
      setTyping(false)
    }, 1100)
  }

  const scramble = (text: string) =>
    scrambled
      ? text.replace(/[a-zA-Z0-9]/g, (c, i) => (i % 4 === 0 ? '█' : c))
      : text

  const totalMsgs = useMemo(() => Object.values(threads).reduce((a, t) => a + t.length, 0), [threads])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="UNDERGROUND · COMMS"
        title="Encrypted Chat (Simulated)"
        subtitle="A fictional vendor messaging channel. Text never leaves this tab and no real person is contacted."
        icon={MessageSquare}
        meta={
          <>
            <span className="badge badge-cyan">{s.vendors.length} CHANNELS</span>
            <span className="badge badge-grey">{totalMsgs} MESSAGES</span>
            <span className="badge badge-green">LOCAL ONLY</span>
            <span className="badge badge-amber">100% FICTION</span>
          </>
        }
        actions={<StatusPill value="online" label="DEMO SESSION" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Channels" value={s.vendors.length} icon={MessageSquare} accent="cyan" />
        <StatCard label="Messages" value={totalMsgs} icon={Send} accent="green" />
        <StatCard label="Obfuscation" value={scrambled ? 'ON' : 'OFF'} icon={Lock} accent={scrambled ? 'green' : 'amber'} />
        <StatCard label="Real contacts" value={0} icon={ShieldCheck} accent="blue" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[260px_1fr]">
        <Panel title="Channels" icon={Ghost} bodyClassName="p-0" actions={<span className="badge badge-grey">{s.vendors.length}</span>}>
          <ul className="max-h-[58vh] divide-y divide-line-soft overflow-y-auto">
            {s.vendors.map((v) => {
              const thread = threads[v.id] ?? []
              const last = thread[thread.length - 1]
              return (
                <li key={v.id}>
                  <button type="button" onClick={() => setVendorId(v.id)} data-selected={vendorId === v.id} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-elevated">
                    <Avatar seed={v.avatarSeed} size={22} status={v.status} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate font-mono text-[10px] text-ink">{v.handle}</span>
                        <span className="mono shrink-0 text-[7.5px] text-ink-3">{last ? new Date(last.ts).toISOString().slice(11, 16) : '—'}</span>
                      </span>
                      <span className="block truncate text-[8px] text-ink-3">{last?.text ?? 'no messages'}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel
            title={vendor ? `${vendor.handle} · secure channel` : 'Channel'}
            icon={Lock}
            subtitle="Demo-grade obfuscation only — not real cryptography"
            actions={
              <div className="flex items-center gap-1.5">
                <button type="button" className={cn('btn btn-sm', scrambled && 'btn-primary')} onClick={() => setScrambled((v) => !v)}><Eye size={10} /> {scrambled ? 'Masked' : 'Plain'}</button>
                <StatusPill value="active" label="SIMULATED E2E" dot={false} />
              </div>
            }
            bodyClassName="p-0"
          >
            <div className="flex h-[50vh] flex-col">
              <div className="flex-1 overflow-y-auto p-2.5">
                {messages.length ? (
                  <div className="space-y-2">
                    {messages.map((m) => (
                      <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[78%] border px-2 py-1.5', m.from === 'me' ? 'border-[#1a6472] bg-[#0c2830]' : 'border-line bg-panel')}>
                          <div className="flex items-center gap-1.5">
                            <span className={cn('mono text-[7.5px] uppercase tracking-widest', m.from === 'me' ? 'text-[#7ff0fb]' : 'text-ink-3')}>
                              {m.from === 'me' ? 'OPERATOR' : vendor?.handle ?? 'VENDOR'}
                            </span>
                            <span className="mono text-[7px] text-ink-3">{new Date(m.ts).toISOString().slice(11, 16)}Z</span>
                          </div>
                          <p className={cn('mt-0.5 font-terminal text-[10.5px] leading-relaxed', m.from === 'me' ? 'text-[#c9f6ff]' : 'text-ink-2')}>
                            {scramble(m.text)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {typing && <p className="mono animate-pulse text-[8.5px] text-ink-3">{vendor?.handle} is typing…</p>}
                    <div ref={endRef} />
                  </div>
                ) : (
                  <EmptyState icon={MessageSquare} title="No messages" message="Send a demo message to begin." />
                )}
              </div>
              <div className="border-t border-line p-2">
                <div className="flex items-end gap-1.5">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder="Compose a simulated message… (Enter to send)"
                    className="field min-h-[38px] flex-1 resize-none font-terminal text-[10.5px]"
                    rows={1}
                  />
                  <button type="button" className="btn btn-primary h-8 !px-2.5" title="Send message" aria-label="Send message" onClick={send} disabled={!draft.trim()}><Send size={11} /></button>
                  <button type="button" className="btn h-8 !px-2" title="Attach demo file" aria-label="Attach demo file" onClick={() => setDraft((d) => `${d}[ATTACH: demo-only]`)}><Paperclip size={11} /></button>
                </div>
                <p className="mt-1 font-mono text-[7.5px] leading-relaxed text-ink-3">
                  Messages exist only in this browser tab. Nothing is sent, stored or shared.
                </p>
              </div>
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Channel Info" icon={KeyRound}>
              <KeyValue
                items={[
                  { k: 'Vendor', v: vendor?.handle ?? '—' },
                  { k: 'Status', v: vendor?.status.toUpperCase() ?? '—' },
                  { k: 'Rating', v: vendor ? vendor.rating.toFixed(2) : '—' },
                  { k: 'Deals', v: String(vendor?.deals ?? 0) },
                  { k: 'Members', v: '2 (simulated)' },
                  { k: 'Transport', v: 'NONE — LOCAL STATE' },
                ]}
              />
              <Divider />
              <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">SIMULATED CHAT</Tag><Tag tone="#f5b942">NO NETWORK</Tag></div>
            </Panel>

            <Panel title="Participants" icon={User} bodyClassName="p-0">
              <ul className="divide-y divide-line-soft">
                {operators.slice(0, 3).map((o) => (
                  <li key={o.id} className="flex items-center gap-2 px-2.5 py-1">
                    <Avatar seed={o.avatarSeed} size={18} status={o.status} />
                    <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-ink-2">{o.callsign}</span>
                    <span className="mono text-[7.5px] uppercase text-ink-3">{o.role}</span>
                  </li>
                ))}
                {vendor && (
                  <li className="flex items-center gap-2 px-2.5 py-1">
                    <Avatar seed={vendor.avatarSeed} size={18} />
                    <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-ink"><ArrowRight size={8} className="mr-1 inline" />{vendor.handle}</span>
                    <span className="mono text-[7.5px] uppercase text-ink-3">vendor (fictional)</span>
                  </li>
                )}
              </ul>
            </Panel>
          </div>
        </div>
      </div>

      <InlineAlert tone="red" title="Fictional channel">
        No encryption is applied beyond a visual mask, no message is transmitted, and no real vendor, marketplace or person is
        on the other side. Do not type personal information.
      </InlineAlert>
    </Screen>
  )
}
