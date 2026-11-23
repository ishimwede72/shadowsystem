import { Wallet, Landmark, ArrowLeftRight, Activity } from 'lucide-react'
import { PALETTE } from '@/components/charts'
import { fmtCompact, fmtMoney } from '@/lib/utils'
import { DepartmentReports, type DeptConfig } from './shared'

const cfg: DeptConfig = {
  type: 'financial',
  title: 'Financial Reports',
  eyebrow: 'REPORTS · FINANCIAL',
  subtitle: 'Liquidity, settlement and exposure summaries compiled from the simulated ledger.'
    + ' Every figure comes from generated accounts and transactions.',
  icon: Wallet,
  accent: 'green',
  color: PALETTE.green,
  stats: (s) => {
    const total = s.accounts.reduce((a, x) => a + x.total, 0)
    return [
      { label: 'Accounts', value: s.accounts.length, icon: Landmark, accent: 'cyan' },
      { label: 'Total balance', value: fmtCompact(total), icon: Wallet, accent: 'green' },
      { label: 'Transactions', value: s.transactions.length, icon: ArrowLeftRight, accent: 'blue' },
      { label: 'Pending', value: s.transactions.filter((t) => t.status === 'pending').length, icon: Activity, accent: 'amber' },
    ]
  },
  chart: () => ({
    subtitle: 'Settlement volume across the simulated ledger',
    data: Array.from({ length: 12 }, (_, i) => ({
      t: `D${i + 1}`,
      inflow: 18 + Math.round(Math.abs(Math.sin(i / 2.1)) * 32),
      outflow: 14 + Math.round(Math.abs(Math.cos(i / 2.7)) * 26),
    })),
    keys: [{ key: 'inflow', color: PALETTE.green, label: 'Inflow' }, { key: 'outflow', color: PALETTE.amber, label: 'Outflow' }],
  }),
  breakdown: (s) => [
    { label: 'Banks', value: String(s.banks.length) },
    { label: 'Cards', value: String(s.cards.length) },
    { label: 'Wallets', value: String(s.wallets.length) },
    { label: 'Assets tracked', value: String(s.assets.length) },
    { label: 'Frozen cards', value: String(s.cards.filter((c) => c.status === 'frozen').length) },
    { label: 'Avg balance', value: fmtCompact(s.accounts.reduce((a, x) => a + x.total, 0) / Math.max(1, s.accounts.length)) },
  ],
  build: (s) => {
    const total = s.accounts.reduce((a, x) => a + x.total, 0)
    const pending = s.transactions.filter((t) => t.status === 'pending')
    const largest = [...s.transactions].sort((a, b) => b.amount - a.amount)[0]
    return {
      title: `Financial Position — ${new Date().toISOString().slice(0, 10)}`,
      summary: `${s.accounts.length} simulated accounts hold ${fmtMoney(total)} across ${s.banks.length} fictional institutions. ${pending.length} settlements remain pending in the demo ledger.`,
      analysis: [
        `Largest simulated transaction on record: ${largest ? fmtMoney(largest.amount) : 'n/a'} (${largest?.reference ?? 'none'}).`,
        `${s.cards.filter((c) => c.status === 'frozen').length} cards are frozen in the demonstration data set.`,
        `Average account balance is ${fmtMoney(total / Math.max(1, s.accounts.length))}.`,
        'All values are generated and do not correspond to a real institution or holding.',
      ],
      metrics: [
        { label: 'Accounts', value: String(s.accounts.length) },
        { label: 'Total balance', value: fmtMoney(total) },
        { label: 'Pending settlements', value: String(pending.length) },
        { label: 'Banks', value: String(s.banks.length) },
        { label: 'Wallets', value: String(s.wallets.length) },
      ],
      classification: 'FICTIONAL · INTERNAL',
    }
  },
  notes: [
    'Balances are regenerated each session from a fixed seed.',
    'Settlement status changes only through local actions.',
    'No card network, bank or payment rail is contacted.',
    'Currency figures are illustrative and not real money.',
  ],
}

export default function FinancialReports() {
  return <DepartmentReports cfg={cfg} />
}
