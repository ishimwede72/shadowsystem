import { Network, Server, Link2, Activity, Gauge } from 'lucide-react'
import { PALETTE } from '@/components/charts'
import { DepartmentReports, type DeptConfig } from './shared'

const cfg: DeptConfig = {
  type: 'network',
  title: 'Network Reports',
  eyebrow: 'REPORTS · NETWORK',
  subtitle: 'Topology health, link status and utilisation reporting for the simulated mesh.',
  icon: Network,
  accent: 'blue',
  color: PALETTE.blue,
  stats: (s) => [
    { label: 'Nodes', value: s.networkNodes.length, icon: Server, accent: 'cyan' },
    { label: 'Links', value: s.networkLinks.length, icon: Link2, accent: 'blue' },
    { label: 'Online', value: s.networkNodes.filter((n) => n.status === 'online').length, icon: Activity, accent: 'green' },
    { label: 'Avg load', value: `${Math.round(s.networkNodes.reduce((a, n) => a + n.load, 0) / Math.max(1, s.networkNodes.length))}%`, icon: Gauge, accent: 'amber' },
  ],
  chart: (s) => ({
    subtitle: 'Simulated throughput samples',
    data: s.traffic.slice(-16).map((t) => ({ t: `${t.t}`, inbound: t.inbound, outbound: t.outbound })),
    keys: [{ key: 'inbound', color: PALETTE.cyan, label: 'Inbound' }, { key: 'outbound', color: PALETTE.blue, label: 'Outbound' }],
  }),
  breakdown: (s) => [
    { label: 'Zones', value: String(new Set(s.networkNodes.map((n) => n.zone)).size) },
    { label: 'Congested links', value: String(s.networkLinks.filter((l) => l.status === 'congested').length) },
    { label: 'Down links', value: String(s.networkLinks.filter((l) => l.status === 'down').length) },
    { label: 'Avg latency', value: `${Math.round(s.networkNodes.reduce((a, n) => a + n.latency, 0) / Math.max(1, s.networkNodes.length))} ms` },
    { label: 'Traffic samples', value: String(s.traffic.length) },
    { label: 'Topology', value: 'GENERATED' },
  ],
  build: (s) => {
    const avgLoad = Math.round(s.networkNodes.reduce((a, n) => a + n.load, 0) / Math.max(1, s.networkNodes.length))
    const down = s.networkNodes.filter((n) => n.status !== 'online')
    return {
      title: `Network Health — ${new Date().toISOString().slice(0, 10)}`,
      summary: `${s.networkNodes.length} simulated nodes and ${s.networkLinks.length} links were sampled. Average load is ${avgLoad}% with ${down.length} node${down.length === 1 ? '' : 's'} not fully online.`,
      analysis: [
        `${s.networkLinks.filter((l) => l.status === 'congested').length} links are marked congested in the generated topology.`,
        `Zones with the highest load: ${[...s.networkNodes].sort((a, b) => b.load - a.load).slice(0, 3).map((n) => n.label).join(', ')}.`,
        `Traffic samples show a mean inbound volume of ${Math.round(s.traffic.reduce((a, t) => a + t.inbound, 0) / Math.max(1, s.traffic.length))} units.`,
        'No packet leaves this browser; topology is illustrative.',
      ],
      metrics: [
        { label: 'Nodes', value: String(s.networkNodes.length) },
        { label: 'Links', value: String(s.networkLinks.length) },
        { label: 'Avg load', value: `${avgLoad}%` },
        { label: 'Degraded nodes', value: String(down.length) },
        { label: 'Traffic samples', value: String(s.traffic.length) },
      ],
      classification: 'FICTIONAL · DEMO',
    }
  },
  notes: [
    'Topology nodes and links are generated once per seed.',
    'Link state can be changed locally from the network module.',
    'Traffic figures are synthetic samples, not captures.',
    'Latency values are illustrative milliseconds.',
  ],
}

export default function NetworkReports() {
  return <DepartmentReports cfg={cfg} />
}
