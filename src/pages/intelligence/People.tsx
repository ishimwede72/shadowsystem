import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, Search, Download, Filter, ShieldAlert, Building2, FolderOpen, Tag as TagIcon,
  ArrowUpRight, Fingerprint, MapPin, Briefcase, CalendarDays,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, Tabs, EmptyState, InlineAlert, KeyValue, Avatar, Divider, Progress, Tag } from '@/components/ui'
import { Donut, PALETTE } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, toCSV, fmtDateTime } from '@/lib/utils'

export default function People() {
  const [params] = useSearchParams()
  const s = useEngine()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [risk, setRisk] = useState('all')
  const [status, setStatus] = useState('all')
  const [org, setOrg] = useState('all')
  const [selected, setSelected] = useState<string | null>(s.identities[0]?.id ?? null)
  const [view, setView] = useState('grid')

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.identities.filter((i) => {
      if (t && !`${i.name} ${i.alias.join(' ')} ${i.occupation} ${i.nationality} ${i.id}`.toLowerCase().includes(t)) return false
      if (risk !== 'all' && i.risk !== risk) return false
      if (status !== 'all' && i.status !== status) return false
      if (org !== 'all' && i.orgId !== org) return false
      return true
    })
  }, [s.identities, q, risk, status, org])

  const person = s.identities.find((i) => i.id === selected)
  const personOrg = s.organizations.find((o) => o.id === person?.orgId)
  const personCases = s.cases.filter((c) => person?.caseIds.includes(c.id))

  const riskDonut = useMemo(() => {
    const m = new Map<string, number>()
    s.identities.forEach((i) => m.set(i.risk, (m.get(i.risk) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.identities])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · PROFILES"
        title="Person Profiles"
        subtitle="Ten or more fictional dossiers generated for the simulation, complete with aliases, associates and case links."
        icon={Users}
        meta={
          <>
            <span className="badge badge-cyan">{s.identities.length} PROFILES</span>
            <span className="badge badge-grey">{filtered.length} FILTERED</span>
            <span className="badge badge-amber">{s.identities.filter((i) => i.risk === 'high' || i.risk === 'severe').length} HIGH RISK</span>
            <span className="badge badge-blue">SYNTHETIC</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={view} onChange={setView} tabs={[{ id: 'grid', label: 'Cards' }, { id: 'table', label: 'Table' }]} />
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => downloadFile(`shadow-profiles-${Date.now()}.csv`, toCSV(s.identities.map(({ id, name, alias, nationality, occupation, risk, status, tags }) => ({ id, name, alias: alias.join('|'), nationality, occupation, risk, status, tags: tags.join('|') }))), 'text/csv')}
            >
              <Download size={11} /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total profiles" value={s.identities.length} icon={Users} accent="cyan" />
        <StatCard label="Monitored" value={s.identities.filter((i) => i.status === 'monitored').length} icon={ShieldAlert} accent="amber" />
        <StatCard label="Flagged" value={s.identities.filter((i) => i.status === 'flagged').length} icon={Filter} accent="red" />
        <StatCard label="Cleared" value={s.identities.filter((i) => i.status === 'cleared').length} icon={TagIcon} accent="green" />
      </div>

      <Panel title="Profile Explorer" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, alias, occupation…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">RISK</p><Select className="w-28" value={risk} onChange={setRisk} options={[{ value: 'all', label: 'Any' }, { value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'high', label: 'High' }, { value: 'severe', label: 'Severe' }, { value: 'moderate', label: 'Moderate' }]} /></div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any' }, { value: 'active', label: 'Active' }, { value: 'monitored', label: 'Monitored' }, { value: 'flagged', label: 'Flagged' }, { value: 'cleared', label: 'Cleared' }]} /></div>
          <div><p className="label-xs mb-1">ORGANISATION</p><Select className="w-44" value={org} onChange={setOrg} options={[{ value: 'all', label: 'Any org' }, ...s.organizations.map((o) => ({ value: o.id, label: o.name }))]} /></div>
          <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setRisk('all'); setStatus('all'); setOrg('all') }}>Reset</button>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {view === 'grid' ? (
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    'panel-flat group relative flex flex-col gap-2 p-2.5 text-left transition-colors',
                    selected === p.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'hover:border-line-strong',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Avatar seed={p.avatarSeed} size={38} status={p.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink">{p.name}</p>
                      <p className="truncate font-mono text-[9px] text-ink-3">{p.alias.join(' · ') || 'NO KNOWN ALIAS'}</p>
                    </div>
                    <SeverityPill value={p.risk} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[8.5px] text-ink-3">
                    <span className="truncate">◈ {p.occupation}</span>
                    <span className="truncate">◈ {p.nationality}</span>
                    <span className="truncate">◈ {p.associatedAccounts.length} accounts</span>
                    <span className="truncate">◈ {p.caseIds.length} cases</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t) => <Tag key={t}>{t}</Tag>)}
                  </div>
                  <span className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"><ArrowUpRight size={10} className="text-ink-3" /></span>
                </button>
              ))}
            </div>
          ) : (
            <Panel title="All Profiles" icon={Users} bodyClassName="p-0">
              <div className="max-h-[60vh] overflow-auto">
                <table className="data-table min-w-[780px]">
                  <thead><tr><th>ID</th><th>Name</th><th>Aliases</th><th>Nationality</th><th>Occupation</th><th>Org</th><th>Risk</th><th>Status</th></tr></thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="cursor-pointer" onClick={() => setSelected(p.id)} data-selected={selected === p.id}>
                        <td className="mono text-[9.5px] text-[var(--accent)]">{p.id}</td>
                        <td className="text-[10.5px] text-ink">{p.name}</td>
                        <td className="mono text-[9px] text-ink-3">{p.alias.join(', ') || '—'}</td>
                        <td className="text-[10px]">{p.nationality}</td>
                        <td className="text-[10px]">{p.occupation}</td>
                        <td className="mono text-[9px] text-ink-3">{s.organizations.find((o) => o.id === p.orgId)?.name ?? '—'}</td>
                        <td><SeverityPill value={p.risk} /></td>
                        <td><StatusPill value={p.status} dot={false} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
          {filtered.length === 0 && <Panel title="No matches"><EmptyState icon={Users} title="No profiles match" message="Try clearing the filters." /></Panel>}

          <Panel title="Risk Mix" icon={ShieldAlert}>
            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <Donut data={riskDonut.map(([name, value], i) => ({ name, value, color: [PALETTE.red, PALETTE.amber, PALETTE.cyan, PALETTE.green, PALETTE.blue][i % 5] }))} height={150} centerLabel="PROFILES" centerValue={String(s.identities.length)} />
              <div className="grid grid-cols-2 gap-1 self-center">
                {riskDonut.map(([name, value], i) => (
                  <span key={name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase text-ink-3">
                      <span className="h-1.5 w-1.5" style={{ background: [PALETTE.red, PALETTE.amber, PALETTE.cyan, PALETTE.green, PALETTE.blue][i % 5] }} />
                      {name}
                    </span>
                    <span className="mono text-[9.5px] text-ink-2">{value}</span>
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          {person ? (
            <>
              <Panel title={`${person.name}`} subtitle={person.id} icon={Users} actions={<StatusPill value={person.status} />}>
                <div className="flex items-center gap-3">
                  <Avatar seed={person.avatarSeed} size={52} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm uppercase tracking-wide text-ink">{person.name}</p>
                    <p className="truncate font-mono text-[9px] text-ink-3">{person.alias.join(' · ') || 'NO ALIAS'}</p>
                    <div className="mt-1 flex items-center gap-1"><SeverityPill value={person.risk} /><Tag>{person.nationality}</Tag></div>
                  </div>
                </div>
                <Divider />
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Date of birth', v: fmtDateTime(person.dob).split(' ')[0] ?? person.dob },
                    { k: 'Occupation', v: person.occupation },
                    { k: 'Address', v: person.address },
                    { k: 'Organisation', v: personOrg?.name ?? 'UNLINKED' },
                    { k: 'Accounts', v: person.associatedAccounts.join(', ') || '—' },
                    { k: 'Cases', v: String(person.caseIds.length) },
                  ]}
                />
                <Divider label="TAGS" />
                <div className="flex flex-wrap gap-1">
                  {person.tags.map((t) => <Tag key={t} tone="#28d8ea">{t}</Tag>)}
                </div>
              </Panel>

              <Panel title="Linked Cases" icon={FolderOpen} bodyClassName="p-0">
                <ul className="divide-y divide-line-soft">
                  {personCases.map((c) => (
                    <li key={c.id} className="px-2.5 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="mono text-[9px] text-[var(--accent)]">{c.code}</span>
                        <SeverityPill value={c.priority} />
                      </div>
                      <p className="text-[10.5px] text-ink">{c.title}</p>
                      <Progress value={c.progress} height={2} className="mt-1" />
                    </li>
                  ))}
                  {personCases.length === 0 && <li className="px-2.5 py-3 text-[10.5px] text-ink-3">No linked cases.</li>}
                </ul>
              </Panel>

              <Panel title="Graph Position" icon={Fingerprint}>
                <KeyValue
                  items={[
                    { k: 'Nodes', v: String(s.graph.nodes.filter((n) => n.type === 'person').length) },
                    { k: 'Links touching', v: String(s.graph.links.filter((l) => l.source === person.id || l.target === person.id).length) },
                    { k: 'Aliases', v: String(person.alias.length) },
                    { k: 'Tags', v: String(person.tags.length) },
                  ]}
                />
              </Panel>
            </>
          ) : (
            <Panel title="Profile Detail"><EmptyState icon={Users} title="Select a profile" /></Panel>
          )}

          <Panel title="Data Fields" icon={MapPin}>
            <ul className="space-y-1 text-[10px] text-ink-2">
              <li className="flex gap-1.5"><Briefcase size={10} className="mt-0.5 shrink-0 text-ink-3" /> Occupation and organisation are randomly paired.</li>
              <li className="flex gap-1.5"><CalendarDays size={10} className="mt-0.5 shrink-0 text-ink-3" /> Birth dates are fictional and generated.</li>
              <li className="flex gap-1.5"><Building2 size={10} className="mt-0.5 shrink-0 text-ink-3" /> Addresses reference fictional districts only.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Not real people">
        Every profile on this page is invented by a seeded generator. No personal data, public record or real identity is used.
      </InlineAlert>
    </Screen>
  )
}
