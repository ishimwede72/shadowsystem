// ============================================================================
// SHADOW AI — local, rule-based assistant.
// Every answer is derived from live data in the simulation store. There is no
// remote model, no network call and no hidden data source. Responses are
// intentionally transparent and always fiction-flagged.
// ============================================================================
import { useEngine } from './engine'
import { fmtMoney, fmtCompact, pad } from '@/lib/utils'

export interface AiMessage {
  id: string
  role: 'user' | 'ai' | 'system'
  content: string
  ts: string
  kind?: 'text' | 'analysis' | 'report' | 'error'
  refs?: { label: string; path: string }[]
}

export interface AiSuggestion {
  id: string
  label: string
  prompt: string
  group: string
}

export const SUGGESTIONS: AiSuggestion[] = [
  { id: 's1', label: 'Summarise the current picture', prompt: 'Summarise the current operational picture', group: 'Overview' },
  { id: 's2', label: 'Financial exposure', prompt: 'What is our financial exposure right now?', group: 'Finance' },
  { id: 's3', label: 'Critical cyber findings', prompt: 'List critical cybersecurity findings', group: 'Cyber' },
  { id: 's4', label: 'Network health', prompt: 'How healthy is the network?', group: 'Network' },
  { id: 's5', label: 'Case progress', prompt: 'Summarise the intelligence cases', group: 'Intelligence' },
  { id: 's6', label: 'Active missions', prompt: 'What missions are running?', group: 'Missions' },
  { id: 's7', label: 'Camera status', prompt: 'How many cameras are online?', group: 'Surveillance' },
  { id: 's8', label: 'Draft a cyber report', prompt: 'Draft a cyber report', group: 'Reports' },
  { id: 's9', label: 'Risk ranking', prompt: 'Rank the top risks across the platform', group: 'Analysis' },
  { id: 's10', label: 'What can you do?', prompt: 'What can you do?', group: 'Help' },
]

type Intent =
  | 'overview' | 'finance' | 'cyber' | 'network' | 'intel' | 'missions'
  | 'surveillance' | 'geoint' | 'forensics' | 'market' | 'crisis' | 'comms'
  | 'report' | 'risk' | 'help' | 'disclaimer' | 'unknown'

interface Rule { intent: Intent; patterns: RegExp[] }

const RULES: Rule[] = [
  { intent: 'help', patterns: [/\b(help|what can you|capabilit|commands?|how do i use)\b/i] },
  { intent: 'disclaimer', patterns: [/\b(real|actually|is this true|fiction|fake|disclaimer|legal)\b/i] },
  { intent: 'report', patterns: [/\b(report|dossier|brief|draft|export|write up|compile)\b/i] },
  { intent: 'risk', patterns: [/\b(risk|threat|danger|worst|exposure|priorit)/i] },
  { intent: 'finance', patterns: [/\b(financ|money|bank|account|transaction|transfer|card|wallet|crypto|balance|ledger)\b/i] },
  { intent: 'cyber', patterns: [/\b(cyber|firewall|vulnerab|finding|password|encrypt|terminal|exploit|server lab)\b/i] },
  { intent: 'network', patterns: [/\b(network|latency|bandwidth|traffic|node|topolog|uptime|server)\b/i] },
  { intent: 'intel', patterns: [/\b(intel|case|profile|identit|organis|person|relationship|graph|evidence)\b/i] },
  { intent: 'missions', patterns: [/\b(mission|scenario|blackout|ghost protocol|silent transfer|red signal|dark horizon|zero trace|template)\b/i] },
  { intent: 'surveillance', patterns: [/\b(camera|surveill|feed|floor|cctv|incident)\b/i] },
  { intent: 'geoint', patterns: [/\b(geoint|target|map|location|coordinates|geofence|route|trajectory)\b/i] },
  { intent: 'forensics', patterns: [/\b(forensic|hash|metadata|timeline|artifact|artefact|file)\b/i] },
  { intent: 'market', patterns: [/\b(market|vendor|listing|order|underground|escrow)\b/i] },
  { intent: 'crisis', patterns: [/\b(crisis|emergency|outage|alert|infrastructure)\b/i] },
  { intent: 'comms', patterns: [/\b(comms|message|channel|call|dispatch|operator)\b/i] },
  { intent: 'overview', patterns: [/\b(overview|summar|status|situation|sitrep|picture|everything)\b/i] },
]

