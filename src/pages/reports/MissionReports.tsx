import { Rocket, CheckCircle2, Zap, Activity } from 'lucide-react'
import { PALETTE } from '@/components/charts'
import { DepartmentReports, type DeptConfig } from './shared'

const cfg: DeptConfig = {
  type: 'mission',
  title: 'Mission Reports',
  eyebrow: 'REPORTS · MISSIONS',
  subtitle: 'After-action summaries for the simulated mission engine, including event timing and outcomes.',
  icon: Rocket,
  accent: 'amber',
  color: PALETTE.amber,
  stats: (s) => [
    { label: 'Missions', value: s.missions.length, icon: Rocket, accent: 'cyan' },
    { label: 'Completed', value: s.missions.filter((m) => m.status === 'completed').length, icon: CheckCircle2, accent: 'green' },
    { label: 'Live', value: s.missions.filter((m) => m.status === 'active' || m.status === 'paused').length, icon: Activity, accent: 'amber' },
    { label: 'Events', value: s.missions.reduce((a, m) => a + m.events.length, 0), icon: Zap, accent: 'blue' },
  ],
  chart: () => ({
    subtitle: 'Runs vs completions (generated)',
    data: Array.from({ length: 12 }, (_, i) => ({
      t: `W${i + 1}`,
      runs: 1 + Math.round(Math.abs(Math.sin(i / 2.3)) * 5),
      completed: Math.round(Math.abs(Math.cos(i / 2.8)) * 4),
    })),
    keys: [{ key: 'runs', color: PALETTE.amber, label: 'Runs' }, { key: 'completed', color: PALETTE.green, label: 'Completed' }],
  }),
  breakdown: (s) => [
    { label: 'Active', value: String(s.missions.filter((m) => m.status === 'active').length) },
    { label: 'Paused', value: String(s.missions.filter((m) => m.status === 'paused').length) },
    { label: 'Stopped', value: String(s.missions.filter((m) => m.status === 'stopped').length) },
    { label: 'Templates', value: String(s.templates.length) },
    { label: 'Avg progress', value: `${Math.round(s.missions.reduce((a, m) => a + m.progress, 0) / Math.max(1, s.missions.length))}%` },
    { label: 'Runner', value: 'LOCAL' },
  ],
  build: (s) => {
    const done = s.missions.filter((m) => m.status === 'completed')
    const live = s.missions.filter((m) => m.status === 'active')
    return {
      title: `Mission After-Action — ${new Date().toISOString().slice(0, 10)}`,
      summary: `${s.missions.length} simulated missions are registered; ${done.length} completed and ${live.length} running at the time of compilation. ${s.templates.length} scenario templates are available.`,
      analysis: [
        done.length ? `Most recent completed mission: ${done[0].code} — ${done[0].name}.` : 'No mission has completed yet in this session.',
        `Average recorded progress is ${Math.round(s.missions.reduce((a, m) => a + m.progress, 0) / Math.max(1, s.missions.length))}%.`,
        `The mission engine has published ${s.bus.filter((b) => b.topic.startsWith('MISSION.')).length} events this session.`,
        'All operations are scripted demonstrations against demo modules.',
      ],
      metrics: [
        { label: 'Missions', value: String(s.missions.length) },
        { label: 'Completed', value: String(done.length) },
        { label: 'Active', value: String(live.length) },
        { label: 'Templates', value: String(s.templates.length) },
        { label: 'Bus events', value: String(s.bus.filter((b) => b.topic.startsWith('MISSION.')).length) },
      ],
      classification: 'FICTIONAL · INTERNAL',
    }
  },
  notes: [
    'Mission progress advances with the simulation tick.',
    'Scripted events can drive other demo modules.',
    'Stopping a mission skips remaining events.',
    'No tasking is sent to a real team.',
  ],
}

export default function MissionReports() {
  return <DepartmentReports cfg={cfg} />
}
