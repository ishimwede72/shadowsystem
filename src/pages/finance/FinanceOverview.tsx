import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight, ArrowUpRight, Banknote, Building2, CreditCard, Landmark,
  PiggyBank, Receipt, TrendingDown, TrendingUp, Wallet, ArrowRightLeft, CircleDollarSign,
} from 'lucide-react'
import { Panel, PageHeader, StatCard, Screen, StatusPill, Progress, KeyValue, InlineAlert, Divider } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, PALETTE, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtMoney, fmtCompact, relTime, fmtDateTime } from '@/lib/utils'

export default function FinanceOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const totalFunds = s.accounts.reduce((a, acc) => a + acc.total, 0)
  const available = s.accounts.reduce((a, acc) => a + acc.available, 0)
  const pending = s.transactions.filter((t) => t.status === 'pending')
  const completed = s.transactions.filter((t) => t.status === 'completed')
  const declined = s.transactions.filter((t) => t.status === 'declined')
  const volume = s.transactions.reduce((a, t) => a + t.amount, 0)

  const monthly = useMemo(
    () =>
      ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m, i) => ({
        t: m,
        inflow: Math.round(180_000 + Math.sin(i / 1.6) * 62_000 + (volume % 40_000)),
        outflow: Math.round(140_000 + Math.cos(i / 1.9) * 48_000),
      })),
    [volume],
  )

  const daily = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        t: `D${i + 1}`,
        volume: Math.round(40_000 + Math.sin(i / 1.3) * 26_000 + (i % 4) * 8_000),
        count: 6 + (i % 7) + Math.round(Math.sin(i) * 3),
      })),
    [],
  )

  const byChannel = useMemo(() => {
    const map = new Map<string, number>()
    s.transactions.forEach((t) => map.set(t.channel, (map.get(t.channel) ?? 0) + t.amount))
    const colors = [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa', '#5eead4']
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [s.transactions])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    s.accounts.forEach((a) => map.set(a.category, (map.get(a.category) ?? 0) + a.total))
    const colors = [PALETTE.cyan, PALETTE.blue, PALETTE.green, PALETTE.amber, '#a78bfa']
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [s.accounts])

  const topAccounts = [...s.accounts].sort((a, b) => b.total - a.total).slice(0, 6)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · CLOSED-LOOP SIMULATION"
        title="Financial Overview"
        subtitle="A premium fictional banking environment. Every balance, institution and transaction is generated for cinematic demonstration."
        icon={Wallet}
        meta={
          <>
            <span className="badge badge-green"><span className="dot bg-green" /> LEDGER SYNCED</span>
            <span className="badge badge-grey">{s.banks.length} INSTITUTIONS</span>
            <span className="badge badge-grey">{s.accounts.length} ACCOUNTS</span>
            <span className="badge badge-cyan">{s.transactions.length} TRANSACTIONS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/finance/transfers')}><ArrowRightLeft size={11} /> New transfer</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/finance/analytics')}><TrendingUp size={11} /> Analytics</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Fictional Funds" value={fmtMoney(totalFunds, 'USD', true)} delta={{ value: 4.8 }} icon={Landmark} accent="green" sub={`${s.accounts.length} accounts`} spark={daily.map((d) => d.volume)} />
        <StatCard label="Available Balance" value={fmtMoney(available, 'USD', true)} icon={PiggyBank} accent="cyan" sub="liquidity (sim)" />
        <StatCard label="Pending" value={pending.length} icon={Receipt} accent="amber" sub={fmtMoney(pending.reduce((a, t) => a + t.amount, 0), 'USD', true)} onClick={() => navigate('/finance/transactions?status=pending')} />
        <StatCard label="Completed" value={completed.length} icon={CircleDollarSign} accent="green" sub="settled in demo ledger" onClick={() => navigate('/finance/transactions?status=completed')} />
        <StatCard label="Declined" value={declined.length} icon={TrendingDown} accent="red" sub="simulated rejections" onClick={() => navigate('/finance/transactions?status=declined')} />
        <StatCard label="Institutions" value={s.banks.length} icon={Building2} accent="blue" sub={`${s.cards.length} cards issued`} onClick={() => navigate('/finance/banks')} />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel
          title="Monthly Transaction Activity"
          icon={TrendingUp}
          subtitle="Simulated inflow vs. outflow"
          className="xl:col-span-2"
          actions={<span className="badge badge-grey">ROLLING 12 MONTHS</span>}
        >
          <AreaTrend
            data={monthly}
            keys={[
              { key: 'inflow', color: PALETTE.green, label: 'Inflow' },
              { key: 'outflow', color: PALETTE.red, label: 'Outflow' },
            ]}
            height={230}
          />
          <div className="mt-1 flex items-center justify-between">
            <ChartLegend items={[{ label: 'Inflow', color: PALETTE.green }, { label: 'Outflow', color: PALETTE.red }]} />
            <span className="mono text-[10px] text-ink-3">NET {fmtMoney(monthly.reduce((a, m) => a + m.inflow - m.outflow, 0), 'USD', true)}</span>
          </div>
        </Panel>

        <Panel title="Channel Distribution" icon={ArrowRightLeft} subtitle="Volume by simulated payment rail">
          <Donut data={byChannel} height={190} centerLabel="VOLUME" centerValue={fmtCompact(volume)} />
          <ul className="mt-1 space-y-1">
            {byChannel.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-ink-2">
                  <span className="h-1.5 w-1.5" style={{ background: c.color }} /> {c.name}
                </span>
                <span className="mono text-[9.5px] tabular text-ink-3">{fmtCompact(c.value)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Daily Transaction Volume" icon={Receipt} subtitle="14-day simulated throughput" className="xl:col-span-2">
          <BarsTrend data={daily} keys={[{ key: 'volume', color: PALETTE.cyan, label: 'Volume' }]} height={180} />
          <div className="mt-1 grid grid-cols-3 gap-2 border-t border-line-soft pt-2">
            <div><p className="label-xs">AVG / DAY</p><p className="mono mt-0.5 text-[12px] tabular text-ink">{fmtCompact(daily.reduce((a, d) => a + d.volume, 0) / daily.length)}</p></div>
            <div><p className="label-xs">PEAK</p><p className="mono mt-0.5 text-[12px] tabular text-ink">{fmtCompact(Math.max(...daily.map((d) => d.volume)))}</p></div>
            <div><p className="label-xs">TXNS / DAY</p><p className="mono mt-0.5 text-[12px] tabular text-ink">{(daily.reduce((a, d) => a + d.count, 0) / daily.length).toFixed(1)}</p></div>
          </div>
        </Panel>

        <Panel title="Account Composition" icon={PiggyBank} subtitle="Fictional balances by category">
          <Donut data={byCategory} height={170} centerLabel="ACCOUNTS" centerValue={String(s.accounts.length)} />
          <div className="mt-1 space-y-1">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-ink-2">{c.name}</span>
                <span className="mono text-[9.5px] tabular text-ink-3">{fmtMoney(c.value, 'USD', true)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Largest Fictional Accounts" icon={Landmark} className="xl:col-span-2" actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/finance/accounts')}>All accounts <ArrowUpRight size={10} /></button>} bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Account</th><th>Holder</th><th>Category</th><th className="text-right">Total</th><th>Status</th></tr></thead>
            <tbody>
              {topAccounts.map((a) => {
                const bank = s.banks.find((b) => b.id === a.bankId)
                return (
                  <tr key={a.id} className="cursor-pointer" onClick={() => navigate(`/finance/accounts?q=${a.id}`)}>
                    <td>
                      <span className="mono text-[10px] text-[var(--accent)]">{a.id}</span>
                      <span className="block text-[9.5px] text-ink-3">{bank?.name}</span>
                    </td>
                    <td className="text-ink">{a.holder}</td>
                    <td><span className="badge badge-grey">{a.category}</span></td>
                    <td className="mono text-right tabular text-ink">{fmtMoney(a.total, a.currency)}</td>
                    <td><StatusPill value={a.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Recent Ledger Activity" icon={Receipt} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/finance/transactions')}>Open <ArrowUpRight size={10} /></button>} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {s.transactions.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-sm', t.type === 'incoming' ? 'bg-[#0a2a20] text-green' : 'bg-[#2a1016] text-red')}>
                  {t.type === 'incoming' ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] text-ink">{t.type === 'incoming' ? t.sender : t.recipient}</span>
                  <span className="block font-mono text-[9px] text-ink-3">{t.channel} · {relTime(t.timestamp)}</span>
                </span>
                <span className="text-right">
                  <span className={cn('mono block text-[10.5px] tabular', t.type === 'incoming' ? 'text-green' : 'text-ink')}>
                    {t.type === 'incoming' ? '+' : '−'}{fmtMoney(t.amount, t.currency, true)}
                  </span>
                  <StatusPill value={t.status} dot={false} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Institution Health" icon={Building2} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/finance/banks')}>Institutions <ArrowUpRight size={10} /></button>}>
          <ul className="space-y-2">
            {s.banks.map((b) => (
              <li key={b.id}>
                <div className="flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm border border-line bg-elevated font-mono text-[8px] text-ink-2">{b.logoMark}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] text-ink">{b.name}</span>
                      <span className="block font-mono text-[9px] text-ink-3">{b.code} · {b.country} · {b.currency}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="mono text-[10px] tabular text-ink-2">{fmtMoney(b.volume, b.currency, true)}</span>
                    <StatusPill value={b.status} dot={false} />
                  </span>
                </div>
                <Progress value={(b.volume / 480_000_000) * 100} color={PALETTE.green} height={2} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Ledger Signals" icon={TrendingUp} subtitle="Derived purely from generated records">
          <KeyValue
            items={[
              { k: 'Largest transaction', v: fmtMoney(Math.max(...s.transactions.map((t) => t.amount)), 'USD') },
              { k: 'Median transaction', v: fmtMoney([...s.transactions.map((t) => t.amount)].sort((a, b) => a - b)[Math.floor(s.transactions.length / 2)] ?? 0, 'USD') },
              { k: 'Aggregate volume', v: fmtMoney(volume, 'USD', true) },
              { k: 'Fees collected (sim)', v: fmtMoney(s.transactions.reduce((a, t) => a + t.fee, 0), 'USD') },
              { k: 'Last simulated event', v: fmtDateTime(s.transactions[0]?.timestamp ?? Date.now()) },
              { k: 'Cards issued', v: String(s.cards.length) },
              { k: 'Crypto wallets', v: String(s.wallets.length) },
              { k: 'Crypto notional', v: fmtMoney(s.wallets.reduce((a, w) => a + w.balanceUsd, 0), 'USD', true) },
            ]}
          />
          <Divider label="MOST RECENT LARGE TXN" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={13} className="text-[var(--accent)]" />
              <span className="mono text-[10px] text-ink">{s.transactions[0]?.reference}</span>
            </div>
            <span className="mono text-[11px] tabular text-ink">{fmtMoney(s.transactions[0]?.amount ?? 0, s.transactions[0]?.currency ?? 'USD')}</span>
          </div>
          <button type="button" className="btn btn-sm mt-2 w-full" onClick={() => navigate('/finance/transfers')}>
            <Banknote size={11} /> Open transfer simulator
          </button>
        </Panel>
      </div>

      <InlineAlert tone="green" title="Closed demonstration ledger">
        All funds shown are simulated. Transfers update only the internal demo ledger — SHADOW SYSTEMS has no connection to
        any payment network, bank or settlement system.
      </InlineAlert>
    </Screen>
  )
}