const SYSTEM_PROMPTS = {
  greet:
    'SHADOW AI online. I answer strictly from the live simulation data in this browser session — no external model, no network. Ask me about finance, cyber, network, intelligence, missions, surveillance or reports.',
  help:
    [
      'I can summarise and cross-reference the simulation store. Try:',
      '• "Summarise the current operational picture"',
      '• "What is our financial exposure?"',
      '• "List critical cyber findings"',
      '• "How healthy is the network?"',
      '• "Draft a cyber report"',
      '• "Rank the top risks"',
      '',
      'Everything I produce is fictional and generated locally from the same store that drives every screen.',
    ].join('\n'),
  disclaimer:
    'Correct — none of this is real. SHADOW SYSTEMS is a fictional cinematic simulation. Every account, person, camera, host and event is generated in your browser. There are no real banking rails, no scanning, no credential collection and no surveillance of any kind. I am a deterministic rule engine reading the local store, not a language model with external access.',
  unknown:
    'I did not match that to a module. I can speak to finance, cyber, network, intelligence, missions, surveillance, geoint, forensics, marketplace, crisis, comms or reports. Type "help" to see the full list.',
}

export function detectIntent(prompt: string): Intent {
  const p = prompt.trim()
  if (!p) return 'unknown'
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(p))) return rule.intent
  }
  return 'unknown'
}

export interface AiAnswer {
  content: string
  kind: 'text' | 'analysis' | 'report' | 'error'
  refs?: { label: string; path: string }[]
}

