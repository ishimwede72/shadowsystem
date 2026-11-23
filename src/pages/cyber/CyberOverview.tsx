import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, KeyRound, Lock, Network, ShieldAlert, ShieldCheck,
  Terminal, Zap, ArrowUpRight, Bug, Radar,
} from 'lucide-react'
import { Panel, PageHeader, StatCard, Screen, StatusPill, Progress, SeverityPill, KeyValue, InlineAlert, Divider } from '@/components/ui'
import { AreaTrend, Donut, PALETTE, ChartLegend, RadarMetric } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtTime, relTime } from '@/lib/utils'

const MODULE_LINKS = [
  { title: 'Terminal Workspace', to: '/cyber/terminal', icon: Terminal, desc: 'Multi-session scripted shell with history and themes', accent: 'green' },
  { title: 'Access Simulation', to: '/cyber/access', icon: ShieldCheck, desc: 'Cinematic authorization sequences with outcomes', accent: 'cyan' },
  { title: 'Firewall Simulator', to: '/cyber/firewall', icon: ShieldAlert, desc: 'Ruleset editor, live events, canned demonstration', accent: 'blue' },
  { title: 'Password Laboratory', to: '/cyber/password-lab', icon: KeyRound, desc: 'Entropy analysis and strength education', accent: 'amber' },
  { title: 'Encryption Lab', to: '/cyber/encryption', icon: Lock, desc: 'Cipher walkthrough and local verification', accent: 'green' },
  { title: 'Vulnerability Assessment', to: '/cyber/vulnerabilities', icon: Bug, desc: 'Fictional findings, scoring and remediation', accent: 'amber' },
  { title: 'Server Infiltration', to: '/cyber/server-lab', icon: Radar, desc: 'Scripted movie sequence, success and failure', accent: 'red' },
  { title: 'Cyber Activity', to: '/cyber/activity', icon: Activity, desc: 'Full simulated event stream and filters', accent: 'cyan' },
]

