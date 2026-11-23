// ============================================================================
// SHADOW SYSTEMS — Sandboxed fictional terminal
// A closed command interpreter. Nothing here touches the shell, the OS or the
// network: every command renders scripted output from local simulation state.
// ============================================================================

export interface TerminalLine {
  id: string
  kind: 'input' | 'output' | 'error' | 'system' | 'success' | 'warn' | 'dim'
  text: string
  ts?: number
}

export interface CommandContext {
  operator: string
  missionCode?: string
  missionName?: string
  nodes: number
  onlineNodes: number
  cameras: number
  onlineCameras: number
  targets: number
  txCount: number
  pendingTx: number
  findings: number
  criticalFindings: number
  walletNotional: number
  sessionId: string
  uptimeSeconds: number
}

export const COMMANDS: { name: string; args?: string; desc: string; usage: string }[] = [
  { name: 'help', desc: 'List every available sandbox command', usage: 'help [command]' },
  { name: 'clear', desc: 'Clear the terminal buffer', usage: 'clear' },
  { name: 'status', desc: 'Show sandbox subsystem status', usage: 'status' },
  { name: 'mission', desc: 'Inspect the active mission timeline', usage: 'mission [list|timeline]' },
  { name: 'scan-demo', desc: 'Run a scripted fictional port scan', usage: 'scan-demo [host]' },
  { name: 'network-demo', desc: 'Render a simulated topology summary', usage: 'network-demo' },
  { name: 'firewall-demo', desc: 'Exercise the simulated firewall ruleset', usage: 'firewall-demo' },
  { name: 'encryption-demo', desc: 'Walk through a fictional encrypt routine', usage: 'encryption-demo' },
  { name: 'system-info', desc: 'Print sandbox environment details', usage: 'system-info' },
  { name: 'history', desc: 'Show command history', usage: 'history' },
  { name: 'reset', desc: 'Reset this session', usage: 'reset' },
  { name: 'whoami', desc: 'Show the current simulated operator', usage: 'whoami' },
  { name: 'nodes', desc: 'List simulated network nodes', usage: 'nodes' },
  { name: 'targets', desc: 'List tracked fictional targets', usage: 'targets' },
  { name: 'trace', desc: 'Render a fictional route trace', usage: 'trace [hops]' },
  { name: 'disclaimer', desc: 'Print the simulation containment notice', usage: 'disclaimer' },
]

const BANNER = [
  '  ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗',
  '  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║',
  '  ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║',
  '  ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║',
  '  ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝',
  '  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ',
  '            S Y S T E M S   ·   S A N D B O X',
]

export function bannerLines(sessionId: string): TerminalLine[] {
  const now = Date.now()
  return [
    ...BANNER.map((b, i) => ({ id: `banner-${i}`, kind: 'success' as const, text: b, ts: now })),
    { id: 'banner-sub', kind: 'dim', text: `fictional operations shell · v4.2.0-sandbox · session ${sessionId}`, ts: now },
    { id: 'banner-warn', kind: 'warn', text: 'CONTAINMENT ACTIVE — no OS, filesystem or network access is available from this shell.', ts: now },
    { id: 'banner-hint', kind: 'dim', text: 'type "help" for the command list. All output is generated locally.', ts: now },
  ]
}

