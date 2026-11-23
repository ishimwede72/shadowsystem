import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Banknote, Building2, Download, Plus, Search, Wallet } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Modal, Select, EmptyState, KeyValue, InlineAlert, Progress } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtMoney, toCSV } from '@/lib/utils'
import type { Account } from '@/types'

export default function Accounts() {
  const [params] = useSearchParams()
  const accounts = useEngine((s) => s.accounts)
  const banks = useEngine((s) => s.banks)
  const transactions = useEngine((s) => s.transactions)
  const addAccount = useEngine((s) => s.addAccount)
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState('all')
  const [bank, setBank] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState({ holder: '', bankId: banks[0]?.id ?? '', category: 'PERSONAL' as Account['category'], initial: '25000' })

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return accounts.filter((a) => {
      if (t && !`${a.id} ${a.holder} ${a.iban}`.toLowerCase().includes(t)) return false
      if (cat !== 'all' && a.category !== cat) return false
      if (bank !== 'all' && a.bankId !== bank) return false
      return true
    })
  }, [accounts, q, cat, bank])

  const current = accounts.find((a) => a.id === selected)
  const currentTx = current ? transactions.filter((t) => t.senderId === current.id || t.recipientId === current.id) : []

  const submit = () => {
    if (!form.holder.trim()) return
    const b = banks.find((x) => x.id === form.bankId)!
    const initial = Number(form.initial) || 0
    const acc = addAccount({
      holder: form.holder,
      bankId: form.bankId,
      category: form.category,
      currency: b.currency,
      available: initial,
      total: initial,
      status: 'active',
      iban: `${b.countryCode}${Math.random().toString(36).slice(2, 6).toUpperCase()} ${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      opened: new Date().toISOString(),
    })
    setSelected(acc.id)
    setCreateOpen(false)
    setForm({ ...form, holder: '', initial: '25000' })
  }

  const totals = {
    total: accounts.reduce((a, x) => a + x.total, 0),
    available: accounts.reduce((a, x) => a + x.available, 0),
    avg: accounts.reduce((a, x) => a + x.total, 0) / (accounts.length || 1),
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · ACCOUNTS"
        title="Account Management"
        subtitle="Generated fictional accounts across the simulated institutional network."
        icon={Wallet}
        meta={
          <>
            <span className="badge badge-green">{fmtMoney(totals.total, 'USD', true)} AGGREGATE</span>
            <span className="badge badge-cyan">{accounts.length} ACCOUNTS</span>
            <span className="badge badge-grey">AVG {fmtMoney(totals.avg, 'USD', true)}</span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadFile(`shadow-accounts-${Date.now()}.csv`, toCSV(filtered.map(({ id, holder, category, currency, available, total, status, iban }) => ({ id, holder, category, currency, available, total, status, iban }))), 'text/csv')}
            >
              <Download size={11} /> Export CSV
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}><Plus size={11} /> Open account</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Account Registry"
          icon={Building2}
          bodyClassName="p-0"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search holder, IBAN…" className="field h-7 w-40 pl-7 text-[11px]" />
              </div>
              <Select className="w-32" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All types' }, ...['PERSONAL', 'BUSINESS', 'CORPORATE', 'SAVINGS', 'INTERNATIONAL'].map((c) => ({ value: c, label: c }))]} />
            </div>
          }
        >
          <div className="max-h-[62vh] overflow-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr><th>Account</th><th>Holder</th><th>Institution</th><th>Type</th><th className="text-right">Available</th><th className="text-right">Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const b = banks.find((x) => x.id === a.bankId)
                  return (
                    <tr key={a.id} data-selected={selected === a.id} className="cursor-pointer" onClick={() => setSelected(a.id)}>
                      <td>
                        <span className="mono text-[10px] text-[var(--accent)]">{a.id}</span>
                        <span className="block font-mono text-[9px] text-ink-3">{a.currency} · {a.iban}</span>
                      </td>
                      <td className="text-ink">{a.holder}</td>
                      <td className="max-w-[140px] truncate text-[10.5px]">{b?.name}</td>
                      <td><span className="badge badge-grey">{a.category}</span></td>
                      <td className="mono text-right text-[10.5px] tabular">{fmtMoney(a.available, a.currency, true)}</td>
                      <td className="mono text-right text-[10.5px] tabular text-ink">{fmtMoney(a.total, a.currency, true)}</td>
                      <td><StatusPill value={a.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Wallet} title="No accounts match" message="Clear filters or create a new fictional account." />}
          </div>
          <div className="flex items-center justify-between border-t border-line bg-[#0d151d] px-2.5 py-1.5">
            <span className="mono text-[9.5px] text-ink-3">{filtered.length} of {accounts.length} records</span>
            <div className="flex gap-1">
              <Select className="w-40" value={bank} onChange={setBank} options={[{ value: 'all', label: 'All institutions' }, ...banks.map((b) => ({ value: b.id, label: b.code }))]} />
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          {current ? (
            <>
              <Panel title="Account Detail" icon={Wallet} subtitle={current.id} actions={<StatusPill value={current.status} />}>
                <div className="mb-3 flex items-baseline justify-between">
                  <div>
                    <p className="label-xs">TOTAL BALANCE (SIM)</p>
                    <p className="stat-value mt-0.5 text-2xl text-green">{fmtMoney(current.total, current.currency)}</p>
                  </div>
                  <span className="badge badge-grey">{current.category}</span>
                </div>
                <KeyValue
                  items={[
                    { k: 'Holder', v: current.holder },
                    { k: 'Institution', v: banks.find((b) => b.id === current.bankId)?.name ?? '—' },
                    { k: 'IBAN (sim)', v: current.iban },
                    { k: 'Currency', v: current.currency },
                    { k: 'Available', v: fmtMoney(current.available, current.currency) },
                    { k: 'Opened', v: new Date(current.opened).toISOString().slice(0, 10) },
                  ]}
                />
                <div className="mt-3">
                  <p className="label-xs mb-1">Utilisation</p>
                  <Progress value={(current.available / current.total) * 100} showValue label="Available vs. total" color="var(--color-green)" />
                </div>
              </Panel>
              <Panel title="Transaction Activity" icon={Banknote} bodyClassName="p-0" actions={<span className="badge badge-grey">{currentTx.length}</span>}>
                <ul className="max-h-[300px] divide-y divide-line-soft overflow-y-auto">
                  {currentTx.slice(0, 12).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[10.5px] text-ink-2">
                          {t.senderId === current.id ? `→ ${t.recipient}` : `← ${t.sender}`}
                        </span>
                        <span className="block font-mono text-[9px] text-ink-3">{t.channel} · {new Date(t.timestamp).toISOString().slice(5, 16).replace('T', ' ')}</span>
                      </span>
                      <span className="text-right">
                        <span className={cn('mono block text-[10px] tabular', t.senderId === current.id ? 'text-red' : 'text-green')}>
                          {t.senderId === current.id ? '−' : '+'}{fmtMoney(t.amount, t.currency, true)}
                        </span>
                        <StatusPill value={t.status} dot={false} />
                      </span>
                    </li>
                  ))}
                  {currentTx.length === 0 && <li className="p-3 text-[10.5px] text-ink-3">No simulated transactions on this account yet.</li>}
                </ul>
              </Panel>
            </>
          ) : (
            <Panel title="Account Detail" icon={Wallet}>
              <EmptyState icon={Wallet} title="Select an account" message="Choose any row in the registry to inspect balances and activity." />
            </Panel>
          )}
        </div>
      </div>

      <InlineAlert tone="green" title="Balances are fictional">
        Every number on this page is generated. Balances, IBAN-style identifiers and holders are synthetic demonstration
        data and cannot be used outside this environment.
      </InlineAlert>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Open Fictional Account"
        subtitle="Creates an account inside the demo ledger"
        icon={Plus}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={!form.holder.trim()}><Plus size={11} /> Create account</button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="acct-holder">Fictional holder name</label>
            <input id="acct-holder" className="field" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} placeholder="e.g. Amara Delacroix" />
          </div>
          <Select label="Institution" value={form.bankId} onChange={(v) => setForm({ ...form, bankId: v })} options={banks.map((b) => ({ value: b.id, label: `${b.code} — ${b.name}` }))} />
          <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={['PERSONAL', 'BUSINESS', 'CORPORATE', 'SAVINGS', 'INTERNATIONAL'].map((c) => ({ value: c as Account['category'], label: c }))} />
          <div>
            <label className="field-label" htmlFor="acct-initial">Initial simulated balance</label>
            <input id="acct-initial" type="number" className="field" value={form.initial} onChange={(e) => setForm({ ...form, initial: e.target.value })} />
          </div>
          <div className="flex items-end">
            <p className="mono text-[9.5px] text-ink-3">Currency is inherited from the selected institution.</p>
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
