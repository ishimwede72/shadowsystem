import { ShieldAlert, Shield, Bug, Flame } from 'lucide-react'
import { PALETTE } from '@/components/charts'
import { DepartmentReports, type DeptConfig } from './shared'
import { pad } from '@/lib/utils'

const cfg: DeptConfig = {
  type: 'incident',
  title: 'Cyber Incidents',
  eyebrow: 'REPORTS · CYBER',
  subtitle: 'Perimeter, firewall and vulnerability reporting over the simulated cyber range.',
  icon: ShieldAlert,
  accent: 'red',
  color: PALETTE.red,
  stats: (s) => [
    { label: 'Findings', value: s.findings.length, icon: Bug, accent: 'cyan' },
    { label: 'Critical', value: s.findings.filter((f) => f.severity === 'critical').length, icon: ShieldAlert, accent: 'red' },
    { label: 'Firewall rules', value: s.firewall.length, icon: Shield, accent: 'green' },
    { label: 'Events', value: s.cyberEvents.length, icon: Flame, accent: 'amber' },
  ],
  chart: () => ({
    subtitle: 'Observed simulated events per window',
    data: Array.from({ length: 14 }, (_, i) => ({
      t: `${pad(i * 2)}h`,
      blocked: 6 + Math.round(Math.abs(Math.sin(i / 2.2)) * 14),
      allowed: 2 + Math.round(Math.abs(Math.cos(i / 3.1)) * 6),
    })),
    keys: [{ key: 'blocked', color: PALETTE.red, label: 'Blocked' }, { key: 'allowed', color: PALETTE.cyan, label: 'Allowed' }],
  }),
  breakdown: (s) => [
    { label: 'Open findings', value: String(s.findings.filter((f) => f.status !== 'remediated').length) },
    { label: 'Rules enabled', value: String(s.firewall.filter((r) => r.enabled).length) },
    { label: 'Blocked events', value: String(s.cyberEvents.filter((e) => e.blocked).length) },
    { label: 'Highest score', value: String(Math.max(...s.findings.map((f) => f.score), 0)) },
    { label: 'Assets affected', value: String(new Set(s.findings.map((f) => f.asset)).size) },
    { label: 'Range', value: 'SIMULATED' },
  ],
  build: (s) => {
    const crit = s.findings.filter((f) => f.severity === 'critical')
    const blocked = s.cyberEvents.filter((e) => e.blocked).length
    return {
      title: `Cyber Posture — ${new Date().toISOString().slice(0, 10)}`,
      summary: `The simulated perimeter reports ${s.findings.length} findings, ${crit.length} of them critical, against ${s.firewall.length} firewall rules. ${blocked} of ${s.cyberEvents.length} observed events were blocked.`,
      analysis: [
        crit.length ? `Remediate ${crit.length} critical finding${crit.length === 1 ? '' : 's'} first: ${crit.slice(0, 3).map((c) => c.asset).join(', ')}.` : 'No critical findings remain in this snapshot.',
        `${s.firewall.filter((r) => r.enabled).length} of ${s.firewall.length} rules are enabled.`,
        `Average finding score is ${Math.round(s.findings.reduce((a, f) => a + f.score, 0) / Math.max(1, s.findings.length))}/100.`,
        'All telemetry is generated for the demonstration; no real host is probed.',
      ],
      metrics: [
        { label: 'Findings', value: String(s.findings.length) },
        { label: 'Critical', value: String(crit.length) },
        { label: 'Rules', value: String(s.firewall.length) },
        { label: 'Blocked events', value: String(blocked) },
        { label: 'Assets', value: String(new Set(s.findings.map((f) => f.asset)).size) },
      ],
      classification: 'FICTIONAL · RESTRICTED',
    }
  },
  notes: [
    'Findings and events are generated, not scanned.',
    'Rule toggles affect local state only.',
    'No traffic is captured or inspected.',
    'Assets are fictional hostnames.',
  ],
}

export default function CyberReports() {
  return <DepartmentReports cfg={cfg} />
}
