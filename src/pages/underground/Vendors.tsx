import { useMemo, useState } from 'react'
import { Users, Star, Search, Download, ShieldCheck, Store, AlertTriangle, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Progress, Tag, Avatar, Tabs } from '@/components/ui'
import { Donut, PALETTE, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtMoney, fmtDateTime, relTime, toCSV } from '@/lib/utils'

export default function Vendors() {
  const navigate = useNavigate()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('rating')
  const [selected, setSelected] = useState<string | null>(s.vendors[0]?.id ?? null)
  const [tab, setTab] = useState('profile')

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    const list = s.vendors.filter((v) => {
      if (t && !`${v.handle} ${v.specialties.join(' ')}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && v.status !== status) return false
      return true
    })
    return [...list].sort((a, b) => (sort === 'deals' ? b.deals - a.deals : sort === 'reviews' ? b.reviews - a.reviews : b.rating - a.rating))
  }, [s.vendors, q, status, sort])

  const vendor = s.vendors.find((v) => v.id === selected)
  const vendorListings = s.listings.filter((l) => l.vendorId === vendor?.id)
  const vendorOrders = s.orders.filter((o) => o.vendorId === vendor?.id)

  const statusDist = useMemo(() => {
    const m = new Map<string, number>()
    s.vendors.forEach((v) => m.set(v.status, (m.get(v.status) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.vendors])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="UNDERGROUND · VENDORS"
        title="Vendor Directory"
        subtitle="Invented market vendors with reputation scores, specialties and simulated order history."
        icon={Users}
        meta={
          <>
            <span className="badge badge-cyan">{s.vendors.length} VENDORS</span>
            <span className="badge badge-green">{s.vendors.filter((v) => v.status === 'verified').length} VERIFIED</span>
            <span className="badge badge-amber">{s.vendors.filter((v) => v.status === 'probation').length} PROBATION</span>
            <span className="badge badge-red">{s.vendors.filter((v) => v.status === 'flagged').length} FLAGGED</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={sort} onChange={setSort} tabs={[{ id: 'rating', label: 'Rating' }, { id: 'deals', label: 'Deals' }, { id: 'reviews', label: 'Reviews' }]} />
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-vendors-${Date.now()}.csv`, toCSV(s.vendors.map(({ id, handle, rating, reviews, deals, status, joined, specialties }) => ({ id, handle, rating, reviews, deals, status, joined, specialties: specialties.join('|') }))), 'text/csv')}><Download size={11} /> Export</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Vendors" value={s.vendors.length} icon={Users} accent="cyan" />
        <StatCard label="Avg rating" value={(s.vendors.reduce((a, v) => a + v.rating, 0) / Math.max(1, s.vendors.length)).toFixed(2)} icon={Star} accent="amber" />
        <StatCard label="Total deals" value={s.vendors.reduce((a, v) => a + v.deals, 0)} icon={Store} accent="green" />
        <StatCard label="Listings" value={s.listings.length} icon={ShieldCheck} accent="blue" />
      </div>

      <Panel title="Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Handle or specialty…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-36" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any status' }, { value: 'verified', label: 'Verified' }, { value: 'probation', label: 'Probation' }, { value: 'flagged', label: 'Flagged' }, { value: 'offline', label: 'Offline' }]} /></div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((v) => (
              <button key={v.id} type="button" onClick={() => setSelected(v.id)} className={cn('panel-flat p-2.5 text-left transition-colors', selected === v.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:border-line-strong')}>
                <div className="flex items-start gap-2">
                  <Avatar seed={v.avatarSeed} size={34} status={v.status} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[11px] text-ink">{v.handle}</span>
                    <span className="block truncate text-[8.5px] text-ink-3">{v.specialties.slice(0, 2).join(' · ')}</span>
                  </span>
                  <StatusPill value={v.status} dot={false} />
                </div>
                <div className="mt-2 flex items-center gap-2 font-mono text-[8.5px] text-ink-3">
                  <span className="flex items-center gap-0.5 text-amber"><Star size={8} className="fill-amber" /> {v.rating.toFixed(2)}</span>
                  <span>{v.reviews} reviews</span>
                  <span className="ml-auto">{v.deals} deals</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">{v.specialties.slice(0, 3).map((sp) => <Tag key={sp}>{sp}</Tag>)}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-full"><Panel title="No vendors"><EmptyState icon={Users} title="No vendors match" /></Panel></div>}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Status Mix" icon={ShieldCheck}>
              <Donut data={statusDist.map(([name, value], i) => ({ name, value, color: [PALETTE.green, PALETTE.amber, PALETTE.red, PALETTE.line][i % 4] }))} height={170} centerLabel="VENDORS" centerValue={String(s.vendors.length)} />
            </Panel>
            <Panel title="Reputation Ranking" icon={Star}>
              <BarsTrend horizontal data={[...s.vendors].sort((a, b) => b.rating - a.rating).slice(0, 7).map((v) => ({ name: v.handle, r: Number(v.rating.toFixed(2)) }))} keys={[{ key: 'r', color: PALETTE.amber, label: 'Rating' }]} height={170} xKey="name" />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {vendor ? (
            <>
              <Panel title={vendor.handle} subtitle={vendor.id} icon={Users} actions={<StatusPill value={vendor.status} />}>
                <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'profile', label: 'Profile' }, { id: 'catalogue', label: 'Catalogue', count: vendorListings.length }]} />
                {tab === 'profile' ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar seed={vendor.avatarSeed} size={44} />
                      <div>
                        <p className="font-mono text-[12px] text-ink">{vendor.handle}</p>
                        <p className="flex items-center gap-1 font-mono text-[9px] text-amber"><Star size={9} className="fill-amber" /> {vendor.rating.toFixed(2)} · {vendor.reviews} reviews</p>
                      </div>
                    </div>
                    <KeyValue
                      cols={1}
                      items={[
                        { k: 'Joined', v: fmtDateTime(vendor.joined).split(' ')[0] },
                        { k: 'Deals', v: String(vendor.deals) },
                        { k: 'Listings', v: String(vendorListings.length) },
                        { k: 'Orders (sim)', v: String(vendorOrders.length) },
                        { k: 'Escrow held', v: fmtMoney(vendorOrders.filter((o) => o.escrow === 'held').reduce((a, o) => a + o.amount, 0)) },
                      ]}
                    />
                    <div>
                      <p className="label-xs mb-1">SPECIALTIES</p>
                      <div className="flex flex-wrap gap-1">{vendor.specialties.map((sp) => <Tag key={sp} tone="#28d8ea">{sp}</Tag>)}</div>
                    </div>
                    <div>
                      <div className="flex justify-between"><span className="label-xs">REPUTATION</span><span className="mono text-[9px] text-ink-3">{Math.round((vendor.rating / 5) * 100)}%</span></div>
                      <Progress value={(vendor.rating / 5) * 100} height={3} color={vendor.rating > 4.4 ? PALETTE.green : vendor.rating > 3.8 ? PALETTE.amber : PALETTE.red} />
                    </div>
                    <div className="flex gap-1">
                      <button type="button" className="btn btn-sm flex-1" onClick={() => navigate('/underground/messages')}><MessageSquare size={10} /> Message</button>
                      <button type="button" className="btn btn-sm flex-1" onClick={() => navigate('/underground/market')}><Store size={10} /> Shop</button>
                    </div>
                  </div>
                ) : (
                  <ul className="mt-2 divide-y divide-line-soft">
                    {vendorListings.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="min-w-0">
                          <span className="block truncate text-[10px] text-ink">{l.title}</span>
                          <span className="mono text-[8px] text-ink-3">{l.category} · stock {l.stock}</span>
                        </span>
                        <span className="mono shrink-0 text-[9.5px] text-[var(--accent)]">{fmtMoney(l.price)}</span>
                      </li>
                    ))}
                    {vendorListings.length === 0 && <li className="py-3 text-[10px] text-ink-3">No listings.</li>}
                  </ul>
                )}
              </Panel>

              <Panel title="Order History" icon={Store} bodyClassName="p-0">
                <ul className="max-h-[200px] divide-y divide-line-soft overflow-y-auto">
                  {vendorOrders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between px-2.5 py-1.5">
                      <span>
                        <span className="mono block text-[9px] text-[var(--accent)]">{o.id}</span>
                        <span className="block font-mono text-[8px] text-ink-3">{relTime(o.created)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="mono text-[9px] text-ink-2">{fmtMoney(o.amount)}</span>
                        <StatusPill value={o.escrow === 'held' ? 'pending' : o.escrow === 'released' ? 'completed' : o.escrow === 'disputed' ? 'failed' : 'closed'} label={o.escrow.toUpperCase()} dot={false} />
                      </span>
                    </li>
                  ))}
                  {vendorOrders.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No orders for this vendor.</li>}
                </ul>
              </Panel>

              <Panel title="Trust Notes" icon={AlertTriangle}>
                <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
                  <li>• Handles, ratings and deal counts are generated.</li>
                  <li>• No real vendor, marketplace or escrow service exists.</li>
                  <li>• Messaging and checkout are local simulations.</li>
                </ul>
              </Panel>
            </>
          ) : (
            <Panel title="Vendor"><EmptyState icon={Users} title="Select a vendor" /></Panel>
          )}
        </div>
      </div>

      <InlineAlert tone="red" title="All vendors are fictional">
        Any resemblance to real marketplaces, sellers or persons is coincidental. Nothing can be bought or sold.
      </InlineAlert>
    </Screen>
  )
}