export default function CyberOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const blocked = s.cyberEvents.filter((e) => e.blocked).length
  const criticalFindings = s.findings.filter((f) => f.severity === 'critical')
  const openFindings = s.findings.filter((f) => f.status === 'open')

  const eventSeries = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        t: `${String(i).padStart(2, '0')}h`,
        blocked: Math.round(14 + Math.sin(i / 2.2) * 8 + (i % 5)),
        allowed: Math.round(30 + Math.cos(i / 3) * 12),
      })),
    [],
  )

  const sevMix = [
    { name: 'Critical', value: criticalFindings.length, color: PALETTE.red },
    { name: 'Elevated', value: s.findings.filter((f) => f.severity === 'elevated').length, color: PALETTE.amber },
    { name: 'Low', value: s.findings.filter((f) => f.severity === 'low').length, color: PALETTE.green },
  ]

  const posture = [
    { axis: 'Perimeter', value: 82 },
    { axis: 'Identity', value: 67 },
    { axis: 'Endpoint', value: 74 },
    { axis: 'Data', value: 58 },
    { axis: 'Monitoring', value: 88 },
    { axis: 'Response', value: 63 },
  ]

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · SANDBOX"
        title="Cyber Operations"
        subtitle="A cinematic security operations environment. Every scan, rule and finding is simulated inside a sealed sandbox."
        icon={Terminal}
        meta={
          <>
            <span className="badge badge-green">SANDBOX SEALED</span>
            <span className="badge badge-grey">{s.cyberEvents.length} EVENTS</span>
            <span className="badge badge-amber">{openFindings.length} OPEN FINDINGS</span>
            {criticalFindings.length > 0 && <span className="badge badge-red">{criticalFindings.length} CRITICAL</span>}
          </>
        }
        actions={<button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/cyber/terminal')}><Terminal size={11} /> Launch terminal</button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Simulated Events" value={s.cyberEvents.length} icon={Activity} accent="cyan" sub={`${blocked} blocked`} />
        <StatCard label="Open Findings" value={openFindings.length} icon={Bug} accent="amber" sub={`${s.findings.length} total`} onClick={() => navigate('/cyber/vulnerabilities')} />
        <StatCard label="Critical" value={criticalFindings.length} icon={AlertTriangle} accent="red" sub="requires review" />
        <StatCard label="Firewall Rules" value={s.firewall.filter((f) => f.enabled).length} icon={ShieldAlert} accent="blue" sub={`${s.firewall.length} configured`} onClick={() => navigate('/cyber/firewall')} />
        <StatCard label="Blocked Rate" value={`${((blocked / Math.max(1, s.cyberEvents.length)) * 100).toFixed(0)}%`} icon={ShieldCheck} accent="green" delta={{ value: 3.1 }} />
        <StatCard label="Sandbox Mode" value="SEALED" icon={Zap} accent="green" sub="no external access" />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Event Throughput" icon={Activity} subtitle="Simulated blocked vs. allowed traffic" className="xl:col-span-2">
          <AreaTrend
            data={eventSeries}
            keys={[
              { key: 'blocked', color: PALETTE.red, label: 'Blocked' },
              { key: 'allowed', color: PALETTE.green, label: 'Allowed' },
            ]}
            height={220}
          />
          <ChartLegend items={[{ label: 'Blocked', color: PALETTE.red }, { label: 'Allowed', color: PALETTE.green }]} />
        </Panel>
        <Panel title="Finding Severity" icon={Bug} subtitle="Assessment results">
          <Donut data={sevMix} height={190} centerLabel="FINDINGS" centerValue={String(s.findings.length)} />
          <div className="space-y-1">
            {sevMix.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-ink-2">
                  <span className="h-1.5 w-1.5" style={{ background: m.color }} /> {m.name}
                </span>
                <span className="mono text-[9.5px] text-ink-3">{m.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {MODULE_LINKS.map((m) => (
          <button key={m.to} type="button" onClick={() => navigate(m.to)} className="panel group p-3 text-left transition-colors hover:border-[color-mix(in_srgb,var(--accent)_50%,var(--color-line))]">
            <div className="flex items-start justify-between">
              <m.icon size={17} className={cn(m.accent === 'red' ? 'text-red' : m.accent === 'amber' ? 'text-amber' : m.accent === 'blue' ? 'text-blue' : m.accent === 'cyan' ? 'text-cyan' : 'text-green')} />
              <ArrowUpRight size={12} className="text-ink-3 transition-colors group-hover:text-[var(--accent)]" />
            </div>
            <h3 className="mt-2 font-display text-[12.5px] font-medium uppercase tracking-wide text-ink">{m.title}</h3>
            <p className="mt-1 text-[10.5px] leading-relaxed text-ink-3">{m.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <Panel title="Live Event Stream" icon={Activity} className="xl:col-span-2" bodyClassName="p-0"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/cyber/activity')}>Full stream <ArrowUpRight size={10} /></button>}
        >
          <div className="max-h-[300px] overflow-y-auto font-terminal text-[10.5px]">
            {s.cyberEvents.slice(0, 16).map((e) => (
              <div key={e.id} className="flex items-center gap-2 border-b border-line-soft/50 px-2.5 py-1">
                <span className="shrink-0 text-ink-3">{fmtTime(e.timestamp)}</span>
                <span className={cn('shrink-0', e.blocked ? 'text-green' : 'text-red')}>{e.blocked ? '⛔' : '⚠'}</span>
                <span className="w-32 shrink-0 truncate text-ink-2">{e.type}</span>
                <span className="hidden min-w-0 flex-1 truncate font-mono text-[9.5px] text-ink-3 sm:block">{e.source} → {e.target}</span>
                <SeverityPill value={e.severity} />
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Security Posture" icon={Radar} subtitle="Heuristic demonstration scoring">
            <RadarMetric data={posture} height={180} color={PALETTE.green} />
          </Panel>
          <Panel title="Sandbox Vitals" icon={Network}>
            <KeyValue
              cols={1}
              items={[
                { k: 'Interpreter', v: 'SCRIPTED' },
                { k: 'External sockets', v: 'BLOCKED' },
                { k: 'OS calls', v: 'DISABLED' },
                { k: 'Credentials', v: 'NOT COLLECTED' },
                { k: 'Last event', v: s.cyberEvents[0] ? relTime(s.cyberEvents[0].timestamp) : '—' },
              ]}
            />
            <Divider />
            <p className="font-mono text-[8.5px] leading-relaxed text-ink-3">
              Containment is architectural, not policy-based: the browser sandbox provides no route to a network or
              operating system from these interfaces.
            </p>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Firewall Ruleset" icon={ShieldAlert} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/cyber/firewall')}>Manage <ArrowUpRight size={10} /></button>}>
          <ul className="space-y-1.5">
            {s.firewall.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-b border-line-soft/60 pb-1">
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[10px] text-ink">{r.name}</span>
                  <span className="block font-mono text-[8.5px] text-ink-3">{r.direction} · {r.protocol}/{r.port}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="mono text-[9px] text-ink-3">{r.hits} hits</span>
                  <StatusPill value={r.enabled ? 'active' : 'inactive'} label={r.action} dot={false} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Assessment Findings" icon={Bug} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/cyber/vulnerabilities')}>Open <ArrowUpRight size={10} /></button>}>
          <ul className="space-y-1.5">
            {s.findings.slice(0, 6).map((f) => (
              <li key={f.id} className="border-b border-line-soft/60 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10.5px] text-ink-2">{f.title}</span>
                  <SeverityPill value={f.severity} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={f.score * 10} color={f.severity === 'critical' ? PALETTE.red : f.severity === 'elevated' ? PALETTE.amber : PALETTE.green} height={2} />
                  <span className="mono shrink-0 text-[8.5px] text-ink-3">CVSS {f.score}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Sealed sandbox">
        No hacking, scanning, credential access or network activity occurs anywhere in this module. All sequences are
        scripted reproductions for film and demonstration.
      </InlineAlert>
    </Screen>
  )
}
