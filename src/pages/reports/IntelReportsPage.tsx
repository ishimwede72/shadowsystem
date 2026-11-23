import { BrainCircuit, Users, FolderOpen, Network, ShieldAlert } from 'lucide-react'
import { PALETTE } from '@/components/charts'
import { DepartmentReports, type DeptConfig } from './shared'

const cfg: DeptConfig = {
  type: 'intelligence',
  title: 'Intelligence Reports',
  eyebrow: 'REPORTS · INTELLIGENCE',
  subtitle: 'Case, profile and link-graph briefings assembled from the fictional intelligence database.',
  icon: BrainCircuit,
  accent: 'cyan',
  color: PALETTE.cyan,
  stats: (s) => [
    { label: 'Cases', value: s.cases.length, icon: FolderOpen, accent: 'cyan' },
    { label: 'Profiles', value: s.identities.length, icon: Users, accent: 'blue' },
    { label: 'Organisations', value: s.organizations.length, icon: ShieldAlert, accent: 'amber' },
    { label: 'Graph nodes', value: s.graph.nodes.length, icon: Network, accent: 'green' },
  ],
  chart: () => ({
    subtitle: 'Case throughput (generated)',
    data: Array.from({ length: 12 }, (_, i) => ({
      t: `W${i + 1}`,
      opened: 1 + Math.round(Math.abs(Math.sin(i / 2.1)) * 4),
      closed: Math.round(Math.abs(Math.cos(i / 2.6)) * 3),
    })),
    keys: [{ key: 'opened', color: PALETTE.cyan, label: 'Opened' }, { key: 'closed', color: PALETTE.green, label: 'Closed' }],
  }),
  breakdown: (s) => [
    { label: 'Open cases', value: String(s.cases.filter((c) => c.status === 'open').length) },
    { label: 'Active', value: String(s.cases.filter((c) => c.status === 'active').length) },
    { label: 'Evidence records', value: String(s.evidence.length) },
    { label: 'Graph links', value: String(s.graph.links.length) },
    { label: 'Critical priority', value: String(s.cases.filter((c) => c.priority === 'critical').length) },
    { label: 'Classifications', value: 'FICTIONAL' },
  ],
  build: (s) => {
    const open = s.cases.filter((c) => c.status === 'open' || c.status === 'active')
    const highPriority = s.cases.filter((c) => c.priority === 'critical')
    return {
      title: `Intelligence Briefing — ${new Date().toISOString().slice(0, 10)}`,
      summary: `${s.cases.length} fictional cases are on file, ${open.length} of them live in the demo database. ${s.identities.length} profiles and ${s.graph.links.length} graph links describe the generated network.`,
      analysis: [
        `${highPriority.length} case${highPriority.length === 1 ? '' : 's'} carry critical priority in the simulation.`,
        `The evidence register holds ${s.evidence.length} generated records across ${s.organizations.length} organisations.`,
        `Average case progress is ${Math.round(s.cases.reduce((a, c) => a + c.progress, 0) / Math.max(1, s.cases.length))}%.`,
        'Every profile, organisation and link is invented for the demonstration.',
      ],
      metrics: [
        { label: 'Cases', value: String(s.cases.length) },
        { label: 'Live cases', value: String(open.length) },
        { label: 'Profiles', value: String(s.identities.length) },
        { label: 'Organisations', value: String(s.organizations.length) },
        { label: 'Evidence', value: String(s.evidence.length) },
      ],
      classification: 'FICTIONAL · RESTRICTED',
    }
  },
  notes: [
    'Profiles and organisations are fully synthetic.',
    'Case progress advances only through operator actions.',
    'Link graphs are generated from the same seed.',
    'No personal data of any real individual is used.',
  ],
}

export default function IntelReportsPage() {
  return <DepartmentReports cfg={cfg} />
}
