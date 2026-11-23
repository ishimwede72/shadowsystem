import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BrainCircuit, Users, Building2, FolderOpen, Network, FileText, ShieldAlert,
  ArrowUpRight, Activity, Radio,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Progress, KeyValue, InlineAlert, Divider, Avatar } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, RadarMetric } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, relTime } from '@/lib/utils'

export default function IntelOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const open = s.cases.filter((c) => c.status === 'open' || c.status === 'active')
  const flagged = s.identities.filter((i) => i.status === 'flagged' || i.risk === 'high' || i.risk === 'severe')

  const riskDist = useMemo(() => {
    const m = new Map<string, number>()
    s.identities.forEach((i) => m.set(i.risk, (m.get(i.risk) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.identities])

  const trend = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        t: `D${i + 1}`,
        leads: Math.round(8 + Math.sin(i / 1.9) * 5 + (i % 3)),
        links: Math.round(14 + Math.cos(i / 2.4) * 7),
      })),
    [],
  )

  const radar = useMemo(
    () => [
      { axis: 'Coverage', value: 76 },
      { axis: 'Sources', value: 62 },
      { axis: 'Link depth', value: 81 },
      { axis: 'Freshness', value: 55 },
      { axis: 'Confidence', value: 70 },
      { axis: 'Cases', value: 48 },
    ],
    [],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="INTELLIGENCE · OVERVIEW"
        title="Intelligence Directorate"
        subtitle="Fictional person, organisation and case intelligence with relationship analysis and confidence scoring."
        icon={BrainCircuit}
        meta={
          <>
            <span className="badge badge-cyan">{s.identities.length} PROFILES</span>
            <span className="badge badge-blue">{s.organizations.length} ORGS</span>
            <span className="badge badge-amber">{open.length} OPEN CASES</span>
            <span className="badge badge-grey">{s.graph.nodes.length} GRAPH NODES</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/intelligence/relationships')}><Network size={11} /> Graph</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/intelligence/cases')}><FolderOpen size={11} /> Cases</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Profiles" value={s.identities.length} icon={Users} accent="cyan" onClick={() => navigate('/intelligence/people')} />
        <StatCard label="Organisations" value={s.organizations.length} icon={Building2} accent="blue" onClick={() => navigate('/intelligence/organizations')} />
        <StatCard label="Open cases" value={open.length} icon={FolderOpen} accent="amber" onClick={() => navigate('/intelligence/cases')} />
        <StatCard label="Flagged" value={flagged.length} icon={ShieldAlert} accent="red" />
        <StatCard label="Graph links" value={s.graph.links.length} icon={Network} accent="green" onClick={() => navigate('/intelligence/relationships')} />
        <StatCard label="Evidence" value={s.evidence.length} icon={FileText} accent="cyan" onClick={() => navigate('/intelligence/records')} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Collection Trend" icon={Activity} className="lg:col-span-2" subtitle="New leads and links per simulated day">
          <AreaTrend
            data={trend}
            keys={[{ key: 'leads', color: PALETTE.cyan, label: 'Leads' }, { key: 'links', color: PALETTE.blue, label: 'Links' }]}
            height={200}
          />
          <ChartLegend items={[{ label: 'New leads', color: PALETTE.cyan }, { label: 'Graph links', color: PALETTE.blue }]} />
        </Panel>
        <Panel title="Directorate Score" icon={BrainCircuit} subtitle="Composite fictional readiness">
          <RadarMetric data={radar} height={210} />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Panel title="Priority Cases" icon={FolderOpen} bodyClassName="p-0"
          actions={<button type="button" className="icon-btn" aria-label="Open /intelligence/cases" title="Open /intelligence/cases" onClick={() => navigate('/intelligence/cases')}><ArrowUpRight size={12} /></button>}
        >
          <ul className="divide-y divide-line-soft">
            {open.slice(0, 5).map((c) => (
              <li key={c.id} className="px-2.5 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <button type="button" className="min-w-0 text-left" onClick={() => navigate(`/intelligence/cases?q=${c.id}`)}>
                    <span className="mono block text-[9px] text-[var(--accent)]">{c.code}</span>
                    <span className="block truncate text-[10.5px] text-ink">{c.title}</span>
                  </button>
                  <SeverityPill value={c.priority} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={c.progress} height={2} className="flex-1" color={c.progress > 70 ? PALETTE.green : PALETTE.cyan} />
                  <span className="mono text-[8.5px] text-ink-3">{c.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Watch List" icon={Users} bodyClassName="p-0"
          actions={<button type="button" className="icon-btn" aria-label="Open /intelligence/people" title="Open /intelligence/people" onClick={() => navigate('/intelligence/people')}><ArrowUpRight size={12} /></button>}
        >
          <ul className="divide-y divide-line-soft">
            {flagged.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <Avatar seed={p.avatarSeed} size={22} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10.5px] text-ink">{p.name}</span>
                  <span className="block truncate font-mono text-[8.5px] text-ink-3">{p.alias[0] ?? p.id}</span>
                </span>
                <span className={cn('mono text-[8.5px] uppercase', p.risk === 'severe' ? 'text-red' : 'text-amber')}>{p.risk}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Risk Distribution" icon={ShieldAlert}>
          <Donut
            data={riskDist.map(([name, value], i) => ({ name, value, color: [PALETTE.red, PALETTE.amber, PALETTE.cyan, PALETTE.green][i % 4] }))}
            height={168}
            centerLabel="PROFILES"
            centerValue={String(s.identities.length)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Organisation Snapshot" icon={Building2} bodyClassName="p-0"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/intelligence/organizations')}>All <ArrowUpRight size={10} /></button>}
        >
          <table className="data-table">
            <thead><tr><th>Entity</th><th>Category</th><th>HQ</th><th>Status</th><th>Risk</th></tr></thead>
            <tbody>
              {s.organizations.slice(0, 6).map((o) => (
                <tr key={o.id} className="cursor-pointer" onClick={() => navigate(`/intelligence/organizations?q=${o.id}`)}>
                  <td className="text-[10.5px] text-ink">{o.name}</td>
                  <td className="text-[10px] text-ink-2">{o.category}</td>
                  <td className="text-[10px]">{o.hq}</td>
                  <td><StatusPill value={o.status} dot={false} /></td>
                  <td><SeverityPill value={o.risk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Latest Activity" icon={Radio} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {s.activity.filter((a) => ['intelligence', 'forensics', 'missions'].includes(a.module)).slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="dot shrink-0 bg-[var(--accent)]" />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-2">{a.action} — {a.detail}</span>
                <span className="shrink-0 font-mono text-[8px] uppercase text-ink-3">{a.module}</span>
                <span className="shrink-0 font-mono text-[8px] text-ink-3">{relTime(a.ts)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Directorate Notes" icon={BrainCircuit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue cols={1} items={[{ k: 'Profiles', v: `${s.identities.length} synthetic` }, { k: 'Aliases', v: String(s.identities.reduce((a, i) => a + i.alias.length, 0)) }]} />
          <KeyValue cols={1} items={[{ k: 'Connected orgs', v: String(new Set(s.identities.map((i) => i.orgId).filter(Boolean)).size) }, { k: 'Tags', v: String(new Set(s.identities.flatMap((i) => i.tags)).size) }]} />
          <KeyValue cols={1} items={[{ k: 'Evidence items', v: String(s.evidence.length) }, { k: 'Sealed', v: String(s.evidence.filter((e) => e.status === 'sealed').length) }]} />
          <KeyValue cols={1} items={[{ k: 'Cases closed', v: String(s.cases.filter((c) => c.status === 'closed').length) }, { k: 'Cold', v: String(s.cases.filter((c) => c.status === 'cold').length) }]} />
        </div>
        <Divider />
        <InlineAlert tone="cyan" title="Entirely fictional">
          Names, organisations, addresses and relationships are procedurally generated. Any resemblance to real entities is
          coincidental.
        </InlineAlert>
      </Panel>
    </Screen>
  )
}
