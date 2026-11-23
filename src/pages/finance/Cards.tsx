import { useMemo, useState } from 'react'
import { CreditCard, Lock, Plus, Snowflake, Unlock, Wifi, ShieldAlert, Sliders } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Progress, KeyValue, Select, Modal, InlineAlert, Slider, EmptyState, ConfirmationCard, SimulatedNotice } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, fmtMoney } from '@/lib/utils'
import type { Card } from '@/types'

const DESIGNS: Record<string, { bg: string; accent: string; label: string }> = {
  obsidian: { bg: 'linear-gradient(135deg,#0d151d 0%,#1a2733 55%,#0a1118 100%)', accent: '#28d8ea', label: 'OBSIDIAN' },
  aurora: { bg: 'linear-gradient(135deg,#0a1a20 0%,#123b3f 55%,#08131a 100%)', accent: '#38db91', label: 'AURORA' },
  crimson: { bg: 'linear-gradient(135deg,#1d0a0f 0%,#3d1520 55%,#150a0e 100%)', accent: '#f14e61', label: 'CRIMSON' },
  titanium: { bg: 'linear-gradient(135deg,#16181c 0%,#2c333a 55%,#101317 100%)', accent: '#93a3b4', label: 'TITANIUM' },
}

export default function Cards() {
  const cards = useEngine((s) => s.cards)
  const accounts = useEngine((s) => s.accounts)
  const toggleFreeze = useEngine((s) => s.toggleCardFreeze)
  const addCard = useEngine((s) => s.addCard)
  const [selected, setSelected] = useState<string | null>(cards[0]?.id ?? null)
  const [createOpen, setCreateOpen] = useState(false)
  const [issued, setIssued] = useState<{ id: string; holder: string; last4: string; category: string; limit: number; design: string } | null>(null)
  const [form, setForm] = useState({ holder: 'Demo Operator', accountId: accounts[0]?.id ?? '', category: 'DEBIT' as Card['category'], design: 'obsidian', limit: 25000 })
  const [revealed, setRevealed] = useState(false)

  const current = cards.find((c) => c.id === selected) ?? cards[0]
  const design = DESIGNS[current?.design ?? 'obsidian']

  const stats = useMemo(() => ({
    active: cards.filter((c) => c.status === 'active').length,
    frozen: cards.filter((c) => c.status === 'frozen').length,
    limit: cards.reduce((a, c) => a + c.limit, 0),
    spent: cards.reduce((a, c) => a + c.spent, 0),
  }), [cards])

  const submit = () => {
    if (!form.holder.trim()) return
    const card = addCard({
      holder: form.holder,
      accountId: form.accountId,
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      category: form.category,
      brand: 'SHADOW DEBIT',
      expiry: '09/29',
      status: 'active',
      limit: form.limit,
      spent: 0,
      design: form.design,
    })
    setIssued({
      id: card.id,
      holder: form.holder,
      last4: card.last4,
      category: form.category,
      limit: form.limit,
      design: DESIGNS[form.design]?.label ?? form.design,
    })
    setCreateOpen(false)
    setForm({ ...form, holder: 'Demo Operator', limit: 25000 })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · CARD PROGRAM"
        title="Fictional Debit & Credit Cards"
        subtitle="Cinematic card artwork with inert placeholder identifiers. No cardholder data is requested, stored or validated."
        icon={CreditCard}
        meta={
          <>
            <span className="badge badge-green">{stats.active} ACTIVE</span>
            <span className="badge badge-blue">{stats.frozen} FROZEN</span>
            <span className="badge badge-amber">PLACEHOLDER NUMBERS ONLY</span>
          </>
        }
        actions={<button type="button" className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}><Plus size={11} /> Issue demo card</button>}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.3fr]">
        <Panel title="Card Detail" icon={CreditCard} subtitle={current?.id}>
          {current ? (
            <div className="space-y-3">
              <div
                className="relative aspect-[1.586] w-full max-w-[420px] overflow-hidden rounded-md border border-white/10 p-4 shadow-2xl scanlines"
                style={{ background: design.bg }}
              >
                <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 9px,rgba(255,255,255,.5) 9px,rgba(255,255,255,.5) 10px)' }} />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/90">SHADOW SYSTEMS</p>
                      <p className="mt-0.5 font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/40">{design.label} SERIES</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wifi size={13} className="rotate-90 text-white/40" />
                      <ShieldAlert size={13} style={{ color: design.accent }} />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[15px] tabular tracking-[0.18em] text-white/90">
                      {revealed ? '0000 0000 0000' : '•••• •••• ••••'} {current.last4}
                    </p>
                    <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">
                      PLACEHOLDER — NON-FUNCTIONAL
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[6.5px] uppercase tracking-[0.2em] text-white/35">CARDHOLDER</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/85">{current.holder}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[6.5px] uppercase tracking-[0.2em] text-white/35">EXPIRES</p>
                      <p className="font-mono text-[10px] tabular text-white/85">{current.expiry}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[6.5px] uppercase tracking-[0.2em] text-white/35">{current.category}</p>
                      <p className="font-display text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: design.accent }}>{current.brand}</p>
                    </div>
                  </div>
                </div>
                {current.status === 'frozen' && (
                  <div className="absolute inset-0 grid place-items-center bg-[#0a1a24]/70 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 border border-[#377eff]/50 bg-[#0e1c36] px-3 py-1.5">
                      <Snowflake size={14} className="text-[#91b6ff]" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91b6ff]">FROZEN</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm flex-1" onClick={() => toggleFreeze(current.id)}>
                  {current.status === 'frozen' ? <Unlock size={11} /> : <Lock size={11} />}
                  {current.status === 'frozen' ? 'Unfreeze' : 'Freeze'} simulation
                </button>
                <button type="button" className={cn('btn btn-sm flex-1', revealed && 'btn-primary')} onClick={() => setRevealed((v) => !v)}>
                  {revealed ? 'Hide' : 'Reveal'} placeholder
                </button>
              </div>

              <KeyValue
                items={[
                  { k: 'Card ID', v: current.id },
                  { k: 'Account', v: current.accountId },
                  { k: 'Category', v: current.category },
                  { k: 'Status', v: current.status.toUpperCase() },
                  { k: 'Spending limit', v: fmtMoney(current.limit) },
                  { k: 'Spent (sim)', v: fmtMoney(current.spent) },
                ]}
              />
              <Progress value={(current.spent / current.limit) * 100} showValue label="Limit utilisation" color={current.spent / current.limit > 0.8 ? 'var(--color-red)' : 'var(--color-green)'} />
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="No cards issued" />
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Issued Cards" icon={Sliders} bodyClassName="p-0" actions={<span className="badge badge-grey">{cards.length}</span>}>
            <div className="max-h-[340px] overflow-y-auto">
              <table className="data-table">
                <thead><tr><th>Card</th><th>Holder</th><th>Type</th><th className="text-right">Limit</th><th>Status</th></tr></thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id} data-selected={c.id === current?.id} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                      <td>
                        <span className="mono text-[10px] text-[var(--accent)]">•••• {c.last4}</span>
                        <span className="block font-mono text-[8.5px] text-ink-3">{c.design.toUpperCase()}</span>
                      </td>
                      <td className="text-[11px] text-ink-2">{c.holder}</td>
                      <td><span className="badge badge-grey">{c.category}</span></td>
                      <td className="mono text-right text-[10px] tabular">{fmtMoney(c.limit, 'USD', true)}</td>
                      <td><StatusPill value={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Program Summary" icon={CreditCard}>
              <KeyValue
                cols={1}
                items={[
                  { k: 'Cards issued', v: String(cards.length) },
                  { k: 'Aggregate limit', v: fmtMoney(stats.limit, 'USD', true) },
                  { k: 'Aggregate spend', v: fmtMoney(stats.spent, 'USD', true) },
                  { k: 'Frozen', v: String(stats.frozen) },
                ]}
              />
            </Panel>
            <Panel title="Safety Posture" icon={ShieldAlert}>
              <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
                <li>• Card numbers are inert placeholders.</li>
                <li>• No CVV, PIN or real details are captured.</li>
                <li>• Freeze/unfreeze is a local display state.</li>
                <li>• Cards cannot transact anywhere.</li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional card program">
        These cards are graphical props for cinematic scenes. They cannot be used for any real purchase, and no genuine
        cardholder information should ever be entered into this demonstration environment.
      </InlineAlert>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Issue Demonstration Card"
        subtitle="Adds a fictional card to the demo program"
        icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!form.holder.trim()}><Plus size={11} /> Issue card</button>
        </>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="card-holder">Fictional cardholder name</label>
            <input id="card-holder" className="field" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} placeholder="e.g. Theo Cipher" />
          </div>
          <Select label="Linked account" value={form.accountId} onChange={(v) => setForm({ ...form, accountId: v })} options={accounts.map((a) => ({ value: a.id, label: `${a.id} · ${a.holder}` }))} />
          <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={['DEBIT', 'CREDIT', 'PREPAID', 'CORPORATE'].map((c) => ({ value: c as Card['category'], label: c }))} />
          <Select label="Artwork" value={form.design} onChange={(v) => setForm({ ...form, design: v })} options={Object.entries(DESIGNS).map(([k, d]) => ({ value: k, label: d.label }))} />
          <div>
            <Slider label="Spending limit" value={form.limit} min={1000} max={100000} step={1000} onChange={(v) => setForm({ ...form, limit: v })} suffix=" USD" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!issued}
        onClose={() => setIssued(null)}
        title="Card issued"
        subtitle="Demonstration programme"
        icon={CreditCard}
        size="sm"
        footer={<>
          <button type="button" className="btn" onClick={() => setIssued(null)}>Done</button>
          <button type="button" className="btn btn-primary" onClick={() => { setIssued(null); setCreateOpen(true) }}><Plus size={11} /> Issue another</button>
        </>}
      >
        {issued && (
          <div className="space-y-3">
            <ConfirmationCard
              tone="success"
              title="Card issued"
              subtitle={`${issued.holder} · ${issued.category}`}
              rows={[
                { label: 'Card', value: `•••• •••• •••• ${issued.last4}`, emphasis: true, mono: true },
                { label: 'Card ID', value: issued.id, mono: true },
                { label: 'Artwork', value: issued.design },
                { label: 'Spending limit', value: fmtMoney(issued.limit, 'USD'), mono: true },
                { label: 'Status', value: 'ACTIVE — DEMO' },
              ]}
              note="Placeholder identifiers only. Nothing was requested from, issued by, or registered with any card network."
            />
            <SimulatedNotice>Demo card · non-functional</SimulatedNotice>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
