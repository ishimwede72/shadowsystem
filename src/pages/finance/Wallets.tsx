import { useState } from 'react'
import { Copy, Wallet as WalletIcon, ShieldCheck, ArrowRightLeft, KeySquare } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, KeyValue, InlineAlert, Divider, EmptyState, Progress } from '@/components/ui'
import { Donut, PALETTE } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtMoney } from '@/lib/utils'

export default function Wallets() {
  const wallets = useEngine((s) => s.wallets)
  const assets = useEngine((s) => s.assets)
  const [selected, setSelected] = useState(wallets[0]?.id ?? null)
  const [copied, setCopied] = useState<string | null>(null)
  const current = wallets.find((w) => w.id === selected) ?? wallets[0]

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 1400)
  }

  const totalUsd = wallets.reduce((a, w) => a + w.balanceUsd, 0)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · WALLETS"
        title="Simulated Wallets"
        subtitle="Fictional custody wallets holding demonstration assets. Addresses are generated and non-functional."
        icon={WalletIcon}
        meta={
          <>
            <span className="badge badge-green">{fmtMoney(totalUsd, 'USD', true)} TOTAL NOTIONAL</span>
            <span className="badge badge-grey">{wallets.length} WALLETS</span>
            <span className="badge badge-amber">NON-CUSTODIAL PROP</span>
          </>
        }
        actions={<button type="button" className="btn btn-sm"><ArrowRightLeft size={11} /> Simulate swap</button>}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Wallet Registry" icon={WalletIcon} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {wallets.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setSelected(w.id)}
                  className={cn('w-full px-3 py-2.5 text-left transition-colors', selected === w.id ? 'bg-[var(--accent-soft)]' : 'hover:bg-elevated')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <KeySquare size={12} className="text-[var(--accent)]" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink">{w.label}</span>
                    </span>
                    <StatusPill value={w.status} dot={false} />
                  </div>
                  <p className="mt-1 truncate font-mono text-[9px] text-ink-3">{w.address}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="mono text-[11.5px] tabular text-green">{fmtMoney(w.balanceUsd, 'USD', true)}</span>
                    <span className="badge badge-grey">{w.network}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <InlineAlert tone="cyan" title="Generated addresses">
            Every address is synthetic and cannot receive or send value on any chain.
          </InlineAlert>
        </Panel>

        {current && (
          <div className="space-y-3">
            <Panel title={current.label} subtitle={`${current.id} · ${current.network}`} icon={WalletIcon} actions={<StatusPill value={current.status} />}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <p className="label-xs">NOTIONAL BALANCE (SIM)</p>
                  <p className="stat-value mt-0.5 text-2xl text-green">{fmtMoney(current.balanceUsd)}</p>
                  <div className="mt-2 flex items-center gap-1.5 border border-line bg-bg px-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-ink-2">{current.address}</span>
                    <button type="button" className="icon-btn !h-5 !w-5" onClick={() => copy(current.address, current.id)} aria-label="Copy address">
                      <Copy size={10} className={copied === current.id ? 'text-green' : undefined} />
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-[8.5px] uppercase tracking-wider text-ink-3">
                    {copied === current.id ? 'COPIED TO CLIPBOARD' : 'CLICK TO COPY · DISPLAY ONLY'}
                  </p>
                </div>
                <div className="grid h-20 w-20 shrink-0 place-items-center border border-line bg-bg" aria-label="Placeholder QR">
                  <QrPlaceholder seed={current.id} />
                </div>
              </div>

              <Divider label="HOLDINGS" />
              <ul className="space-y-2">
                {current.assets.map((h) => {
                  const asset = assets.find((a) => a.symbol === h.symbol)
                  return (
                    <li key={h.symbol}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="grid h-5 w-5 place-items-center rounded-sm border border-line bg-elevated font-mono text-[7px] text-[var(--accent)]">{h.symbol.slice(0, 2)}</span>
                          <span className="font-mono text-[10.5px] text-ink">{h.symbol}</span>
                        </span>
                        <span className="text-right">
                          <span className="mono block text-[10.5px] tabular text-ink">{h.amount} {h.symbol}</span>
                          <span className="mono block text-[9px] text-ink-3">{fmtMoney(h.usd)}</span>
                        </span>
                      </div>
                      <Progress value={asset ? asset.allocation : 20} color={PALETTE.cyan} height={2} />
                    </li>
                  )
                })}
              </ul>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-2">
              <Panel title="Allocation" icon={ShieldCheck}>
                <Donut
                  data={current.assets.map((a, i) => ({ name: a.symbol, value: a.usd, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue][i % 3] }))}
                  height={150}
                  centerLabel="NOTIONAL"
                  centerValue={fmtMoney(current.balanceUsd, 'USD', true)}
                />
              </Panel>
              <Panel title="Wallet Metadata" icon={KeySquare}>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Wallet ID', v: current.id },
                    { k: 'Network', v: current.network },
                    { k: 'Assets held', v: String(current.assets.length) },
                    { k: 'Custody', v: 'SIMULATED / LOCAL' },
                  ]}
                />
                <p className="mt-2 font-mono text-[8.5px] leading-relaxed text-ink-3">
                  No private keys exist. Balances are display state only.
                </p>
              </Panel>
            </div>
          </div>
        )}
        {!current && <Panel><EmptyState icon={WalletIcon} title="No wallets" /></Panel>}
      </div>
    </Screen>
  )
}

function QrPlaceholder({ seed }: { seed: string }) {
  const cells = Array.from({ length: 49 }, (_, i) => ((seed.charCodeAt(i % seed.length) * (i + 7)) % 3) !== 0)
  return (
    <div className="grid grid-cols-7 gap-[1px] p-1" aria-hidden="true">
      {cells.map((on, i) => (
        <span key={i} className={cn('h-[8px] w-[8px]', on ? 'bg-[var(--accent)]' : 'bg-transparent')} />
      ))}
    </div>
  )
}
