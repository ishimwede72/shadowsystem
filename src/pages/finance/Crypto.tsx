import { useMemo, useState } from 'react'
import { ArrowDownUp, Bitcoin, Eye, EyeOff, LineChart, RefreshCw, Star, TrendingUp, Wallet } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, Select, InlineAlert, Divider, Progress, Modal, ConfirmationCard, SimulatedNotice } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, PALETTE } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { Sparkline as UISparkline } from '@/components/ui'
import { cn, fmtDateTime, fmtMoney, fmtNum } from '@/lib/utils'

export default function Crypto() {
  const assets = useEngine((s) => s.assets)
  const swapAssets = useEngine((s) => s.swapAssets)
  const [watchlist, setWatchlist] = useState<string[]>(['BTC', 'ETH'])
  const [from, setFrom] = useState('BTC')
  const [to, setTo] = useState('ETH')
  const [amount, setAmount] = useState('0.25')
  const [hideBalances, setHideBalances] = useState(false)

  const fromAsset = assets.find((a) => a.symbol === from)
  const toAsset = assets.find((a) => a.symbol === to)
  const notional = Number(amount || 0) * (fromAsset?.price ?? 0)
  const result = toAsset && toAsset.price > 0 ? notional / toAsset.price : 0

  const totalPortfolio = assets.reduce((a, x) => a + x.holding * x.price, 0)

  const performance = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        t: `D${i + 1}`,
        portfolio: Math.round(totalPortfolio * (0.82 + Math.sin(i / 3.4) * 0.07 + i * 0.006)),
        benchmark: Math.round(totalPortfolio * (0.85 + Math.cos(i / 4.1) * 0.05 + i * 0.004)),
      })),
    [totalPortfolio],
  )

  const pnl = performance[performance.length - 1]?.portfolio - performance[0]?.portfolio

  const [swapDone, setSwapDone] = useState<{ id: string; from: string; to: string; sold: number; bought: number; notional: number } | null>(null)

  const executeSwap = () => {
    if (!fromAsset || !toAsset || Number(amount) <= 0 || Number(amount) > fromAsset.holding) return
    const snapshot = { id: `SWP-${String(Math.floor(Math.random() * 900000) + 100000)}`, from, to, sold: Number(amount), bought: result, notional }
    swapAssets(from, to, Number(amount), result)
    setSwapDone(snapshot)
    setAmount('0.25')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · DIGITAL ASSETS"
        title="Cryptocurrency Simulator"
        subtitle="Simulated market data and portfolio positions. No cryptocurrency is purchased, held, transferred or traded."
        icon={Bitcoin}
        meta={
          <>
            <span className="badge badge-green">SIMULATED MARKET FEED</span>
            <span className="badge badge-grey">{assets.length} DEMO ASSETS</span>
            <span className="badge badge-amber">NO REAL CUSTODY</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setHideBalances((v) => !v)}>
              {hideBalances ? <Eye size={11} /> : <EyeOff size={11} />} {hideBalances ? 'Show' : 'Hide'} balances
            </button>
            <button type="button" className="btn btn-sm"><RefreshCw size={11} /> Resync feed</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Market Overview" icon={LineChart} subtitle="Demonstration prices with 24h movement" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr><th>Asset</th><th className="text-right">Simulated price</th><th className="text-right">24h</th><th>7d trend</th><th className="text-right">Holding</th><th className="text-right">Value</th><th>Alloc</th><th>Watch</th></tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-sm border border-line bg-elevated font-mono text-[8px] text-[var(--accent)]">{a.symbol.slice(0, 2)}</span>
                        <span>
                          <span className="block font-mono text-[10.5px] text-ink">{a.symbol}</span>
                          <span className="block text-[9px] text-ink-3">{a.name}</span>
                        </span>
                      </span>
                    </td>
                    <td className="mono text-right text-[11px] tabular text-ink">{hideBalances ? '••••' : fmtMoney(a.price)}</td>
                    <td className={cn('mono text-right text-[10.5px]', a.change24h >= 0 ? 'text-green' : 'text-red')}>
                      {a.change24h >= 0 ? '▲' : '▼'} {Math.abs(a.change24h).toFixed(2)}%
                    </td>
                    <td className="w-24"><UISparkline data={a.spark} color={a.change24h >= 0 ? PALETTE.green : PALETTE.red} height={22} /></td>
                    <td className="mono text-right text-[10.5px] tabular">{hideBalances ? '••••' : `${a.holding} ${a.symbol}`}</td>
                    <td className="mono text-right text-[10.5px] tabular text-ink">{hideBalances ? '••••' : fmtMoney(a.holding * a.price, 'USD', true)}</td>
                    <td className="w-16"><Progress value={a.allocation} color={PALETTE.cyan} height={3} /></td>
                    <td>
                      <button type="button" onClick={() => setWatchlist((w) => w.includes(a.symbol) ? w.filter((x) => x !== a.symbol) : [...w, a.symbol])} className="icon-btn !h-6 !w-6" aria-label="Toggle watchlist">
                        <Star size={11} className={watchlist.includes(a.symbol) ? 'fill-amber text-amber' : 'text-ink-3'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Portfolio" icon={Wallet}>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="label-xs">TOTAL NOTIONAL</p>
                <p className="stat-value text-2xl text-ink">{hideBalances ? '••••••' : fmtMoney(totalPortfolio)}</p>
              </div>
              <span className={cn('mono text-[11px]', pnl >= 0 ? 'text-green' : 'text-red')}>
                {pnl >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(pnl), 'USD', true)} 30d
              </span>
            </div>
            <Donut
              data={assets.map((a, i) => ({ name: a.symbol, value: a.holding * a.price, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
              height={170}
              centerLabel="ASSETS"
              centerValue={String(assets.length)}
            />
            <div className="grid grid-cols-3 gap-1">
              {assets.map((a, i) => (
                <span key={a.id} className="flex items-center gap-1 font-mono text-[8.5px] uppercase text-ink-3">
                  <span className="h-1.5 w-1.5" style={{ background: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }} />
                  {a.symbol} {a.allocation.toFixed(0)}%
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Swap Simulator" icon={ArrowDownUp} subtitle="Local demonstration only">
            <div className="space-y-2">
              <Select label="From" value={from} onChange={setFrom} options={assets.map((a) => ({ value: a.symbol, label: `${a.symbol} · ${fmtMoney(a.price)}` }))} />
              <div>
                <label className="field-label" htmlFor="swap-amount">Amount</label>
                <input id="swap-amount" type="number" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <Select label="To" value={to} onChange={setTo} options={assets.filter((a) => a.symbol !== from).map((a) => ({ value: a.symbol, label: `${a.symbol} · ${fmtMoney(a.price)}` }))} />
              <div className="border border-line bg-bg p-2">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-ink-3">YOU RECEIVE</span>
                  <span className="text-green">{result.toFixed(6)} {to}</span>
                </div>
                <div className="mt-0.5 flex justify-between font-mono text-[9px]">
                  <span className="text-ink-3">NOTIONAL</span>
                  <span className="text-ink-2">{fmtMoney(notional)}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={executeSwap}
                disabled={!fromAsset || Number(amount) <= 0 || Number(amount) > (fromAsset?.holding ?? 0)}
              >
                <ArrowDownUp size={12} /> Execute simulated swap
              </button>
              <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
                Updates local demo holdings only. No chain transaction is created.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Performance vs. Benchmark" icon={TrendingUp} subtitle="Simulated 30-day notional curve">
          <AreaTrend
            data={performance}
            keys={[
              { key: 'portfolio', color: PALETTE.green, label: 'Portfolio' },
              { key: 'benchmark', color: PALETTE.blue, label: 'Benchmark' },
            ]}
            height={200}
          />
        </Panel>
        <Panel title="Watchlist" icon={Star}>
          {watchlist.length === 0 ? (
            <p className="py-6 text-center text-[11px] text-ink-3">No assets starred yet.</p>
          ) : (
            <ul className="space-y-2">
              {assets.filter((a) => watchlist.includes(a.symbol)).map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-line-soft pb-1.5">
                  <span className="flex items-center gap-2">
                    <Star size={10} className="fill-amber text-amber" />
                    <span className="font-mono text-[11px] text-ink">{a.symbol}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <UISparkline data={a.spark} color={a.change24h >= 0 ? PALETTE.green : PALETTE.red} height={18} />
                    <span className="mono w-20 text-right text-[10px] tabular text-ink-2">{fmtMoney(a.price)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Divider label="MARKET SNAPSHOT" />
          <KeyValue
            cols={1}
            items={[
              { k: 'Tracked assets', v: String(assets.length) },
              { k: 'Total notional', v: fmtMoney(totalPortfolio, 'USD', true) },
              { k: 'Best 24h', v: `${assets.reduce((b, a) => (a.change24h > b.change24h ? a : b), assets[0]).symbol} +${Math.max(...assets.map((a) => a.change24h)).toFixed(2)}%` },
              { k: 'Holdings units', v: fmtNum(Math.round(assets.reduce((a, x) => a + x.holding, 0))) },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Market Performance" icon={LineChart} subtitle="Indexed demo movement">
          <BarsTrend
            data={assets.map((a) => ({ t: a.symbol, change: a.change24h }))}
            keys={[{ key: 'change', color: PALETTE.cyan, label: '24h %' }]}
            height={170}
            xKey="t"
          />
        </Panel>
        <Panel title="Simulation Notice" icon={Eye}>
          <InlineAlert tone="amber" title="No real cryptocurrency">
            Prices, holdings and swaps are simulated inside this application. SHADOW SYSTEMS holds no keys, connects to no
            exchange and cannot move any digital asset.
          </InlineAlert>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between"><span className="text-[10.5px] text-ink-2">Exchange connectivity</span><StatusPill value="inactive" label="DISCONNECTED" /></div>
            <div className="flex items-center justify-between"><span className="text-[10.5px] text-ink-2">Key material</span><StatusPill value="inactive" label="NONE" /></div>
            <div className="flex items-center justify-between"><span className="text-[10.5px] text-ink-2">Settlement layer</span><StatusPill value="active" label="LOCAL DEMO" /></div>
          </div>
        </Panel>
      </div>

      <Modal
        open={!!swapDone}
        onClose={() => setSwapDone(null)}
        title="Swap complete"
        subtitle="Simulated digital asset swap"
        icon={ArrowDownUp}
        size="sm"
        footer={<button type="button" className="btn btn-primary" onClick={() => setSwapDone(null)}>Done</button>}
      >
        {swapDone && (
          <div className="space-y-3">
            <ConfirmationCard
              tone="success"
              title="Swap complete"
              subtitle={`${swapDone.from} → ${swapDone.to}`}
              rows={[
                { label: 'You sold', value: `${swapDone.sold} ${swapDone.from}`, emphasis: true, mono: true },
                { label: 'You received', value: `${swapDone.bought.toFixed(6)} ${swapDone.to}`, mono: true },
                { label: 'Notional', value: fmtMoney(swapDone.notional), mono: true },
                { label: 'Swap ID', value: swapDone.id, mono: true },
                { label: 'Date', value: fmtDateTime(Date.now()) },
              ]}
              note="Holdings in this demonstration wallet were updated locally. No blockchain, exchange or custodian was contacted."
            />
            <SimulatedNotice>Demo holdings only · no chain transaction</SimulatedNotice>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