export function runCommand(raw: string, ctx: CommandContext): TerminalLine[] {
  const now = Date.now()
  const [cmd, ...rest] = raw.trim().split(/\s+/)
  const arg = rest.join(' ')
  const out = (kind: TerminalLine['kind'], text: string): TerminalLine => ({ id: `${now}-${Math.random().toString(36).slice(2, 7)}`, kind, text, ts: now })

  switch (cmd?.toLowerCase()) {
    case 'help':
      if (arg) {
        const c = COMMANDS.find((x) => x.name === arg.toLowerCase())
        if (!c) return [out('error', `help: no such command "${arg}"`)]
        return [
          out('output', `${c.name.toUpperCase()}`),
          out('dim', `usage    ${c.usage}`),
          out('output', c.desc),
          out('dim', 'Sandbox only — this command cannot affect any real system.'),
        ]
      }
      return [
        out('success', 'AVAILABLE SANDBOX COMMANDS'),
        out('dim', '─'.repeat(64)),
        ...COMMANDS.map((c) => out('output', `  ${c.name.padEnd(18)} ${c.desc}`)),
        out('dim', '─'.repeat(64)),
        out('dim', 'Unknown commands return a realistic shell error. No external execution occurs.'),
      ]

    case 'clear':
      return [{ id: 'clear', kind: 'system', text: '__CLEAR__', ts: now }]

    case 'status': {
      const pct = Math.round((ctx.onlineNodes / Math.max(1, ctx.nodes)) * 100)
      return [
        out('success', 'SANDBOX SUBSYSTEM STATUS'),
        out('dim', '─'.repeat(52)),
        out('output', `  engine              ONLINE · uptime ${Math.floor(ctx.uptimeSeconds)}s`),
        out('output', `  operator            ${ctx.operator}`),
        out('output', `  simulation nodes    ${ctx.onlineNodes}/${ctx.nodes} online (${pct}%)`),
        out('output', `  camera matrix       ${ctx.onlineCameras}/${ctx.cameras} feeds active`),
        out('output', `  tracked targets     ${ctx.targets}`),
        out('output', `  demo ledger         ${ctx.txCount} transactions · ${ctx.pendingTx} pending`),
        out('warn', `  vulnerabilities     ${ctx.findings} findings · ${ctx.criticalFindings} critical`),
        out('dim', `  wallet notional     $${ctx.walletNotional.toLocaleString()}`),
        out('success', '  containment         VERIFIED · external network unreachable by design'),
      ]
    }

    case 'mission':
      return [
        out('success', 'MISSION TIMELINE'),
        out('dim', '─'.repeat(52)),
        out('output', `  active mission      ${ctx.missionCode ?? 'NONE'}`),
        out('output', `  designation         ${ctx.missionName ?? '—'}`),
        out('dim', '  open /missions/active to drive the scenario from the UI.'),
      ]

    case 'scan-demo': {
      const host = arg || `shadow-sim-${Math.random().toString(36).slice(2, 5)}`
      const lines: TerminalLine[] = [
        out('success', `SCAN-DEMO :: initiating against fictional host ${host}`),
        out('dim', 'mode: scripted · target: sandbox-local · packets: none'),
      ]
      const ports = [
        [22, 'ssh', 'filtered'],
        [80, 'http', 'open'],
        [443, 'https', 'open'],
        [8080, 'http-alt', 'filtered'],
        [9000, 'sim-control', 'open (sim)'],
      ] as const
      ports.forEach(([port, svc, state]) => {
        lines.push(out(state.startsWith('open') ? 'output' : 'dim', `  PORT ${String(port).padEnd(6)} ${svc.padEnd(12)} ${state}`))
      })
      lines.push(out('success', `SCAN-DEMO :: complete · 2 fictional services reported · nothing was contacted`))
      return lines
    }

    case 'network-demo':
      return [
        out('success', 'NETWORK-DEMO :: simulated topology'),
        out('dim', '─'.repeat(58)),
        out('output', '                        ┌──────────────┐'),
        out('output', '                        │  CORE-RTR-01 │'),
        out('output', '                        └──────┬───────┘'),
        out('output', '              ┌────────────────┼────────────────┐'),
        out('output', '        ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐'),
        out('output', '        │ SW-CORE-A │    │ SW-CORE-B │    │ FW-PRIMARY│'),
        out('output', '        └─────┬─────┘    └─────┬─────┘    └─────┬─────┘'),
        out('output', '        ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐'),
        out('output', '        │  APP-SRV  │    │   SIM     │    │   DB-SRV  │'),
        out('output', '        │  01 / 02  │    │ NODE 07   │    │  01 / 02  │'),
        out('output', '        └───────────┘    └───────────┘    └───────────┘'),
        out('dim', '─'.repeat(58)),
        out('success', `NETWORK-DEMO :: ${ctx.nodes} nodes · ${ctx.onlineNodes} online · all links simulated`),
      ]

    case 'firewall-demo':
      return [
        out('success', 'FIREWALL-DEMO :: exercising demo ruleset'),
        out('dim', 'rule                     direction  action  result'),
        out('dim', '─'.repeat(58)),
        out('output', 'allow-demo-https         inbound    allow   PASS'),
        out('output', 'allow-demo-ssh-lab       inbound    allow   PASS'),
        out('output', 'deny-sample-telnet       inbound    deny    BLOCKED (sim)'),
        out('output', 'log-fiction-icmp         inbound    log     LOGGED'),
        out('output', 'deny-prop-smb-external   outbound   deny    BLOCKED (sim)'),
        out('output', 'allow-internal-api       outbound   allow   PASS'),
        out('success', 'FIREWALL-DEMO :: 6 rules evaluated · 2 fictional events recorded'),
      ]

    case 'encryption-demo':
      return [
        out('success', 'ENCRYPTION-DEMO :: fictional AES-256-GCM walkthrough'),
        out('dim', '─'.repeat(58)),
        out('output', '  key derivation        PBKDF2-SHA256 · 310 000 iterations (demo params)'),
        out('output', '  cipher                AES-256-GCM'),
        out('output', '  iv                    9f3c2a71b8e44d0a (generated)'),
        out('output', '  plaintext             "OPERATION BLACKOUT"'),
        out('output', '  ciphertext            d8:4f:a1:02:be:77:11:9c:35:6e:…'),
        out('output', '  auth tag              verified ✓'),
        out('success', 'ENCRYPTION-DEMO :: demonstration only · open the Cryptography module for real local crypto'),
      ]

    case 'system-info':
      return [
        out('success', 'SYSTEM INFO'),
        out('dim', '─'.repeat(52)),
        out('output', '  host            shadow-sandbox'),
        out('output', '  kernel          fictional 4.2.0-sim'),
        out('output', '  shell           shadow-sh (scripted interpreter)'),
        out('output', '  operator        ' + ctx.operator),
        out('output', '  session         ' + ctx.sessionId),
        out('output', '  uptime          ' + Math.floor(ctx.uptimeSeconds) + 's'),
        out('output', '  network         DISCONNECTED BY DESIGN'),
        out('output', '  filesystem      none mounted'),
        out('success', '  all values are generated for cinematic display'),
      ]

    case 'history':
      return [out('dim', 'command history is displayed above in this buffer.')]

    case 'reset':
      return [{ id: 'reset', kind: 'system', text: '__RESET__', ts: now }]

    case 'whoami':
      return [
        out('success', `operator: ${ctx.operator}`),
        out('dim', 'clearance: OMEGA · unit: COMMAND / ALPHA · all identities fictional'),
      ]

    case 'nodes':
      return [
        out('success', 'SIMULATED NETWORK NODES'),
        out('dim', '─'.repeat(52)),
        ...Array.from({ length: Math.min(10, ctx.nodes) }, (_, i) =>
          out('output', `  NOD-${String(i + 1).padStart(3, '0')}   10.${(i * 3) % 40}.${(i * 17) % 250}.${4 + i}   ${i < ctx.onlineNodes ? 'online' : 'offline'}`),
        ),
      ]

    case 'targets':
      return [
        out('success', 'TRACKED FICTIONAL TARGETS'),
        out('dim', '─'.repeat(52)),
        ...Array.from({ length: Math.min(8, ctx.targets) }, (_, i) =>
          out('output', `  TGT-${String(i + 1).padStart(3, '0')}   codename ${['NIGHTJAR', 'OBSIDIAN', 'LANTERN', 'GRAYFIN', 'CINDER', 'HALYARD', 'TALLOW', 'VESPER'][i]}   status tracked (sim)`),
        ),
        out('dim', 'Coordinates are generated. No real person is tracked.'),
      ]

    case 'trace': {
      const hops = Math.max(1, Math.min(12, Number(arg) || 6))
      const lines: TerminalLine[] = [out('success', `TRACE :: fictional route (${hops} hops)`)]
      for (let i = 1; i <= hops; i++) {
        const ip = `10.${(i * 7) % 60}.${(i * 23) % 250}.${(i * 11) % 250}`
        const ms = (2 + Math.random() * 30).toFixed(2)
        lines.push(out(i === hops ? 'success' : 'output', `  ${String(i).padStart(2, '0')}  ${ip.padEnd(16)} ${ms} ms   [sim]`))
      }
      lines.push(out('dim', 'No packets were transmitted. Route is generated deterministically per invocation.'))
      return lines
    }

    case 'disclaimer':
      return [
        out('warn', 'SIMULATION CONTAINMENT NOTICE'),
        out('output', '  This shell is a scripted demonstration environment.'),
        out('output', '  • no operating system access'),
        out('output', '  • no filesystem, no shell execution'),
        out('output', '  • no network sockets, no scanning of real hosts'),
        out('output', '  • no credential collection of any kind'),
        out('success', '  All output is rendered from local simulation state.'),
      ]

    case '':
      return []

    default:
      return [
        out('error', `shadow-sh: command not found: ${cmd}`),
        out('dim', `try "help" to list the sandbox commands.`),
      ]
  }
}

export const TYPING_SCRIPTS: Record<string, string[]> = {
  scan: [
    'initializing scripted scan...',
    'enumerating fictional services...',
    'correlating sandbox fingerprints...',
    'scan complete · 2 services reported',
  ],
  access: [
    'INITIALIZING SIMULATION...',
    'CONNECTING TO DEMO NODE...',
    'ANALYZING FICTIONAL SECURITY LAYERS...',
    'FIREWALL STATUS: SIMULATED',
    'AUTHORIZATION CHECK...',
    'ACCESS GRANTED',
  ],
}
