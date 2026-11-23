import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, ShieldCheck, Wallet, Terminal, Globe2, Cctv, Microscope, Network,
  Bot, Crosshair, Play, Layers, Cpu, Radar, Lock, ChevronDown,
  ArrowUpRight, CircleDot, ScanLine, Boxes,
} from 'lucide-react'
import { ShadowMark, Wordmark, SimulationBadge } from '@/components/brand/Logo'
import { WorldMap } from '@/components/maps/WorldMap'
import { cn, pad } from '@/lib/utils'
import { CITIES } from '@/data/vocabulary'

const CAPABILITIES = [
  { icon: Wallet, title: 'Financial Simulations', body: 'A closed-loop banking simulator: fictional institutions, live ledgers, multi-step transfer sequences and cinematic cinematic payment outcomes.', accent: '#38db91', to: '/finance' },
  { icon: Terminal, title: 'Cyber Operations', body: 'Multi-session terminals, scripted access sequences, firewall labs and vulnerability assessment records — all inside a sealed sandbox.', accent: '#38db91', to: '/cyber/terminal' },
  { icon: Globe2, title: 'Global Intelligence', body: 'Map-first geospatial intelligence. Track fictional targets across continents with live trails, geofences and route simulation.', accent: '#28d8ea', to: '/geoint/world' },
  { icon: Cctv, title: 'Surveillance Simulations', body: 'Camera walls from 4 to 25 feeds, playback scrubbing, incident generation and animated synthetic coverage maps.', accent: '#377eff', to: '/surveillance/cameras' },
  { icon: Microscope, title: 'Digital Forensics', body: 'Evidence-first laboratory with a working hashing engine, metadata extraction, timelines and chain-of-custody records.', accent: '#f5b942', to: '/forensics' },
  { icon: Network, title: 'Network Operations', body: 'A NOC that breathes: live topology, traffic telemetry, server health and animated link state across simulated nodes.', accent: '#28d8ea', to: '/network/topology' },
  { icon: Bot, title: 'AI Intelligence', body: 'SHADOW AI grounds every answer in the platform’s own generated data — briefings, incident reports and analysis on demand.', accent: '#28d8ea', to: '/ai/chat' },
  { icon: Crosshair, title: 'Mission Control', body: 'The scenario engine. Compose timeline-driven missions that synchronise every module in the platform at once.', accent: '#f5b942', to: '/missions' },
]

const PREVIEW_TILES = [
  { label: 'Command Center', to: '/command-center', tone: 'cyan', span: 'md:col-span-2', desc: 'Operational overview' },
  { label: 'Financial Terminal', to: '/finance', tone: 'green', desc: 'Closed-loop ledger' },
  { label: 'GeoINT World', to: '/geoint/world', tone: 'cyan', desc: 'Map-first intelligence' },
  { label: 'Cyber Terminal', to: '/cyber/terminal', tone: 'green', desc: 'Scripted shell' },
  { label: 'Surveillance Wall', to: '/surveillance/cameras', tone: 'blue', desc: 'Synthetic camera grid' },
  { label: 'Mission Builder', to: '/missions/builder', tone: 'amber', span: 'md:col-span-2', desc: 'Timeline scenario editor' },
]

const TECH = [
  { icon: Cpu, title: 'Simulation Engine', body: 'One shared store and a publish/subscribe event bus. 40+ record types, deterministic regeneration and cross-module consistency.' },
  { icon: Layers, title: 'Visualization Layer', body: 'SVG geospatial renderer, canvas relationship graphs, animated telemetry charts and a 12,000-line cinematic design system.' },
  { icon: Radar, title: 'Scenario Scheduler', body: 'Missions decompose into timestamped events. Each event can drive any module — from a ledger transfer to an emergency broadcast.' },
  { icon: Lock, title: 'Local Cryptography', body: 'Real AES-GCM, SHA-256 and ECDSA demonstrations computed in your browser with the Web Crypto API. Nothing leaves the device.' },
]