export function answer(prompt: string): AiAnswer {
  const s = useEngine.getState()
  const intent = detectIntent(prompt)

  switch (intent) {
    case 'help':
      return { content: SYSTEM_PROMPTS.help, kind: 'analysis', refs: [{ label: 'Command centre', path: '/command-center' }] }
    case 'disclaimer':
      return { content: SYSTEM_PROMPTS.disclaimer, kind: 'text' }
    case 'overview': {
      const unread = s.notifications.filter((n) => !n.read).length
      const active = s.missions.filter((m) => m.status === 'active' || m.status === 'paused')
      const critical = s.findings.filter((f) => f.severity === 'critical').length
      return {
        kind: 'analysis',
        content: [
          'OPERATIONAL PICTURE — generated snapshot',
          '',
          `• Operators online: ${s.operators.filter((o) => o.status === 'online').length}/${s.operators.length}`,
          `• Finance: ${s.accounts.length} accounts across ${s.banks.length} banks · notional ${fmtMoney(s.accounts.reduce((a, x) => a + x.total, 0))}`,
          `• Transactions: ${s.transactions.length} total · ${s.transactions.filter((t) => t.status === 'pending').length} pending`,
          `• Cyber: ${s.findings.length} findings, ${critical} critical · ${s.firewall.filter((f) => f.enabled).length}/${s.firewall.length} firewall rules enabled`,
          `• Network: ${s.networkNodes.filter((n) => n.status === 'online').length}/${s.networkNodes.length} nodes online · avg latency ${Math.round(s.networkNodes.reduce((a, n) => a + n.latency, 0) / Math.max(1, s.networkNodes.length))}ms`,
          `• Intelligence: ${s.identities.length} profiles · ${s.cases.length} cases (${s.cases.filter((c) => c.status === 'open' || c.status === 'active').length} live)`,
          `• Surveillance: ${s.cameras.filter((c) => c.status === 'online').length}/${s.cameras.length} cameras online`,
          `• Missions: ${active.length} in flight · ${s.missions.length} total`,
          `• Crisis: ${s.crisisIncidents.filter((c) => c.status === 'escalated' || c.status === 'monitoring').length} open incidents`,
          `• Notifications unread: ${unread}`,
          '',
          `Simulation clock: ${new Date(s.simulatedTime).toISOString().slice(0, 19).replace('T', ' ')}Z · speed ${s.speed}x · ${s.paused ? 'PAUSED' : 'RUNNING'}`,
          '',
          'All figures read directly from the shared store. Fictional demonstration data.',
        ].join('\n'),
        refs: [
          { label: 'Command centre', path: '/command-center' },
          { label: 'System health', path: '/command-center/health' },
        ],
      }
    }
    case 'finance': {
      const pending = s.transactions.filter((t) => t.status === 'pending')
      const top = [...s.accounts].sort((a, b) => b.total - a.total).slice(0, 3)
      const volume = s.transactions.reduce((a, t) => a + t.amount, 0)
      return {
        kind: 'analysis',
        content: [
          'FINANCIAL EXPOSURE — generated snapshot',
          '',
          `Accounts: ${s.accounts.length} · Banks: ${s.banks.length} · Cards: ${s.cards.length} (${s.cards.filter((c) => c.status === 'frozen').length} frozen)`,
          `Aggregate balance: ${fmtMoney(s.accounts.reduce((a, x) => a + x.total, 0))}`,
          `Transaction volume: ${fmtMoney(volume)} across ${s.transactions.length} records`,
          `Pending settlements: ${pending.length}${pending.length ? ` totalling ${fmtMoney(pending.reduce((a, t) => a + t.amount, 0))}` : ''}`,
          '',
          'Largest balances:',
          ...top.map((a) => `  · ${a.holder} — ${fmtMoney(a.total)} (${a.currency})`),
          '',
          `Wallets: ${s.wallets.length} · simulated notional ${fmtMoney(s.wallets.reduce((a, w) => a + w.balanceUsd, 0))}`,
          '',
          'No payment rail is connected. All balances live in memory and reset with the simulation.',
        ].join('\n'),
        refs: [
          { label: 'Finance overview', path: '/finance' },
          { label: 'Transfers', path: '/finance/transfers' },
        ],
      }
    }
    case 'cyber': {
      const crit = s.findings.filter((f) => f.severity === 'critical')
      const open = s.findings.filter((f) => f.status === 'open')
      return {
        kind: 'analysis',
        content: [
          'CYBER POSTURE — generated snapshot',
          '',
          `Findings: ${s.findings.length} · open ${open.length} · critical ${crit.length}`,
          `Firewall: ${s.firewall.filter((f) => f.enabled).length}/${s.firewall.length} rules enabled · ${s.firewall.reduce((a, f) => a + f.hits, 0)} simulated matches`,
          `Cyber events buffered: ${s.cyberEvents.length}`,
          '',
          crit.length ? 'Critical findings:' : 'No critical findings right now.',
          ...crit.slice(0, 5).map((f) => `  · ${f.title} — ${f.asset} (score ${f.score})`),
          '',
          'Suggested next step: review the Vulnerabilities page, then remediate the highest CVSS item in this fictional environment.',
        ].join('\n'),
        refs: [
          { label: 'Vulnerabilities', path: '/cyber/vulnerabilities' },
          { label: 'Firewall', path: '/cyber/firewall' },
        ],
      }
    }
    case 'network': {
      const online = s.networkNodes.filter((n) => n.status === 'online')
      const congested = s.networkLinks.filter((l) => l.status === 'congested' || l.status === 'down')
      const avg = s.networkNodes.reduce((a, n) => a + n.load, 0) / Math.max(1, s.networkNodes.length)
      return {
        kind: 'analysis',
        content: [
          'NETWORK HEALTH — generated snapshot',
          '',
          `Nodes online: ${online.length}/${s.networkNodes.length}`,
          `Links: ${s.networkLinks.length} · issues ${congested.length}`,
          `Average node load: ${avg.toFixed(0)}%`,
          `Average latency: ${(s.networkNodes.reduce((a, n) => a + n.latency, 0) / Math.max(1, s.networkNodes.length)).toFixed(0)}ms`,
          `Traffic samples: ${s.traffic.length}`,
          '',
          congested.length ? 'Links needing attention:' : 'All simulated links are healthy.',
          ...congested.slice(0, 5).map((l) => {
            const a = s.networkNodes.find((n) => n.id === l.source)
            const b = s.networkNodes.find((n) => n.id === l.target)
            return `  · ${a?.hostname ?? l.source} → ${b?.hostname ?? l.target} — ${l.status} at ${l.traffic}%`
          }),
          '',
          'Telemetry is generated; no packet capture occurs.',
        ].join('\n'),
        refs: [
          { label: 'Topology', path: '/network/topology' },
          { label: 'Monitoring', path: '/network/monitoring' },
        ],
      }
    }
    case 'intel': {
      const live = s.cases.filter((c) => c.status === 'open' || c.status === 'active')
      const flagged = s.identities.filter((i) => i.status === 'flagged')
      return {
        kind: 'analysis',
        content: [
          'INTELLIGENCE SUMMARY — generated snapshot',
          '',
          `Profiles: ${s.identities.length} · flagged ${flagged.length}`,
          `Organisations: ${s.organizations.length} · cases ${s.cases.length}`,
          `Link graph: ${s.graph.nodes.length} nodes / ${s.graph.links.length} edges`,
          `Evidence records: ${s.evidence.length}`,
          '',
          'Live cases:',
          ...live.slice(0, 5).map((c) => `  · ${c.code} — ${c.title} (${c.progress}%, ${c.priority})`),
          '',
          'Every name, company and relationship is procedurally generated fiction.',
        ].join('\n'),
        refs: [
          { label: 'Cases', path: '/intelligence/cases' },
          { label: 'Relationship graph', path: '/intelligence/relationships' },
        ],
      }
    }
    case 'missions': {
      const active = s.missions.filter((m) => m.status === 'active' || m.status === 'paused')
      return {
        kind: 'analysis',
        content: [
          'MISSION STATUS — generated snapshot',
          '',
          `Missions: ${s.missions.length} · templates ${s.templates.length}`,
          `Active/paused: ${active.length} · completed ${s.missions.filter((m) => m.status === 'completed').length}`,
          '',
          ...(active.length
            ? active.map((m) => `  · ${m.code} — ${m.name} (${m.status}, ${m.progress}%)`)
            : ['  · No missions currently running.']),
          '',
          'Open Mission Control to start one, or build a new scenario from a template.',
        ].join('\n'),
        refs: [
          { label: 'Active missions', path: '/missions/active' },
          { label: 'Mission builder', path: '/missions/builder' },
        ],
      }
    }
    case 'surveillance': {
      return {
        kind: 'analysis',
        content: [
          'SURVEILLANCE STATUS — generated snapshot',
          '',
          `Cameras: ${s.cameras.length} · online ${s.cameras.filter((c) => c.status === 'online').length} · degraded ${s.cameras.filter((c) => c.status === 'degraded').length} · offline ${s.cameras.filter((c) => c.status === 'offline').length}`,
          `Recording (simulated): ${s.cameras.filter((c) => c.recording).length}`,
          `Open incidents: ${s.surveillanceIncidents.filter((i) => i.status === 'open').length}`,
          '',
          'Every feed is an SVG scene rendered locally. No webcam, stream or recording is involved.',
        ].join('\n'),
        refs: [
          { label: 'Camera wall', path: '/surveillance/cameras' },
          { label: 'Incidents', path: '/surveillance/incidents' },
        ],
      }
    }
    case 'geoint': {
      return {
        kind: 'analysis',
        content: [
          'GEOSPATIAL PICTURE — generated snapshot',
          '',
          `Targets: ${s.targets.length} (${s.targets.filter((t) => t.moving).length} in motion)`,
          `Geofences: ${s.geofences.length} (${s.geofences.filter((g) => g.active).length} armed)`,
          `Routes: ${s.routes.length}`,
          '',
          ...s.targets.slice(0, 5).map((t) => `  · ${t.codename} — ${t.city}, ${t.country} · ${t.moving ? 'moving' : 'static'} · risk ${t.risk}`),
          '',
          'Coordinates are generated around real city anchors; no real person or device is tracked.',
        ].join('\n'),
        refs: [
          { label: 'World map', path: '/geoint/world' },
          { label: 'Targets', path: '/geoint/targets' },
        ],
      }
    }
    case 'forensics': {
      return {
        kind: 'analysis',
        content: [
          'FORENSICS SUMMARY — generated snapshot',
          '',
          `Lab cases: ${s.forensicsCases.length} · files ${s.files.length}`,
          `Timeline events: ${s.forensicTimeline.length} · critical ${s.forensicTimeline.filter((e) => e.severity === 'critical').length}`,
          `Evidence register: ${s.evidence.length}`,
          '',
          'Hashing in the lab uses real Web Crypto on text you type. No file is read from disk.',
        ].join('\n'),
        refs: [
          { label: 'Hash lab', path: '/forensics/hashes' },
          { label: 'Timeline', path: '/forensics/timeline' },
        ],
      }
    }
    case 'market': {
      return {
        kind: 'analysis',
        content: [
          'MARKETPLACE SUMMARY — generated snapshot',
          '',
          `Vendors: ${s.vendors.length} · listings ${s.listings.length}`,
          `Orders: ${s.orders.length} · escrow held ${fmtMoney(s.orders.filter((o) => o.escrow === 'held').reduce((a, o) => a + o.amount, 0))}`,
          '',
          'Every listing is a movie prop. Nothing can be bought, and no payment rail exists.',
        ].join('\n'),
        refs: [{ label: 'Shadow market', path: '/underground/market' }],
      }
    }
    case 'crisis': {
      return {
        kind: 'analysis',
        content: [
          'CRISIS STATUS — generated snapshot',
          '',
          `Incidents: ${s.crisisIncidents.length} · escalated ${s.crisisIncidents.filter((c) => c.status === 'escalated').length}`,
          `Infrastructure: ${s.infrastructure.length} services · degraded ${s.infrastructure.filter((i) => i.status === 'degraded').length}`,
          `Emergency mode: ${s.emergency ? 'ACTIVE' : 'off'}`,
          '',
          ...s.crisisIncidents.slice(0, 4).map((c) => `  · ${c.id} — ${c.title} (${c.severity}, ${c.status})`),
          '',
          'Emergency mode changes the interface only; no real infrastructure is affected.',
        ].join('\n'),
        refs: [
          { label: 'Crisis overview', path: '/crisis' },
          { label: 'Alerts', path: '/crisis/alerts' },
        ],
      }
    }
    case 'comms': {
      return {
        kind: 'analysis',
        content: [
          'COMMUNICATIONS — generated snapshot',
          '',
          `Channels: ${s.channels.length} · messages ${s.messages.length}`,
          `Operators: ${s.operators.length} (${s.operators.filter((o) => o.status === 'online').length} online)`,
          `Calls: ${s.calls.length} · active ${s.calls.filter((c) => c.status === 'active').length}`,
          '',
          'Messages are stored locally in the simulation store. Nothing is transmitted.',
        ].join('\n'),
        refs: [
          { label: 'Messages', path: '/communications/messages' },
          { label: 'Dispatch', path: '/communications/dispatch' },
        ],
      }
    }
    case 'report': {
      return {
        kind: 'report',
        content: [
          'REPORT DRAFT — generated by SHADOW AI',
          '',
          `Title: Operational Snapshot ${new Date().toISOString().slice(0, 10)}`,
          `Classification: FICTIONAL · DEMO`,
          '',
          'Summary',
          `The simulated environment holds ${s.accounts.length} accounts, ${s.findings.length} security findings and ${s.cases.length} investigations. ${s.missions.filter((m) => m.status === 'active').length} missions are currently active.`,
          '',
          'Observations',
          `1. ${s.findings.filter((f) => f.severity === 'critical').length} critical cyber findings require attention.`,
          `2. ${s.networkNodes.filter((n) => n.status !== 'online').length} network nodes are not fully online.`,
          `3. ${s.cameras.filter((c) => c.status !== 'online').length} surveillance feeds are degraded or offline.`,
          '',
          'Recommendation',
          'Advance the simulation clock, remediate the top CVSS item and re-run this brief for a comparison.',
          '',
          'SIMULATED — NOT A REAL INTELLIGENCE PRODUCT.',
        ].join('\n'),
        refs: [{ label: 'Report studio', path: '/reports' }],
      }
    }
    case 'risk': {
      const risky = [
        { label: 'Critical cyber findings', v: s.findings.filter((f) => f.severity === 'critical').length, w: 40 },
        { label: 'Offline network nodes', v: s.networkNodes.filter((n) => n.status === 'offline').length, w: 25 },
        { label: 'Flagged profiles', v: s.identities.filter((i) => i.status === 'flagged').length, w: 20 },
        { label: 'Escalated crisis incidents', v: s.crisisIncidents.filter((c) => c.status === 'escalated').length, w: 30 },
        { label: 'Disputed escrow orders', v: s.orders.filter((o) => o.escrow === 'disputed').length, w: 15 },
        { label: 'Offline cameras', v: s.cameras.filter((c) => c.status === 'offline').length, w: 10 },
      ].map((r) => ({ ...r, score: r.v * r.w })).sort((a, b) => b.score - a.score)
      return {
        kind: 'analysis',
        content: [
          'RISK RANKING — weighted by demo severity',
          '',
          ...risky.map((r, i) => `${i + 1}. ${r.label}: ${r.v} (weight ${r.w} → score ${r.score})`),
          '',
          `Composite demo risk score: ${risky.reduce((a, r) => a + r.score, 0)}`,
          `Highest single weight: ${risky[0]?.label ?? '—'}.`,
          '',
          'Weights are illustrative and meant to demonstrate cross-module reasoning, not a real risk model.',
        ].join('\n'),
        refs: [
          { label: 'Crisis', path: '/crisis' },
          { label: 'Vulnerabilities', path: '/cyber/vulnerabilities' },
        ],
      }
    }
    default:
      return { content: SYSTEM_PROMPTS.unknown, kind: 'error' }
  }
}

export function greeting(): AiMessage {
  return {
    id: `ai-greet-${Date.now()}`,
    role: 'ai',
    content: SYSTEM_PROMPTS.greet,
    ts: new Date().toISOString(),
    kind: 'text',
  }
}

export function timestamp(): string {
  return `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}`
}

export function compactOverview() {
  const s = useEngine.getState()
  return {
    accounts: s.accounts.length,
    notional: fmtMoney(s.accounts.reduce((a, x) => a + x.total, 0)),
    findings: s.findings.length,
    nodes: s.networkNodes.length,
    online: fmtCompact(s.networkNodes.filter((n) => n.status === 'online').length),
    cameras: s.cameras.length,
    missions: s.missions.length,
  }
}
