import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2, Search, Download, Globe2, Users, FolderOpen, TrendingUp,
  Landmark,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Progress, Tag, Avatar } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { Donut, PALETTE, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, toCSV } from '@/lib/utils'

export default function Organizations() {
  const [params] = useSearchParams()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [selected, setSelected] = useState<string | null>(params.get('q') ?? s.organizations[0]?.id ?? null)

  const cats = useMemo(() => Array.from(new Set(s.organizations.map((o) => o.category))), [s.organizations])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.organizations.filter((o) => {
      if (t && !`${o.name} ${o.hq} ${o.country} ${o.category}`.toLowerCase().includes(t)) return false
      if (cat !== 'all' && o.category !== cat) return false
      return true
    })
  }, [s.organizations, q, cat])

  const org = s.organizations.find((o) => o.id === selected)
  const orgPeople = s.identities.filter((i) => i.orgId === org?.id)
  const orgCases = s.cases.filter((c) => org?.caseIds.includes(c.id))

  const catDist = useMemo(() => {
    const m = new Map<string, number>()
    s.organizations.forEach((o) => m.set(o.category, (m.get(o.category) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.organizations])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · ORGANISATIONS"
        title="Organisations"
        subtitle="Fictional corporate and institutional entities linked to profiles, cases and financial standing."
        icon={Building2}
        meta={
          <>
            <span className="badge badge-cyan">{s.organizations.length} ENTITIES</span>
            <span className="badge badge-blue">{cats.length} CATEGORIES</span>
            <span className="badge badge-amber">{s.organizations.filter((o) => o.risk === 'high' || o.risk === 'severe').length} FLAGGED</span>
            <span className="badge badge-grey">SYNTHETIC</span>
          </>
        }
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => downloadFile(`shadow-organisations-${Date.now()}.csv`, toCSV(s.organizations.map(({ id, name, hq, country, category, status, risk, founded, revenue }) => ({ id, name, hq, country, category, status, risk, founded, revenue }))), 'text/csv')}
          >
            <Download size={11} /> Export
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entities" value={s.organizations.length} icon={Building2} accent="cyan" />
        <StatCard label="Countries" value={new Set(s.organizations.map((o) => o.country)).size} icon={Globe2} accent="blue" />
        <StatCard label="Linked profiles" value={s.identities.filter((i) => i.orgId).length} icon={Users} accent="green" />
        <StatCard label="Linked cases" value={s.organizations.reduce((a, o) => a + o.caseIds.length, 0)} icon={FolderOpen} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <Panel title="Entity Register" icon={Building2} bodyClassName="p-0"
            actions={
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="field h-6 w-32 pl-6 text-[10px]" />
                </div>
                <Select className="w-32" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All sectors' }, ...cats.map((c) => ({ value: c, label: c }))]} />
              </div>
            }
          >
            <div className="grid gap-2 p-2 sm:grid-cols-2">
              {filtered.map((o) => {
                const people = s.identities.filter((i) => i.orgId === o.id).length
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelected(o.id)}
                    className={cn('panel-flat p-2.5 text-left transition-colors', selected === o.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:border-line-strong')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mono text-[8.5px] uppercase tracking-widest text-ink-3">{o.id}</p>
                        <p className="truncate text-[11.5px] font-medium text-ink">{o.name}</p>
                        <p className="truncate font-mono text-[9px] text-ink-3">{o.category} · {o.hq}, {o.country}</p>
                      </div>
                      <SeverityPill value={o.risk} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 font-mono text-[8.5px] text-ink-3">
                      <span>{people} profiles</span>
                      <span>{o.caseIds.length} cases</span>
                      <span className="ml-auto">{o.revenue}</span>
                    </div>
                  </button>
                )
              })}
            </div>
            {filtered.length === 0 && <EmptyState icon={Building2} title="No entities match" />}
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Sector Mix" icon={Globe2}>
              <Donut
                data={catDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
                height={168}
                centerLabel="SECTORS"
                centerValue={String(catDist.length)}
              />
            </Panel>
            <Panel title="Linked Profiles by Entity" icon={Users} subtitle="Top entities by profile count">
              <BarsTrend
                horizontal
                data={s.organizations
                  .map((o) => ({ name: o.name.split(' ')[0], n: s.identities.filter((i) => i.orgId === o.id).length }))
                  .sort((a, b) => b.n - a.n)
                  .slice(0, 6)}
                keys={[{ key: 'n', color: PALETTE.cyan, label: 'Profiles' }]}
                height={168}
                xKey="name"
              />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {org ? (
            <>
              <Panel title={org.name} subtitle={org.id} icon={Building2} actions={<StatusPill value={org.status} />}>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Category', v: org.category },
                    { k: 'Headquarters', v: `${org.hq}, ${org.country}` },
                    { k: 'Founded', v: org.founded },
                    { k: 'Revenue (sim)', v: org.revenue },
                    { k: 'Risk', v: org.risk.toUpperCase() },
                    { k: 'Linked profiles', v: String(orgPeople.length) },
                    { k: 'Linked cases', v: String(orgCases.length) },
                  ]}
                />
                <Divider label="REGISTRY" />
                <div className="flex flex-wrap gap-1">
                  <Tag tone="#28d8ea">SIMULATED ENTITY</Tag>
                  <Tag>{org.category.toUpperCase()}</Tag>
                  <Tag tone="#f5b942">{org.risk.toUpperCase()}</Tag>
                </div>
              </Panel>

              <Panel title="People" icon={Users} bodyClassName="p-0">
                <ul className="divide-y divide-line-soft">
                  {orgPeople.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 px-2.5 py-1.5">
                      <Avatar seed={p.avatarSeed} size={22} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10.5px] text-ink">{p.name}</span>
                        <span className="block truncate font-mono text-[8.5px] text-ink-3">{p.occupation}</span>
                      </span>
                      <SeverityPill value={p.risk} />
                    </li>
                  ))}
                  {orgPeople.length === 0 && <li className="px-2.5 py-3 text-[10.5px] text-ink-3">No linked profiles.</li>}
                </ul>
              </Panel>

              <Panel title="Cases" icon={FolderOpen} bodyClassName="p-0">
                <ul className="divide-y divide-line-soft">
                  {orgCases.map((c) => (
                    <li key={c.id} className="px-2.5 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="mono text-[9px] text-[var(--accent)]">{c.code}</span>
                        <SeverityPill value={c.priority} />
                      </div>
                      <p className="text-[10.5px] text-ink">{c.title}</p>
                      <Progress value={c.progress} height={2} className="mt-1" />
                    </li>
                  ))}
                  {orgCases.length === 0 && <li className="px-2.5 py-3 text-[10.5px] text-ink-3">No linked cases.</li>}
                </ul>
              </Panel>

              <Panel title="Entity Detail" icon={Landmark}>
                <Doc>{`ENTITY ${org.id}\nname: ${org.name}\ncategory: ${org.category}\nhq: ${org.hq}, ${org.country}\nfounded: ${org.founded}\nrisk: ${org.risk}\nprofiles: ${orgPeople.map((p) => p.name).join(', ') || 'none'}\nstatus: ${org.status}\n\nAll fields are synthetic and generated for the SHADOW SYSTEMS simulation.`}</Doc>
              </Panel>
            </>
          ) : (
            <Panel title="Entity Detail"><EmptyState icon={Building2} title="Select an entity" /></Panel>
          )}
        </div>
      </div>

      <Panel title="Register" icon={TrendingUp} bodyClassName="p-0">
        <div className="max-h-[40vh] overflow-auto">
          <table className="data-table min-w-[820px]">
            <thead><tr><th>ID</th><th>Entity</th><th>Category</th><th>HQ</th><th>Founded</th><th>Revenue</th><th>Profiles</th><th>Cases</th><th>Status</th><th>Risk</th></tr></thead>
            <tbody>
              {s.organizations.map((o) => (
                <tr key={o.id} className="cursor-pointer" onClick={() => setSelected(o.id)} data-selected={selected === o.id}>
                  <td className="mono text-[9px] text-[var(--accent)]">{o.id}</td>
                  <td className="text-[10.5px] text-ink">{o.name}</td>
                  <td className="text-[10px]">{o.category}</td>
                  <td className="text-[10px]">{o.hq}, {o.country}</td>
                  <td className="mono text-[9px]">{o.founded}</td>
                  <td className="mono text-[9px] text-ink-2">{o.revenue}</td>
                  <td className="mono text-[9.5px]">{s.identities.filter((i) => i.orgId === o.id).length}</td>
                  <td className="mono text-[9.5px]">{o.caseIds.length}</td>
                  <td><StatusPill value={o.status} dot={false} /></td>
                  <td><SeverityPill value={o.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <InlineAlert tone="cyan" title="Invented entities">
        Corporation names, revenues, headquarters and founders are synthetic. They do not represent real organisations.
      </InlineAlert>
    </Screen>
  )
}