function useCountdownLabel() {
  const [utc, setUtc] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setUtc(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return `${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}:${pad(utc.getUTCSeconds())}`
}

export default function Landing() {
  const navigate = useNavigate()
  const utc = useCountdownLabel()
  const capabilitiesRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const markers = useMemo(
    () =>
      CITIES.slice(0, 16).map((c, i) => ({
        id: c.city,
        label: c.city,
        lat: c.lat,
        lng: c.lng,
        tone: (['cyan', 'green', 'blue', 'amber', 'red'] as const)[i % 5],
        kind: (i % 4 === 0 ? 'alert' : i % 3 === 0 ? 'mission' : 'node') as 'alert' | 'mission' | 'node',
        pulse: i % 3 === 0,
      })),
    [],
  )

  const arcs = useMemo(
    () =>
      CITIES.slice(0, 6).map((c, i) => ({
        id: `arc-${i}`,
        from: { lat: CITIES[(i * 3) % CITIES.length].lat, lng: CITIES[(i * 3) % CITIES.length].lng },
        to: { lat: c.lat, lng: c.lng },
        tone: (['cyan', 'green', 'blue', 'amber'] as const)[i % 4],
      })),
    [],
  )

  return (
    <div className="min-h-screen bg-bg">
      {/* ============================ NAV ============================ */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'border-b border-line bg-bg/92 backdrop-blur-xl' : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="SHADOW SYSTEMS home">
            <Wordmark size="md" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {[
              ['Platform', '#platform'],
              ['Capabilities', '#capabilities'],
              ['Interface', '#interface'],
              ['Technology', '#technology'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 transition-colors hover:text-ink">
                {label}
              </a>
            ))}
            <Link to="/settings/data" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 transition-colors hover:text-ink">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <SimulationBadge />
            <Link to="/access" className="btn btn-sm hidden sm:inline-flex">
              Operator access
            </Link>
            <Link to="/command-center" className="btn btn-sm btn-primary">
              Enter <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0">
          <WorldMap
            markers={markers}
            arcs={arcs}
            showLegend={false}
            showLabels={false}
            className="h-full w-full opacity-[0.5]"
            interactive={false}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_0%,rgba(7,11,17,0.55)_45%,#070b11_78%)]" />
          <div className="micro-grid absolute inset-0 opacity-[0.18]" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
        <div className="scan-beam top-1/3 opacity-40" />

        <div className="relative mx-auto max-w-[1400px] px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:pb-28 lg:pt-36">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="badge badge-cyan"><CircleDot size={8} /> SIMULATION ENGINE ONLINE</span>
              <span className="badge badge-grey">SESSION {utc} UTC</span>
              <span className="badge badge-grey">BUILD 4.2.0</span>
            </div>
            <h1 className="max-w-4xl font-display text-[2.6rem] font-bold uppercase leading-[0.94] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[5.2rem]">
              THE FUTURE OF
              <br />
              <span className="relative inline-block text-[var(--accent)] text-glow">
                DIGITAL OPERATIONS
                <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/40 to-transparent" />
              </span>
              <span className="text-ink-3">.</span>
            </h1>
            <p className="mt-5 max-w-xl text-balance text-[13.5px] leading-relaxed text-ink-2 sm:text-base">
              One environment. Multiple domains. Complete cinematic control.
            </p>
            <p className="mt-2 max-w-lg text-[11.5px] leading-relaxed text-ink-3">
              A cinematic simulation platform for film, television and demonstration — financial systems, cyber operations,
              global intelligence, surveillance and mission control in a single, connected operational environment.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/command-center" className="btn btn-primary h-11 px-5 text-[11.5px]">
                ENTER COMMAND CENTER <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                onClick={() => capabilitiesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="btn h-11 px-5 text-[11.5px]"
              >
                <Play size={12} /> EXPLORE CAPABILITIES
              </button>
            </div>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 border-t border-line-soft pt-6 sm:grid-cols-4">
              {[
                ['14', 'OPERATIONAL MODULES'],
                ['46+', 'RECORD TYPES'],
                ['6', 'MISSION TEMPLATES'],
                ['100%', 'FICTIONAL DATA'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="stat-value text-2xl text-ink">{v}</dt>
                  <dd className="label-xs mt-1">{l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
        <a href="#platform" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-ink-3 hover:text-ink-2 sm:flex">
          <span className="font-mono text-[8px] uppercase tracking-[0.3em]">Scroll</span>
          <ChevronDown size={14} className="animate-bounce" />
        </a>
      </section>

      {/* ============================ TICKER ============================ */}
      <div className="border-y border-line bg-bg-2 py-1.5">
        <div className="overflow-hidden">
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-10">
                {[
                  'FINANCE.LEDGER SYNCED',
                  'GEOINT · 10 TRACKED TARGETS',
                  'SURVEILLANCE · 14 CAMERA NODES',
                  'NETWORK · TOPOLOGY NOMINAL',
                  'AI · BRIEFING ENGINE READY',
                  'MISSIONS · 2 ACTIVE SCENARIOS',
                  'CRYPTO · AES-GCM LOCAL',
                  'SIMULATION CONTAINMENT VERIFIED',
                ].map((t) => (
                  <span key={t} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
                    <span className="dot bg-[var(--accent)]" /> {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================ SECTION A · PLATFORM ============================ */}
      <section id="platform" className="relative mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <p className="label-xs mb-3 text-[var(--accent)]">01 · PLATFORM OVERVIEW</p>
            <h2 className="font-display text-3xl font-semibold uppercase leading-tight tracking-tight text-ink sm:text-4xl">
              Built like an operating system, <span className="text-ink-3">not a dashboard.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-ink-2">
              SHADOW SYSTEMS is a single connected simulation environment. A shared engine maintains every record — banks,
              accounts, transactions, identities, organisations, network nodes, camera feeds, targets and missions — so that
              an action in one module is immediately reflected everywhere it matters.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                ['Unified state', 'One store, one event bus, zero disconnected demo pages.'],
                ['Cinematic fidelity', 'Tailored layouts per domain — finance is fintech, geospatial is map-first, surveillance is camera-grid-first.'],
                ['Total fictionality', 'Every record is generated. No real institution, person or system is referenced.'],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-3 border-l-2 border-[var(--accent)]/40 pl-3">
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink">{t}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel corner-marks overflow-hidden">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <ScanLine size={12} className="text-[var(--accent)]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">Live Engine Telemetry</span>
              </div>
              <span className="badge badge-green"><span className="dot animate-[pulse-dot_2s_infinite] bg-green" /> RUNNING</span>
            </div>
            <div className="relative">
              <WorldMap markers={markers} arcs={arcs} showLegend={false} interactive={false} className="h-[300px] sm:h-[360px]" />
              <div className="scan-beam opacity-60" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
              {[
                ['EVENT BUS', '12/s'],
                ['SIM CLOCK', utc],
                ['MODULES', '14/14'],
              ].map(([l, v]) => (
                <div key={l} className="p-2.5">
                  <p className="label-xs">{l}</p>
                  <p className="mono mt-0.5 text-[12px] tabular text-[var(--accent)]">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ SECTION B · CAPABILITIES ============================ */}
      <section id="capabilities" ref={capabilitiesRef} className="relative border-y border-line bg-bg-2 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="label-xs mb-3 text-[var(--accent)]">02 · MAIN CAPABILITIES</p>
              <h2 className="font-display text-3xl font-semibold uppercase tracking-tight text-ink sm:text-4xl">
                Fourteen modules. One operational fabric.
              </h2>
            </div>
            <p className="max-w-xs text-[11.5px] leading-relaxed text-ink-3">
              Each module has its own visual identity and interaction model, unified by the SHADOW SYSTEMS design tokens.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c, i) => (
              <motion.button
                key={c.title}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                onClick={() => navigate(c.to)}
                className="panel group relative overflow-hidden p-4 text-left transition-all hover:border-[color-mix(in_srgb,var(--accent)_55%,var(--color-line))]"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity group-hover:opacity-100" style={{ background: c.accent }} />
                <c.icon size={20} style={{ color: c.accent }} className="mb-3" />
                <h3 className="font-display text-[13.5px] font-medium uppercase tracking-wide text-ink">{c.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">{c.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3 transition-colors group-hover:text-[var(--accent)]">
                  Open module <ArrowUpRight size={10} />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ SECTION C · INTERFACE ============================ */}
      <section id="interface" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="mb-10">
          <p className="label-xs mb-3 text-[var(--accent)]">03 · CINEMATIC INTERFACE PREVIEW</p>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-tight text-ink sm:text-4xl">
            The interface is the product.
          </h2>
          <p className="mt-3 max-w-xl text-[12px] leading-relaxed text-ink-3">
            Purpose-built operational surfaces rendered live in this environment. Select any panel to enter it directly.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {PREVIEW_TILES.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => navigate(t.to)}
              className={cn(
                'panel group relative flex h-[170px] flex-col justify-between overflow-hidden p-3 text-left transition-all hover:border-[color-mix(in_srgb,var(--accent)_55%,var(--color-line))] sm:h-[200px]',
                t.span,
              )}
            >
              <div className="flex items-start justify-between">
                <span className="label-xs">{t.desc}</span>
                <ArrowUpRight size={13} className="text-ink-3 transition-colors group-hover:text-[var(--accent)]" />
              </div>
              <div className="relative mt-auto">
                <PreviewGlyph tone={t.tone} index={i} />
                <h3 className="relative font-display text-base font-medium uppercase tracking-wide text-ink">{t.label}</h3>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(7,11,17,0.85))]" />
              <div className="micro-grid pointer-events-none absolute inset-0 opacity-[0.35]" />
            </button>
          ))}
        </div>
      </section>

      {/* ============================ SECTION D · MISSION PREVIEW ============================ */}
      <section className="border-y border-line bg-bg-2 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="label-xs mb-3 text-[var(--accent)]">04 · MISSION SIMULATION PREVIEW</p>
              <h2 className="font-display text-3xl font-semibold uppercase leading-tight tracking-tight text-ink sm:text-4xl">
                One mission can control the entire platform.
              </h2>
              <p className="mt-4 max-w-lg text-[12.5px] leading-relaxed text-ink-2">
                Missions are timelines of events. Run one and watch the command center update, the map re-focus, a
                surveillance alert fire, a transaction enter the ledger and the crisis engine escalate — all in sequence,
                all consistent.
              </p>
              <Link to="/missions/templates" className="btn btn-primary mt-6">
                Inspect scenario templates <ArrowRight size={11} />
              </Link>
            </div>
            <div className="panel corner-marks overflow-hidden">
              <div className="panel-header">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">OPERATION BLACKOUT · TIMELINE</span>
                <span className="badge badge-red">CRITICAL</span>
              </div>
              <ol className="divide-y divide-line-soft">
                {[
                  ['00:00', 'COMMAND', 'Command center initialized', 'cyan'],
                  ['00:45', 'GEOINT', 'Map focused on affected region', 'cyan'],
                  ['01:35', 'NETWORK', 'Simulated network anomaly injected', 'amber'],
                  ['02:30', 'SURV', 'Surveillance alert on CAM-04', 'amber'],
                  ['03:30', 'FINANCE', 'Transaction simulation started', 'green'],
                  ['04:35', 'CRISIS', 'Severity escalated to CRITICAL', 'red'],
                  ['05:40', 'AI', 'Incident summary generated', 'cyan'],
                ].map(([t, mod, label, tone], i) => (
                  <li key={t} className="flex items-center gap-3 px-3 py-2">
                    <span className="mono w-11 shrink-0 text-[10px] text-ink-3">{t}</span>
                    <span className="dot shrink-0" style={{ background: `var(--color-${tone === 'cyan' ? 'cyan' : tone === 'amber' ? 'amber' : tone === 'red' ? 'red' : 'green'})` }} />
                    <span className="w-16 shrink-0 font-mono text-[9px] uppercase tracking-wider text-ink-3">{mod}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{label}</span>
                    <span className="hidden shrink-0 font-mono text-[8.5px] text-ink-3 sm:block">EVT-{pad(i + 1)}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-center justify-between border-t border-line bg-[#0d151d] px-3 py-2">
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-green">
                  <span className="dot animate-[pulse-dot_2s_infinite] bg-green" /> MODULES SYNCED · 7
                </span>
                <span className="font-mono text-[9px] text-ink-3">DURATION 06:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ SECTION E · TECH ============================ */}
      <section id="technology" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="mb-10">
          <p className="label-xs mb-3 text-[var(--accent)]">05 · TECHNOLOGY</p>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-tight text-ink sm:text-4xl">
            A simulation substrate built for consistency.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TECH.map((t) => (
            <div key={t.title} className="panel p-4">
              <t.icon size={18} className="text-[var(--accent)]" />
              <h3 className="mt-3 font-display text-[13px] font-medium uppercase tracking-wide text-ink">{t.title}</h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">{t.body}</p>
            </div>
          ))}
        </div>

        <div className="panel corner-marks mt-3 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <ShadowMark size={44} />
            <div>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-ink">Ready to take control?</h3>
              <p className="mt-0.5 text-[11.5px] text-ink-3">Demo operator access requires no registration. Everything runs locally.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/access" className="btn">Operator authorization</Link>
            <Link to="/command-center" className="btn btn-primary">Enter command center <ArrowRight size={11} /></Link>
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t border-line bg-[#05090d]">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Wordmark size="md" />
              <p className="mt-4 max-w-sm text-[11.5px] leading-relaxed text-ink-3">
                SHADOW SYSTEMS is a fictional cinematic simulation environment for film, television, music video and
                demonstration use. It is not affiliated with any government, financial institution or security organisation.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <SimulationBadge />
                <span className="badge badge-grey">v4.2.0</span>
                <span className="badge badge-grey">BUILD 2026.11</span>
              </div>
            </div>
            {[
              {
                title: 'About',
                links: [
                  ['Platform', '#platform'],
                  ['Capabilities', '#capabilities'],
                  ['Technology', '#technology'],
                ],
              },
              {
                title: 'Product',
                links: [
                  ['Command Center', '/command-center'],
                  ['Financial System', '/finance'],
                  ['Geo Intelligence', '/geoint/world'],
                  ['Mission Control', '/missions'],
                ],
              },
              {
                title: 'Support',
                links: [
                  ['Documentation', '/settings/data'],
                  ['Shortcuts', '/settings/shortcuts'],
                  ['System Health', '/command-center/health'],
                  ['Operator Access', '/access'],
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="label-xs mb-3 text-ink-2">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith('#') ? (
                        <a href={href} className="text-[11.5px] text-ink-3 hover:text-ink">{label}</a>
                      ) : (
                        <Link to={href} className="text-[11.5px] text-ink-3 hover:text-ink">{label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-line pt-5">
            <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-ink-3">
              <ShieldButton />
              <span>
                <strong className="font-mono uppercase tracking-wider text-amber">Simulation disclaimer.</strong> All
                institutions, accounts, balances, transactions, identities, organisations, records, network nodes, camera
                feeds, targets and missions displayed within SHADOW SYSTEMS are fictional and generated locally. The platform
                never connects to banking infrastructure, payment networks, surveillance hardware or external networks, and
                does not collect credentials or personal data.
              </span>
            </p>
            <div className="mt-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                © 2026 SHADOW SYSTEMS · BEYOND THE VISIBLE
              </p>
              <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                <span className="flex items-center gap-1"><ShieldCheck size={10} /> SIM CONTAINMENT VERIFIED</span>
                <span className="flex items-center gap-1"><Boxes size={10} /> BUILD 4.2.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ShieldButton() {
  return <ShieldCheck size={14} className="mt-0.5 shrink-0 text-amber" />
}

function PreviewGlyph({ tone, index }: { tone: string; index: number }) {
  const color = tone === 'green' ? '#38db91' : tone === 'blue' ? '#377eff' : tone === 'amber' ? '#f5b942' : '#28d8ea'
  const bars = Array.from({ length: 14 }, (_, i) => 20 + ((i * 37 + index * 13) % 70))
  return (
    <svg viewBox="0 0 200 60" className="absolute inset-x-0 bottom-6 h-[60px] w-full opacity-40" preserveAspectRatio="none" aria-hidden="true">
      {index % 3 === 0 &&
        bars.map((h, i) => (
          <rect key={i} x={i * 14 + 2} y={60 - h * 0.6} width={8} height={h * 0.6} fill={color} opacity={0.35 + (i % 4) * 0.12} />
        ))}
      {index % 3 === 1 &&
        [0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M0 ${40 - k * 8} ${Array.from({ length: 8 }, (_, i) => `${i * 26} ${28 + Math.sin(i / 1.4 + k) * 12}`).join(' ')}`}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            opacity={0.5 - k * 0.12}
          />
        ))}
      {index % 3 === 2 &&
        [0, 1, 2, 3].map((k) => (
          <circle key={k} cx={30 + k * 45} cy={20 + (k % 2) * 22} r={10 + k * 2} fill="none" stroke={color} strokeWidth="1" opacity={0.35} />
        ))}
    </svg>
  )
}
