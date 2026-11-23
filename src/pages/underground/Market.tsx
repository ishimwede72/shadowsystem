import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store, Search, ShoppingCart, Star, ShieldCheck, Package, Filter, ArrowUpRight,
  Eye, Tag, Wallet, LayoutGrid, List, AlertTriangle, Users,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tabs, Tag as TagPill, Modal, Progress, Avatar } from '@/components/ui'
import { Donut, PALETTE, BarsTrend, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtMoney } from '@/lib/utils'

const CATEGORIES = ['FORGED-CREDENTIAL-KIT', 'PROP-DEVICE', 'SCRIPT-KIT', 'FICTION-INTEL', 'PROP-TOOL', 'DEMO-ACCESS'] as const

export default function Market() {
  const navigate = useNavigate()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('rating')
  const [view, setView] = useState('grid')
  const [selected, setSelected] = useState<string | null>(null)
  const [cart, setCart] = useState<{ listingId: string; qty: number }[]>([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [placed, setPlaced] = useState<string | null>(null)

  const listings = useMemo(() => {
    const t = q.toLowerCase()
    const list = s.listings.filter((l) => {
      if (t && !`${l.title} ${l.description} ${l.category}`.toLowerCase().includes(t)) return false
      if (cat !== 'all' && l.category !== cat) return false
      return true
    })
    return [...list].sort((a, b) =>
      sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'stock' ? b.stock - a.stock : b.rating - a.rating,
    )
  }, [s.listings, q, cat, sort])

  const listing = s.listings.find((l) => l.id === selected)

  const cartTotal = useMemo(
    () => cart.reduce((a, c) => a + (s.listings.find((l) => l.id === c.listingId)?.price ?? 0) * c.qty, 0),
    [cart, s.listings],
  )

  const catDist = useMemo(() => {
    const m = new Map<string, number>()
    s.listings.forEach((l) => m.set(l.category, (m.get(l.category) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.listings])

  const vendorsTop = useMemo(
    () => [...s.vendors].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [s.vendors],
  )

  const addToCart = (id: string) => setCart((c) => (c.some((x) => x.listingId === id) ? c.map((x) => (x.listingId === id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { listingId: id, qty: 1 }]))

  const checkout = () => {
    const orderIds: string[] = []
    cart.forEach((c) => {
      const l = s.listings.find((x) => x.id === c.listingId)
      if (!l) return
      s.addOrder({
        listingId: l.id,
        vendorId: l.vendorId,
        buyer: s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? 'OPERATOR',
        amount: l.price * c.qty,
        escrow: 'held',
        status: 'open',
      })
      orderIds.push(l.id)
    })
    setPlaced(`${orderIds.length} simulated order(s) created`)
    setCart([])
    setCheckoutOpen(false)
    s.notify({ type: 'success', title: 'Simulated order placed', body: `${orderIds.length} item(s) held in demo escrow`, severity: 'low', module: 'underground' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="UNDERGROUND · MARKETPLACE"
        title="Shadow Market"
        subtitle="An entirely fictional marketplace of movie-prop artefacts. Nothing is purchasable, real or functional."
        icon={Store}
        meta={
          <>
            <span className="badge badge-cyan">{s.listings.filter((l) => l.status === 'live').length} LISTINGS</span>
            <span className="badge badge-blue">{s.vendors.length} VENDORS</span>
            <span className="badge badge-green">{s.orders.filter((o) => o.escrow === 'held').length} ESCROW</span>
            <span className="badge badge-amber">100% FICTION</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={view} onChange={setView} tabs={[{ id: 'grid', label: 'Grid', icon: LayoutGrid }, { id: 'list', label: 'List', icon: List }]} />
            <button type="button" className="btn btn-sm" onClick={() => navigate('/underground/orders')}><Package size={11} /> Orders</button>
            <button type="button" className="btn btn-sm btn-primary relative" onClick={() => cart.length ? setCheckoutOpen(true) : undefined}>
              <ShoppingCart size={11} /> Cart ({cart.reduce((a, c) => a + c.qty, 0)})
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Listings" value={s.listings.length} icon={Store} accent="cyan" />
        <StatCard label="Vendors" value={s.vendors.length} icon={Users} accent="blue" />
        <StatCard label="Open orders" value={s.orders.filter((o) => o.status === 'open').length} icon={Package} accent="amber" onClick={() => navigate('/underground/orders')} />
        <StatCard label="Escrow held" value={fmtMoney(s.orders.filter((o) => o.escrow === 'held').reduce((a, o) => a + o.amount, 0))} icon={Wallet} accent="green" />
      </div>

      <Panel title="Market Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">CATEGORY</p><Select className="w-52" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} /></div>
          <div><p className="label-xs mb-1">SORT</p><Select className="w-36" value={sort} onChange={setSort} options={[{ value: 'rating', label: 'Top rated' }, { value: 'price-low', label: 'Price ↑' }, { value: 'price-high', label: 'Price ↓' }, { value: 'stock', label: 'Stock' }]} /></div>
          <span className="mono ml-auto pb-1 text-[9px] text-ink-3">{listings.length} results</span>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {view === 'grid' ? (
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {listings.map((l) => {
                const vendor = s.vendors.find((v) => v.id === l.vendorId)
                return (
                  <div key={l.id} className="panel-flat flex flex-col p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="badge badge-grey">{l.category}</span>
                      <span className={cn('mono text-[8px] uppercase', l.status === 'live' ? 'text-green' : l.status === 'paused' ? 'text-amber' : 'text-red')}>{l.status}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] font-medium leading-snug text-ink">{l.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-snug text-ink-3">{l.description}</p>
                    <div className="mt-1.5 flex items-center gap-1 font-mono text-[8.5px] text-ink-3">
                      <Avatar seed={vendor?.avatarSeed ?? 'x'} size={14} /> {vendor?.handle ?? 'unknown'}
                      <span className="ml-auto flex items-center gap-0.5 text-amber"><Star size={8} className="fill-amber" />{l.rating.toFixed(1)}</span>
                    </div>
                    <div className="mt-auto flex items-end justify-between border-t border-line-soft pt-1.5">
                      <span>
                        <span className="mono block text-[12px] text-[var(--accent)]">{fmtMoney(l.price)}</span>
                        <span className="mono block text-[8px] text-ink-3">stock {l.stock} {l.escrow && '· escrow'}</span>
                      </span>
                      <span className="flex gap-1">
                        <button type="button" className="btn btn-sm !px-1.5" title="Inspect listing" aria-label={`Inspect ${l.title}`} onClick={() => setSelected(l.id)}><Eye size={9} /></button>
                        <button type="button" className="btn btn-sm !px-1.5" title="Add to cart" aria-label={`Add ${l.title} to cart`} onClick={() => addToCart(l.id)} disabled={l.status !== 'live'}><ShoppingCart size={9} /></button>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Panel title="Listing Table" icon={Store} bodyClassName="p-0">
              <div className="max-h-[56vh] overflow-auto">
                <table className="data-table min-w-[760px]">
                  <thead><tr><th>Listing</th><th>Category</th><th>Vendor</th><th>Price</th><th>Stock</th><th>Rating</th><th>Escrow</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {listings.map((l) => (
                      <tr key={l.id}>
                        <td className="max-w-[220px] truncate text-[10.5px] text-ink">{l.title}</td>
                        <td className="text-[9px] text-ink-2">{l.category}</td>
                        <td className="mono text-[9px]">{s.vendors.find((v) => v.id === l.vendorId)?.handle}</td>
                        <td className="mono text-[9.5px] text-[var(--accent)]">{fmtMoney(l.price)}</td>
                        <td className="mono text-[9px]">{l.stock}</td>
                        <td className="mono text-[9px]">{l.rating.toFixed(1)}</td>
                        <td className="mono text-[8.5px] uppercase text-ink-3">{l.escrow ? 'YES' : 'NO'}</td>
                        <td><StatusPill value={l.status === 'live' ? 'active' : l.status === 'paused' ? 'pending' : 'closed'} label={l.status.toUpperCase()} dot={false} /></td>
                        <td>
                          <div className="flex gap-1">
                            <button type="button" className="btn btn-sm !px-1" title="Inspect listing" aria-label={`Inspect ${l.title}`} onClick={() => setSelected(l.id)}><Eye size={8} /></button>
                            <button type="button" className="btn btn-sm !px-1" title="Add to cart" aria-label={`Add ${l.title} to cart`} onClick={() => addToCart(l.id)} disabled={l.status !== 'live'}><ShoppingCart size={8} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {listings.length === 0 && <EmptyState icon={Store} title="Nothing matches" message="Try a different category or search." />}
              </div>
            </Panel>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Category Mix" icon={Tag}>
              <Donut data={catDist.map(([name, value], i) => ({ name: name.replace('-', ' '), value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))} height={180} centerLabel="LISTINGS" centerValue={String(s.listings.length)} />
            </Panel>
            <Panel title="Price Bands" icon={Wallet} subtitle="Listing count by price range">
              <BarsTrend
                data={[
                  { band: '<50', n: s.listings.filter((l) => l.price < 50).length },
                  { band: '50-150', n: s.listings.filter((l) => l.price >= 50 && l.price < 150).length },
                  { band: '150-400', n: s.listings.filter((l) => l.price >= 150 && l.price < 400).length },
                  { band: '400-900', n: s.listings.filter((l) => l.price >= 400 && l.price < 900).length },
                  { band: '900+', n: s.listings.filter((l) => l.price >= 900).length },
                ]}
                keys={[{ key: 'n', color: PALETTE.cyan, label: 'Listings' }]}
                height={180}
                xKey="band"
              />
              <ChartLegend items={[{ label: 'Listings per band', color: PALETTE.cyan }]} />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          <Panel title="Cart" icon={ShoppingCart} actions={<span className="badge badge-grey">{cart.reduce((a, c) => a + c.qty, 0)}</span>}>
            {cart.length ? (
              <>
                <ul className="divide-y divide-line-soft">
                  {cart.map((c) => {
                    const l = s.listings.find((x) => x.id === c.listingId)
                    if (!l) return null
                    return (
                      <li key={c.listingId} className="flex items-center gap-1.5 py-1">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[10px] text-ink">{l.title}</span>
                          <span className="mono text-[8.5px] text-ink-3">{fmtMoney(l.price)} × {c.qty}</span>
                        </span>
                        <button type="button" className="btn btn-sm !px-1" onClick={() => setCart((x) => x.map((y) => (y.listingId === c.listingId ? { ...y, qty: Math.max(1, y.qty - 1) } : y)))}>−</button>
                        <button type="button" className="btn btn-sm !px-1" onClick={() => setCart((x) => x.map((y) => (y.listingId === c.listingId ? { ...y, qty: y.qty + 1 } : y)))}>+</button>
                        <button type="button" className="btn btn-sm !px-1" onClick={() => setCart((x) => x.filter((y) => y.listingId !== c.listingId))}>✕</button>
                      </li>
                    )
                  })}
                </ul>
                <Divider />
                <div className="flex items-center justify-between">
                  <span className="label-xs">TOTAL (DEMO)</span>
                  <span className="mono text-[12px] text-[var(--accent)]">{fmtMoney(cartTotal)}</span>
                </div>
                <button type="button" className="btn btn-primary w-full mt-2" onClick={() => setCheckoutOpen(true)}><ShieldCheck size={11} /> Checkout (simulated)</button>
                <p className="mt-1 font-mono text-[8px] leading-relaxed text-ink-3">No payment rails, no shipping, no real counterparties.</p>
              </>
            ) : (
              <EmptyState icon={ShoppingCart} title="Cart is empty" message="Add a fictional listing to see the simulated escrow flow." />
            )}
            {placed && <InlineAlert tone="green" title="Order created">{placed} — visible in Orders.</InlineAlert>}
          </Panel>

          <Panel title="Top Vendors" icon={Star} bodyClassName="p-0"
            actions={<button type="button" className="icon-btn" title="Open vendors" aria-label="Open vendors" onClick={() => navigate('/underground/vendors')}><ArrowUpRight size={12} /></button>}
          >
            <ul className="divide-y divide-line-soft">
              {vendorsTop.map((v) => (
                <li key={v.id} className="flex items-center gap-2 px-2.5 py-1.5">
                  <Avatar seed={v.avatarSeed} size={20} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[10px] text-ink">{v.handle}</span>
                    <span className="block truncate text-[8px] text-ink-3">{v.specialties.slice(0, 2).join(' · ')}</span>
                  </span>
                  <span className="flex items-center gap-0.5 font-mono text-[9px] text-amber"><Star size={8} className="fill-amber" />{v.rating.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Escrow Model" icon={ShieldCheck}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Orders are held in a fictional escrow ledger.</li>
              <li>• Release is a demo action; no money moves.</li>
              <li>• Items are props and printed fiction only.</li>
              <li>• No listing is functional in any real sense.</li>
            </ul>
            <Divider />
            <div className="flex flex-wrap gap-1"><TagPill tone="#28d8ea">FICTIONAL</TagPill><TagPill tone="#f5b942">NO PAYMENTS</TagPill></div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="red" title="Fictional marketplace — nothing is for sale">
        Listings describe imaginary props for film and TV. No real credentials, malware, exploits or illegal goods exist here,
        and no transaction can occur.
      </InlineAlert>

      <Modal open={!!listing} onClose={() => setSelected(null)} title={listing?.title ?? ''} subtitle={listing ? `${listing.id} · ${listing.category}` : undefined} icon={Store} size="lg"
        footer={listing ? <>
          <button type="button" className="btn" onClick={() => setSelected(null)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => { addToCart(listing.id); setSelected(null) }} disabled={listing.status !== 'live'}><ShoppingCart size={11} /> Add to cart</button>
        </> : null}
      >
        {listing && (
          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed text-ink-2">{listing.description}</p>
            <KeyValue
              items={[
                { k: 'Vendor', v: s.vendors.find((v) => v.id === listing.vendorId)?.handle ?? '—' },
                { k: 'Price (demo)', v: fmtMoney(listing.price) },
                { k: 'Currency', v: listing.currency },
                { k: 'Stock', v: String(listing.stock) },
                { k: 'Rating', v: listing.rating.toFixed(2) },
                { k: 'Escrow', v: listing.escrow ? 'SIMULATED' : 'NONE' },
              ]}
            />
            <div>
              <div className="flex justify-between"><span className="label-xs">STOCK LEVEL</span><span className="mono text-[9px] text-ink-3">{listing.stock} units</span></div>
              <Progress value={Math.min(100, listing.stock * 8)} height={3} color={listing.stock > 5 ? PALETTE.green : PALETTE.amber} />
            </div>
            <InlineAlert tone="red" title="Prop only">
              This listing is a narrative device. It cannot be purchased and describes nothing that exists.
            </InlineAlert>
          </div>
        )}
      </Modal>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Simulated Checkout" subtitle="Creates demo orders — no payment is processed" icon={ShieldCheck}
        footer={<>
          <button type="button" className="btn" onClick={() => setCheckoutOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={checkout}><ShieldCheck size={11} /> Place demo order</button>
        </>}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 border border-[#6d5320] bg-[#2a2110] p-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-[10px] leading-relaxed text-[#ffd489]">
              This is a fictional checkout. No card, wallet, bank or vendor is contacted, and no value is exchanged.
            </p>
          </div>
          <KeyValue
            items={[
              { k: 'Items', v: String(cart.reduce((a, c) => a + c.qty, 0)) },
              { k: 'Total (demo)', v: fmtMoney(cartTotal) },
              { k: 'Escrow', v: 'SIMULATED HOLD' },
              { k: 'Buyer', v: s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? 'OPERATOR' },
            ]}
          />
          <div>
            <p className="label-xs mb-1">ORDER PREVIEW</p>
            <ul className="space-y-0.5">
              {cart.map((c) => {
                const l = s.listings.find((x) => x.id === c.listingId)
                return <li key={c.listingId} className="flex justify-between font-mono text-[9px] text-ink-3"><span className="truncate">{l?.title}</span><span>{fmtMoney((l?.price ?? 0) * c.qty)}</span></li>
              })}
            </ul>
          </div>
          <Progress value={100} label="Fiction level" showValue color="#38db91" />
        </div>
      </Modal>
    </Screen>
  )
}

