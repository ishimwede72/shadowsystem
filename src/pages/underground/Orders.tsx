import { useMemo, useState } from 'react'
import { Package, Download, ShieldCheck, Search, Filter, Wallet, Check, X, RotateCcw, Truck, CircleCheck } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tabs, Tag, Modal, Progress } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { Donut, PALETTE, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtMoney, fmtDateTime, relTime, toCSV } from '@/lib/utils'

const STAGES = ['open', 'shipped', 'complete'] as const

export default function Orders() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [escrow, setEscrow] = useState('all')
  const [status, setStatus] = useState('all')
  const [tab, setTab] = useState('all')
  const [receipt, setReceipt] = useState<string | null>(null)

  const orders = useMemo(() => {
    const t = q.toLowerCase()
    return s.orders.filter((o) => {
      if (t && !`${o.id} ${o.buyer} ${o.listingId}`.toLowerCase().includes(t)) return false
      if (escrow !== 'all' && o.escrow !== escrow) return false
      if (status !== 'all' && o.status !== status) return false
      if (tab !== 'all' && o.status !== tab) return false
      return true
    })
  }, [s.orders, q, escrow, status, tab])

  const order = s.orders.find((o) => o.id === receipt)

  const totals = useMemo(
    () => ({
      held: s.orders.filter((o) => o.escrow === 'held').reduce((a, o) => a + o.amount, 0),
      released: s.orders.filter((o) => o.escrow === 'released').reduce((a, o) => a + o.amount, 0),
      value: s.orders.reduce((a, o) => a + o.amount, 0),
      disputed: s.orders.filter((o) => o.escrow === 'disputed').length,
    }),
    [s.orders],
  )

  const advance = (id: string) => {
    const o = s.orders.find((x) => x.id === id)
    if (!o) return
    const idx = STAGES.indexOf(o.status as typeof STAGES[number])
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, idx) + 1)]
    s.updateOrder(id, { status: next, escrow: next === 'complete' ? 'released' : o.escrow })
  }

  const statusDist = useMemo(() => {
    const m = new Map<string, number>()
    s.orders.forEach((o) => m.set(o.status, (m.get(o.status) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.orders])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="UNDERGROUND · ORDERS"
        title="Order Ledger"
        subtitle="Simulated orders with a fictional escrow lifecycle. No payment rail, courier or counterparty is involved."
        icon={Package}
        meta={
          <>
            <span className="badge badge-cyan">{s.orders.length} ORDERS</span>
            <span className="badge badge-amber">{s.orders.filter((o) => o.escrow === 'held').length} ESCROW HELD</span>
            <span className="badge badge-green">{s.orders.filter((o) => o.status === 'complete').length} COMPLETE</span>
            <span className="badge badge-grey">NO REAL VALUE</span>
          </>
        }
        actions={
          <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-orders-${Date.now()}.csv`, toCSV(s.orders.map(({ id, listingId, vendorId, buyer, amount, escrow, status, created }) => ({ id, listingId, vendorId, buyer, amount, escrow, status, created }))), 'text/csv')}><Download size={11} /> Export ledger</button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders" value={s.orders.length} icon={Package} accent="cyan" />
        <StatCard label="Escrow held" value={fmtMoney(totals.held)} icon={Wallet} accent="amber" />
        <StatCard label="Released" value={fmtMoney(totals.released)} icon={ShieldCheck} accent="green" />
        <StatCard label="Disputed" value={totals.disputed} icon={X} accent="red" />
      </div>

      <Panel title="Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, buyer or listing…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">ESCROW</p><Select className="w-32" value={escrow} onChange={setEscrow} options={[{ value: 'all', label: 'Any' }, { value: 'held', label: 'Held' }, { value: 'released', label: 'Released' }, { value: 'disputed', label: 'Disputed' }, { value: 'cancelled', label: 'Cancelled' }]} /></div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any' }, { value: 'open', label: 'Open' }, { value: 'shipped', label: 'Shipped' }, { value: 'complete', label: 'Complete' }, { value: 'cancelled', label: 'Cancelled' }]} /></div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Order List" icon={Package} bodyClassName="p-0"
            actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: s.orders.length }, { id: 'open', label: 'Open' }, { id: 'shipped', label: 'Shipped' }, { id: 'complete', label: 'Done' }]} />}
          >
            <div className="max-h-[50vh] overflow-auto">
              <table className="data-table min-w-[780px]">
                <thead><tr><th>Order</th><th>Listing</th><th>Vendor</th><th>Buyer</th><th>Amount</th><th>Escrow</th><th>Stage</th><th>Created</th><th></th></tr></thead>
                <tbody>
                  {orders.map((o) => {
                    const listing = s.listings.find((l) => l.id === o.listingId)
                    const vendor = s.vendors.find((v) => v.id === o.vendorId)
                    return (
                      <tr key={o.id}>
                        <td className="mono text-[9px] text-[var(--accent)]">{o.id}</td>
                        <td className="max-w-[180px] truncate text-[10px] text-ink-2">{listing?.title ?? o.listingId}</td>
                        <td className="mono text-[9px]">{vendor?.handle ?? '—'}</td>
                        <td className="mono text-[9px]">{o.buyer}</td>
                        <td className="mono text-[9.5px] text-ink">{fmtMoney(o.amount)}</td>
                        <td><StatusPill value={o.escrow === 'held' ? 'pending' : o.escrow === 'released' ? 'completed' : o.escrow === 'disputed' ? 'failed' : 'closed'} label={o.escrow.toUpperCase()} dot={false} /></td>
                        <td>
                          <span className="flex items-center gap-1">
                            {STAGES.map((st, i) => (
                              <span key={st} title={st} className={cn('h-1 w-4', STAGES.indexOf(o.status as typeof STAGES[number]) >= i ? 'bg-[var(--accent)]' : 'bg-[#1c2a36]')} />
                            ))}
                          </span>
                        </td>
                        <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(o.created)}</td>
                        <td>
                          <div className="flex gap-1">
                            <button type="button" className="btn btn-sm !px-1" title="Open receipt" aria-label={`Receipt for ${o.id}`} onClick={() => setReceipt(o.id)}><Download size={8} /></button>
                            <button type="button" className="btn btn-sm !px-1" title="Advance shipment" aria-label={`Advance shipment ${o.id}`} onClick={() => advance(o.id)} disabled={o.status === 'complete' || o.status === 'cancelled'}><Truck size={8} /></button>
                            <button type="button" className="btn btn-sm !px-1" title="Release escrow" aria-label={`Release escrow for ${o.id}`} onClick={() => s.updateOrder(o.id, { escrow: 'released', status: 'complete' })} disabled={o.escrow === 'released'}><CircleCheck size={8} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {orders.length === 0 && <EmptyState icon={Package} title="No orders match" />}
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Stage Mix" icon={Truck}>
              <Donut data={statusDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.blue, PALETTE.green, PALETTE.line][i % 4] }))} height={170} centerLabel="ORDERS" centerValue={String(s.orders.length)} />
            </Panel>
            <Panel title="Value by Stage" icon={Wallet}>
              <BarsTrend
                data={[
                  { s: 'Open', v: s.orders.filter((o) => o.status === 'open').reduce((a, o) => a + o.amount, 0) },
                  { s: 'Shipped', v: s.orders.filter((o) => o.status === 'shipped').reduce((a, o) => a + o.amount, 0) },
                  { s: 'Complete', v: s.orders.filter((o) => o.status === 'complete').reduce((a, o) => a + o.amount, 0) },
                ]}
                keys={[{ key: 'v', color: PALETTE.amber, label: 'Value' }]}
                height={170}
                xKey="s"
              />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          <Panel title="Escrow Summary" icon={ShieldCheck}>
            <KeyValue
              items={[
                { k: 'Held', v: fmtMoney(totals.held) },
                { k: 'Released', v: fmtMoney(totals.released) },
                { k: 'Total value', v: fmtMoney(totals.value) },
                { k: 'Disputed', v: String(totals.disputed) },
                { k: 'Payment rail', v: 'NONE' },
                { k: 'Counterparties', v: 'FICTIONAL' },
              ]}
            />
            <Divider />
            <Progress value={(totals.released / Math.max(1, totals.value)) * 100} label="Released share" showValue color="#38db91" />
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">SIMULATED ESCROW</Tag><Tag tone="#f5b942">NO FUNDS</Tag></div>
          </Panel>

          <Panel title="Bulk Actions" icon={RotateCcw}>
            <div className="space-y-1.5">
              <button type="button" className="btn btn-sm w-full" onClick={() => s.orders.filter((o) => o.status === 'open').forEach((o) => advance(o.id))}><Truck size={10} /> Ship all open</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => s.orders.filter((o) => o.escrow === 'held').forEach((o) => s.updateOrder(o.id, { escrow: 'released', status: 'complete' }))}><Check size={10} /> Release all escrow</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => s.orders.filter((o) => o.status !== 'complete').slice(0, 1).forEach((o) => s.updateOrder(o.id, { escrow: 'disputed' }))}><X size={10} /> Dispute first held order</button>
            </div>
          </Panel>

          <Panel title="Lifecycle" icon={Truck}>
            <ol className="space-y-1 text-[10px] text-ink-2">
              <li><span className="badge badge-cyan mr-1">1</span> Open — escrow held (simulated).</li>
              <li><span className="badge badge-blue mr-1">2</span> Shipped — fictional despatch recorded.</li>
              <li><span className="badge badge-green mr-1">3</span> Complete — escrow released.</li>
              <li><span className="badge badge-red mr-1">×</span> Disputed — held for demo review.</li>
            </ol>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="red" title="Nothing is real">
        Order, buyer and vendor records are entirely fictional. No payment, transfer, shipment or legal obligation exists or can
        be created here.
      </InlineAlert>

      <Modal open={!!order} onClose={() => setReceipt(null)} title={order ? `Receipt ${order.id}` : 'Receipt'} subtitle="Simulated order receipt — not a real transaction" icon={Package} size="lg"
        footer={order ? <>
          <button type="button" className="btn" onClick={() => setReceipt(null)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => {
            const text = receiptText(order.id)
            downloadFile(`${order.id}-receipt.txt`, text, 'text/plain')
          }}><Download size={11} /> Download receipt</button>
        </> : null}
      >
        {order && (
          <div className="space-y-3">
            <Doc label="SIMULATED RECEIPT">{receiptText(order.id)}</Doc>
            <KeyValue
              items={[
                { k: 'Escrow', v: order.escrow.toUpperCase() },
                { k: 'Stage', v: order.status.toUpperCase() },
                { k: 'Created', v: fmtDateTime(order.created) },
                { k: 'Amount (demo)', v: fmtMoney(order.amount) },
              ]}
            />
            <div className="flex items-center gap-1.5 border border-[#6e2633] bg-[#2a1016] p-2 text-[9.5px] text-[#ff9aa6]">
              <X size={11} /> This receipt is a prop. It has no monetary value and records no real trade.
            </div>
          </div>
        )}
      </Modal>
    </Screen>
  )

  function receiptText(id: string) {
    const o = s.orders.find((x) => x.id === id)
    if (!o) return 'Order not found.'
    const listing = s.listings.find((l) => l.id === o.listingId)
    const vendor = s.vendors.find((v) => v.id === o.vendorId)
    return [
      'SHADOW SYSTEMS — SHADOW MARKET (FICTIONAL)',
      '==========================================',
      `ORDER ID     : ${o.id}`,
      `CREATED      : ${o.created}`,
      `LISTING      : ${listing?.title ?? o.listingId}`,
      `VENDOR       : ${vendor?.handle ?? o.vendorId}`,
      `BUYER        : ${o.buyer}`,
      `AMOUNT       : ${fmtMoney(o.amount)} (DEMO CREDITS)`,
      `ESCROW       : ${o.escrow.toUpperCase()} (SIMULATED)`,
      `STAGE        : ${o.status.toUpperCase()}`,
      '',
      'NOTICE',
      'This document is a fictional prop created for a',
      'cinematic simulation. No payment was processed, no',
      'goods exist, and no real party is involved.',
      '',
      'SIMULATED — NOT A REAL TRANSACTION.',
    ].join('\n')
  }
}
