import { useMemo, useState } from 'react'
import { BarChart3, Calendar, Download, Filter, TrendingUp, Wallet } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, Select, KeyValue, InlineAlert, Divider, Progress } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, LineTrend, PALETTE, ChartLegend, HeatStrip, RadarMetric, RadialGauge } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtMoney, fmtCompact, toCSV } from '@/lib/utils'

export default function FinanceAnalytics() {
  const transactions = useEngine((s) => s.transactions)
  const accounts = useEngine((s) => s.accounts)
  const banks = useEngine((s) => s.banks)
  const [range, setRange] = useState('30')
  const [department, setDepartment] = useState('all')

  const filtered = useMemo(() => {
    const cutoff = Date.now() - Number(range) * 86400_000
    let list = transactions.filter((t) => +new Date(t.timestamp) >= cutoff)
    if (department !== 'all') {
      const bankAccountIds = new Set(accounts.filter((a) => a.bankId === department).map((a) => a.id))
      list = list.filter((t) => bankAccountIds.has(t.senderId) || bankAccountIds.has(t.recipientId))
    }
    return list
  }, [transactions, range, department, accounts])

  const volume = filtered.reduce((a, t) => a + t.amount, 0)
  const completed = filtered.filter((t) => t.status === 'completed')
  const declined = filtered.filter((t) => t.status === 'declined')
  const successRate = filtered.length ? (completed.length / filtered.length) * 100 : 0
  const avgTicket = filtered.length ? volume / filtered.length : 0

  const byDay = useMemo(() => {
    const map = new Map<string, { volume: number; count: number }>()
    filtered.forEach((t) => {
      const key = t.timestamp.slice(5, 10)
      const cur = map.get(key) ?? { volume: 0, count: 0 }
      map.set(key, { volume: cur.volume + t.amount, count: cur.count + 1 })
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t, v]) => ({ t, volume: Math.round(v.volume), count: v.count }))
  }, [filtered])

  const byBank = useMemo(
    () =>
      banks.map((b) => {
        const ids = new Set(accounts.filter((a) => a.bankId === b.id).map((a) => a.id))
        const total = filtered.filter((t) => ids.has(t.senderId) || ids.has(t.recipientId)).reduce((a, t) => a + t.amount, 0)
        return { t: b.code, volume: Math.round(total / 1000) }
      }),
    [banks, accounts, filtered],
  )

  const riskRadar = [
    { axis: 'Velocity', value: Math.min(100, filtered.length * 2) },
    { axis: 'Decline rate', value: Math.round((declined.length / Math.max(1, filtered.length)) * 100) },
    { axis: 'Cross-border', value: 62 },
    { axis: 'Concentration', value: 41 },
    { axis: 'Off-hours', value: 27 },
    { axis: 'High value', value: Math.min(100, filtered.filter((t) => t.amount > 200_000).length * 12) },
  ]

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · ANALYTICS"
        title="Financial Analytics"
        subtitle="Derived analytics computed live from the generated demonstration ledger."
        icon={BarChart3}
        meta={<><span className="badge badge-cyan">{range}-DAY RANGE</span><span className="badge badge-grey">{filtered.length} RECORDS IN SCOPE</span></>}
        actions={
          <>
            <Select className="w-32" value={range} onChange={setRange} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: '365', label: 'Last 12 mo' }]} />
            <Select className="w-40" value={department} onChange={setDepartment} options={[{ value: 'all', label: 'All institutions' }, ...banks.map((b) => ({ value: b.id, label: b.code }))]} />
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-analytics-${Date.now()}.csv`, toCSV(filtered.map(({ id, amount, currency, status, channel, timestamp }) => ({ id, amount, currency, status, channel, timestamp }))), 'text/csv')}>
              <Download size={11} /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Volume" value={fmtMoney(volume, 'USD', true)} icon={TrendingUp} accent="green" delta={{ value: 6.2 }} />
        <StatCard label="Transactions" value={filtered.length} icon={Wallet} accent="cyan" />
        <StatCard label="Success rate" value={`${successRate.toFixed(1)}%`} icon={Filter} accent="green" />
        <StatCard label="Decline rate" value={`${((declined.length / Math.max(1, filtered.length)) * 100).toFixed(1)}%`} icon={Filter} accent="red" />
        <StatCard label="Avg ticket" value={fmtMoney(avgTicket, 'USD', true)} icon={Calendar} accent="blue" />
        <StatCard label="Fees (sim)" value={fmtMoney(filtered.reduce((a, t) => a + t.fee, 0), 'USD')} icon={BarChart3} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Volume Trend" icon={TrendingUp} className="xl:col-span-2" subtitle="Daily simulated volume and count">
          <AreaTrend data={byDay} keys={[{ key: 'volume', color: PALETTE.green, label: 'Volume' }]} height={210} />
          <BarsTrend data={byDay} keys={[{ key: 'count', color: PALETTE.cyan, label: 'Count' }]} height={100} />
          <ChartLegend items={[{ label: 'Volume', color: PALETTE.green }, { label: 'Transaction count', color: PALETTE.cyan }]} />
        </Panel>

        <Panel title="Settlement Health" icon={BarChart3}>
          <RadialGauge value={successRate} label="SUCCESS" color={PALETTE.green} />
          <Divider label="STATUS MIX" />
          <div className="space-y-1.5">
            {['completed', 'pending', 'declined', 'cancelled'].map((st) => {
              const count = filtered.filter((t) => t.status === st).length
              return (
                <div key={st}>
                  <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-wider text-ink-3">
                    <span>{st}</span>
                    <span className="text-ink-2">{count}</span>
                  </div>
                  <Progress value={(count / Math.max(1, filtered.length)) * 100} color={st === 'completed' ? PALETTE.green : st === 'declined' ? PALETTE.red : st === 'pending' ? PALETTE.amber : PALETTE.ink} height={3} />
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Volume by Institution" icon={BarChart3} subtitle="Thousands (sim)">
          <BarsTrend data={byBank} keys={[{ key: 'volume', color: PALETTE.blue, label: 'k USD' }]} height={200} horizontal xKey="t" />
        </Panel>
        <Panel title="Risk Surface" icon={Filter} subtitle="Heuristic indicators">
          <RadarMetric data={riskRadar} height={210} color={PALETTE.amber} />
        </Panel>
        <Panel title="Channel Mix" icon={Wallet}>
          <Donut
            data={Array.from(new Set(filtered.map((t) => t.channel))).map((ch, i) => ({
              name: ch,
              value: filtered.filter((t) => t.channel === ch).reduce((a, t) => a + t.amount, 0),
              color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa', '#5eead4'][i % 7],
            }))}
            height={190}
            centerLabel="CHANNELS"
            centerValue={String(new Set(filtered.map((t) => t.channel)).size)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Activity Heat" icon={Calendar} subtitle="Daily intensity across the selected range">
          <HeatStrip data={byDay.map((d) => d.count)} />
          <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3">
            <span>{byDay[0]?.t ?? '—'}</span>
            <span>LOW → HIGH</span>
            <span>{byDay[byDay.length - 1]?.t ?? '—'}</span>
          </div>
          <Divider />
          <KeyValue
            items={[
              { k: 'Peak day volume', v: fmtCompact(Math.max(...byDay.map((d) => d.volume), 0)) },
              { k: 'Peak day count', v: String(Math.max(...byDay.map((d) => d.count), 0)) },
              { k: 'Active days', v: String(byDay.filter((d) => d.count > 0).length) },
              { k: 'Mean count', v: (byDay.reduce((a, d) => a + d.count, 0) / Math.max(1, byDay.length)).toFixed(1) },
            ]}
          />
        </Panel>

        <Panel title="Comparative Analysis" icon={TrendingUp} subtitle="Completed vs declined over time">
          <LineTrend
            data={byDay.map((d) => ({
              t: d.t,
              completed: completed.filter((t) => t.timestamp.slice(5, 10) === d.t).length,
              declined: declined.filter((t) => t.timestamp.slice(5, 10) === d.t).length,
            }))}
            keys={[
              { key: 'completed', color: PALETTE.green, label: 'Completed' },
              { key: 'declined', color: PALETTE.red, label: 'Declined' },
            ]}
            height={200}
          />
          <ChartLegend items={[{ label: 'Completed', color: PALETTE.green }, { label: 'Declined', color: PALETTE.red }]} />
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Derived analytics">
        All analytics are computed in-memory from generated records. No external market data, benchmarks or financial
        reporting services are queried.
      </InlineAlert>
    </Screen>
  )
}
