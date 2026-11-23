import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Wallet, Database, Network, Cctv, Target as TargetIcon, FileSearch,
  Store, Crosshair, User, Building2, ShieldAlert,
} from 'lucide-react'
import { useEngine } from '@/services/engine'
import { cn, fmtMoney } from '@/lib/utils'
import { Modal, EmptyState, StatusPill } from '@/components/ui'
import type { LucideIcon } from 'lucide-react'

interface Hit {
  id: string
  title: string
  sub: string
  to: string
  type: string
  icon: LucideIcon
  badge?: string
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const navigate = useNavigate()
  const s = useEngine()

  const index = useMemo<Hit[]>(() => {
    const items: Hit[] = []
    s.transactions.slice(0, 40).forEach((t) =>
      items.push({
        id: t.id, title: t.reference, sub: `${t.sender} → ${t.recipient} · ${fmtMoney(t.amount, t.currency)}`,
        to: `/finance/transactions?q=${t.id}`, type: 'transaction', icon: Wallet, badge: t.status,
      }),
    )
    s.identities.forEach((p) =>
      items.push({ id: p.id, title: p.name, sub: `${p.occupation} · ${p.nationality}`, to: `/intelligence/people?q=${p.id}`, type: 'profile', icon: User, badge: p.status }),
    )
    s.organizations.forEach((o) =>
      items.push({ id: o.id, title: o.name, sub: `${o.category} · ${o.hq}`, to: `/intelligence/organizations?q=${o.id}`, type: 'organization', icon: Building2 }),
    )
    s.cases.forEach((c) =>
      items.push({ id: c.id, title: c.title, sub: `${c.code} · lead ${c.lead}`, to: `/intelligence/cases?q=${c.id}`, type: 'case', icon: FileSearch, badge: c.status }),
    )
    s.targets.forEach((t) =>
      items.push({ id: t.id, title: `${t.codename} — ${t.name}`, sub: `${t.city}, ${t.country}`, to: `/geoint/targets?q=${t.id}`, type: 'target', icon: TargetIcon, badge: t.status }),
    )
    s.cameras.forEach((c) =>
      items.push({ id: c.id, title: c.label, sub: c.location, to: `/surveillance/cameras?q=${c.id}`, type: 'camera', icon: Cctv, badge: c.status }),
    )
    s.networkNodes.forEach((n) =>
      items.push({ id: n.id, title: n.hostname, sub: `${n.type} · ${n.ip}`, to: `/network/servers?q=${n.id}`, type: 'node', icon: Network, badge: n.status }),
    )
    s.listings.forEach((l) =>
      items.push({ id: l.id, title: l.title, sub: `${l.category} · ${l.price} ${l.currency}`, to: `/underground/market?q=${l.id}`, type: 'listing', icon: Store, badge: l.status }),
    )
    s.missions.forEach((m) =>
      items.push({ id: m.id, title: m.name, sub: `${m.code} · ${m.currentStage}`, to: `/missions/active?q=${m.id}`, type: 'mission', icon: Crosshair, badge: m.status }),
    )
    s.findings.forEach((f) =>
      items.push({ id: f.id, title: f.title, sub: `${f.asset} · score ${f.score}`, to: `/cyber/vulnerabilities?q=${f.id}`, type: 'finding', icon: ShieldAlert, badge: f.severity }),
    )
    s.evidence.forEach((e) =>
      items.push({ id: e.id, title: e.description, sub: `${e.category} · ${e.caseId}`, to: `/forensics/evidence?q=${e.id}`, type: 'evidence', icon: Database, badge: e.status }),
    )
    return items
  }, [s])

  const types = useMemo(() => ['all', ...Array.from(new Set(index.map((i) => i.type)))], [index])

  const results = useMemo(() => {
    const t = q.toLowerCase().trim()
    let list = index
    if (typeFilter !== 'all') list = list.filter((i) => i.type === typeFilter)
    if (!t) return list.slice(0, 10)
    return list.filter((i) => `${i.title} ${i.sub} ${i.id}`.toLowerCase().includes(t)).slice(0, 40)
  }, [q, index, typeFilter])

  return (
    <Modal open={open} onClose={onClose} title="Global Record Search" subtitle={`${index.length} fictional records indexed across 11 modules`} icon={Search} size="lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2 border border-line bg-bg px-2.5 py-2">
          <Search size={14} className="text-[var(--accent)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search profile IDs, names, cases, transactions, cameras, nodes…"
            className="w-full bg-transparent font-mono text-[12px] text-ink placeholder:text-ink-3 focus:outline-none"
            aria-label="Search fictional records"
          />
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                'badge shrink-0',
                typeFilter === t ? 'badge-cyan' : 'badge-grey hover:text-ink',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="max-h-[46vh] overflow-y-auto border border-line-soft">
          {results.map((r) => {
            const Icon = r.icon
            return (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => {
                  navigate(r.to)
                  onClose()
                }}
                className="flex w-full items-center gap-2.5 border-b border-line-soft px-2.5 py-2 text-left last:border-0 hover:bg-elevated"
              >
                <Icon size={13} className="shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-ink">{r.title}</span>
                  <span className="block truncate font-mono text-[9.5px] text-ink-3">{r.id} · {r.sub}</span>
                </span>
                {r.badge && <StatusPill value={r.badge} dot={false} />}
              </button>
            )
          })}
          {results.length === 0 && <EmptyState icon={Search} title="No records matched" message="Try a record ID such as PRF-0001, TX-90001 or CSE-002." />}
        </div>
      </div>
    </Modal>
  )
}
