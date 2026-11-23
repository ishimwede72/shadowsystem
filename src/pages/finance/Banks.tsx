import { useMemo, useState } from 'react'
import { Building2, Globe2, Plus, Search, ShieldCheck, TrendingUp } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, Modal, Select, InlineAlert, EmptyState, Progress } from '@/components/ui'
import { BarsTrend, PALETTE, Donut } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { CITIES } from '@/data/vocabulary'
import { cn, fmtMoney } from '@/lib/utils'
import type { Bank } from '@/types'

export default function Banks() {
  const banks = useEngine((s) => s.banks)
  const accounts = useEngine((s) => s.accounts)
  const addBank = useEngine((s) => s.addBank)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string | null>(banks[0]?.id ?? null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', country: 'Switzerland', currency: 'CHF', tier: 'TIER 2' as Bank['tier'], status: 'active' as Bank['status'] })

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return banks.filter((b) => !t || `${b.name} ${b.code} ${b.country} ${b.swift}`.toLowerCase().includes(t))
  }, [banks, q])

  const current = banks.find((b) => b.id === selected) ?? banks[0]
  const currentAccounts = accounts.filter((a) => a.bankId === current?.id)

  const volumeSeries = useMemo(
    () => banks.map((b) => ({ t: b.code, volume: Math.round(b.volume / 1_000_000) })),
    [banks],
  )

  const submit = () => {
    if (!form.name.trim()) return
    const city = CITIES.find((c) => c.country === form.country) ?? CITIES[0]
    const newBank = addBank({
      name: form.name,
      code: form.name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase(),
      country: form.country,
      countryCode: city.cc,
      currency: form.currency,
      swift: `${form.name.slice(0, 3).toUpperCase()}XX${city.cc}`,
      logoMark: form.name.slice(0, 2).toUpperCase(),
      status: form.status,
      accountCount: 0,
      volume: 0,
      tier: form.tier,
    })
    setSelected(newBank.id)
    setCreateOpen(false)
    setForm({ name: '', country: 'Switzerland', currency: 'CHF', tier: 'TIER 2', status: 'active' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · INSTITUTIONS"
        title="Fictional Banking Institutions"
        subtitle="Invented financial institutions used to populate the simulation ledger. None reference real providers."
        icon={Building2}
        meta={<span className="badge badge-grey">{banks.length} REGISTERED · {accounts.length} LINKED ACCOUNTS</span>}
        actions={
          <>
            <button type="button" className="btn btn-sm"><Globe2 size={11} /> Regions</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}><Plus size={11} /> Register institution</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Institution Registry"
          icon={Building2}
          bodyClassName="p-0"
          actions={
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search institutions…" className="field h-7 w-44 pl-7 text-[11px]" />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="data-table min-w-[640px]">
              <thead>
                <tr><th>Institution</th><th>Code</th><th>Country</th><th>Currency</th><th className="text-right">Volume</th><th>Tier</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} data-selected={b.id === current?.id} onClick={() => setSelected(b.id)} className="cursor-pointer">
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-sm border border-line bg-elevated font-mono text-[9px] text-[var(--accent)]">{b.logoMark}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-ink">{b.name}</span>
                          <span className="block font-mono text-[9px] text-ink-3">{b.id} · SWIFT {b.swift}</span>
                        </span>
                      </span>
                    </td>
                    <td className="mono text-[10px] text-ink-2">{b.code}</td>
                    <td className="text-[11px]">{b.country}</td>
                    <td className="mono text-[10px] text-ink-2">{b.currency}</td>
                    <td className="mono text-right text-[10.5px] tabular text-ink">{fmtMoney(b.volume, b.currency, true)}</td>
                    <td><span className="badge badge-grey">{b.tier}</span></td>
                    <td><StatusPill value={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Building2} title="No institution matched" message="Try a different name, code or country." />}
          </div>
        </Panel>

        {current && (
          <Panel title={current.name} subtitle={`${current.id} · ${current.tier}`} icon={ShieldCheck}
            actions={<StatusPill value={current.status} />}
          >
            <KeyValue
              items={[
                { k: 'Institution code', v: current.code },
                { k: 'SWIFT / BIC', v: current.swift },
                { k: 'Country', v: current.country },
                { k: 'Base currency', v: current.currency },
                { k: 'Accounts', v: currentAccounts.length },
                { k: 'Volume (sim)', v: fmtMoney(current.volume, current.currency, true) },
              ]}
            />
            <div className="mt-3">
              <p className="label-xs mb-1">Institution volume vs. peers</p>
              <BarsTrend data={volumeSeries} keys={[{ key: 'volume', color: PALETTE.green, label: 'Volume (M)' }]} height={120} xKey="t" />
            </div>
            <div className="mt-2">
              <p className="label-xs mb-1.5">Linked fictional accounts</p>
              <ul className="space-y-1">
                {currentAccounts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between border-b border-line-soft/60 pb-1">
                    <span className="min-w-0">
                      <span className="mono block text-[10px] text-ink">{a.id}</span>
                      <span className="block truncate text-[9.5px] text-ink-3">{a.holder}</span>
                    </span>
                    <span className="mono text-[10px] tabular text-ink-2">{fmtMoney(a.total, a.currency, true)}</span>
                  </li>
                ))}
                {currentAccounts.length === 0 && <li className="text-[10.5px] text-ink-3">No accounts linked yet.</li>}
              </ul>
            </div>
          </Panel>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Volume Distribution" icon={TrendingUp} subtitle="Share of simulated institutional volume">
          <Donut
            data={banks.map((b, i) => ({ name: b.code, value: b.volume, color: [PALETTE.green, PALETTE.cyan, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
            height={200}
            centerLabel="TOTAL"
            centerValue={fmtMoney(banks.reduce((a, b) => a + b.volume, 0), 'USD', true)}
          />
          <div className="mt-1 grid grid-cols-3 gap-1">
            {banks.map((b, i) => (
              <span key={b.id} className="flex items-center gap-1 font-mono text-[9px] uppercase text-ink-3">
                <span className="h-1.5 w-1.5" style={{ background: [PALETTE.green, PALETTE.cyan, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }} />
                {b.code}
              </span>
            ))}
          </div>
        </Panel>

        <Panel title="Account Concentration" icon={Building2} subtitle="Accounts per institution">
          <ul className="space-y-2.5">
            {banks.map((b) => {
              const count = accounts.filter((a) => a.bankId === b.id).length
              return (
                <li key={b.id}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-2">{b.name}</span>
                    <span className="mono text-[10px] text-ink-3">{count} accounts</span>
                  </div>
                  <Progress value={(count / Math.max(1, accounts.length)) * 100} color={PALETTE.cyan} height={3} />
                </li>
              )
            })}
          </ul>
          <InlineAlert tone="cyan" title="Invented institutions">
            Names, SWIFT-style codes and identifiers are synthetic. Any resemblance to a real institution is coincidental and
            unintentional.
          </InlineAlert>
        </Panel>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register Fictional Institution"
        subtitle="Adds a new simulated bank to the demo ledger"
        icon={Plus}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={!form.name.trim()}>
              <Plus size={11} /> Register institution
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="bank-name">Institution name</label>
            <input id="bank-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Solstice Maritime Bank" />
          </div>
          <Select label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} options={Array.from(new Set(CITIES.map((c) => c.country))).map((c) => ({ value: c, label: c }))} />
          <Select label="Base currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} options={['USD', 'EUR', 'GBP', 'CHF', 'SGD', 'AED', 'JPY'].map((c) => ({ value: c, label: c }))} />
          <Select label="Tier" value={form.tier} onChange={(v) => setForm({ ...form, tier: v })} options={['TIER 1', 'TIER 2', 'TIER 3'].map((t) => ({ value: t, label: t })) as { value: Bank['tier']; label: string }[]} />
          <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }, { value: 'suspended', label: 'Suspended' }] as { value: Bank['status']; label: string }[]} />
        </div>
        <div className={cn('mt-3 border border-line-soft p-2.5')}>
          <p className="label-xs mb-1">Preview</p>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-sm border border-line bg-elevated font-mono text-[10px] text-[var(--accent)]">
              {form.name ? form.name.slice(0, 2).toUpperCase() : 'XX'}
            </span>
            <div>
              <p className="text-[12px] text-ink">{form.name || 'Unnamed Institution'}</p>
              <p className="font-mono text-[9px] text-ink-3">{form.country} · {form.currency} · {form.tier}</p>
            </div>
          </div>
        </div>
        <p className="mt-2 font-mono text-[9px] text-ink-3">Institutions are fictional and stored only in this browser session.</p>
      </Modal>
    </Screen>
  )
}
