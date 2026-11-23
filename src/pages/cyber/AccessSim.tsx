import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, Play, RotateCcw, ShieldCheck, Server, X, Ban, Clock, Zap } from 'lucide-react'
import { Panel, PageHeader, Screen, InlineAlert, StatusPill, KeyValue, Select, Slider, Divider } from '@/components/ui'
import { useEngine, selectOperator } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { audio } from '@/services/audio'
import { cn, pad } from '@/lib/utils'

type Outcome = 'granted' | 'denied' | 'terminated' | 'failed' | 'complete'

const SCRIPTS: Record<string, string[]> = {
  standard: [
    'INITIALIZING SIMULATION...',
    'CONNECTING TO DEMO NODE...',
    'ANALYZING FICTIONAL SECURITY LAYERS...',
    'FIREWALL STATUS: SIMULATED',
    'AUTHORIZATION CHECK...',
  ],
  deep: [
    'INITIALIZING SIMULATION...',
    'ESTABLISHING SANDBOX TUNNEL...',
    'ENUMERATING FICTIONAL SERVICES...',
    'MAPPING DEMONSTRATION TOPOLOGY...',
    'BYPASSING SCRIPTED LAYER 1...',
    'BYPASSING SCRIPTED LAYER 2...',
    'FIREWALL STATUS: SIMULATED',
    'AUTHORIZATION CHECK...',
    'ESCALATING SANDBOX CONTEXT...',
  ],
  minimal: ['INITIALIZING SIMULATION...', 'AUTHORIZATION CHECK...'],
}

const OUTCOME_LABELS: Record<Outcome, { label: string; tone: string; icon: typeof Check }> = {
  granted: { label: 'ACCESS GRANTED', tone: 'border-[#1b6349] bg-[#0a2a20] text-[#79f0b9]', icon: Check },
  denied: { label: 'ACCESS DENIED', tone: 'border-[#6e2633] bg-[#2a1016] text-[#ff9aa6]', icon: X },
  terminated: { label: 'SESSION TERMINATED', tone: 'border-[#6d5320] bg-[#2a2110] text-[#ffd489]', icon: Ban },
  failed: { label: 'AUTHORIZATION FAILED', tone: 'border-[#6e2633] bg-[#2a1016] text-[#ff9aa6]', icon: X },
  complete: { label: 'SIMULATION COMPLETED', tone: 'border-[#1a6472] bg-[#0c2830] text-[#7ff0fb]', icon: Clock },
}

export default function AccessSim() {
  const operator = useEngine(selectOperator)
  const cameras = useEngine((s) => s.cameras)
  const soundEnabled = usePrefs((st) => st.soundEnabled)
  const [outcome, setOutcome] = useState<Outcome>('granted')
  const [script, setScript] = useState<'standard' | 'deep' | 'minimal'>('standard')
  const [speed, setSpeed] = useState(600)
  const [target, setTarget] = useState('shadow-sim-node-07')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(-1)
  const [finished, setFinished] = useState<Outcome | null>(null)
  const timers = useRef<number[]>([])

  const lines = SCRIPTS[script]

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const run = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    setRunning(true)
    setFinished(null)
    setStep(-1)
    lines.forEach((_l, i) => {
      const t = window.setTimeout(() => {
        setStep(i)
        if (soundEnabled) audio.play('keystroke')
      }, speed * i)
      timers.current.push(t)
    })
    const done = window.setTimeout(() => {
      setRunning(false)
      setFinished(outcome)
      if (soundEnabled) audio.play(outcome === 'granted' || outcome === 'complete' ? 'granted' : 'denied')
    }, speed * lines.length + 260)
    timers.current.push(done)
  }

  const reset = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    setRunning(false)
    setStep(-1)
    setFinished(null)
  }

  const activeCam = cameras[0]

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · ACCESS SEQUENCE"
        title="Access Simulation"
        subtitle="Cinematic authorization sequences for film. Each outcome is scripted — nothing is ever actually accessed."
        icon={ShieldCheck}
        meta={
          <>
            <span className="badge badge-cyan">SCRIPTED SEQUENCE</span>
            <span className="badge badge-grey">{lines.length} STAGES</span>
            <span className="badge badge-amber">NO REAL TARGET</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={reset}><RotateCcw size={11} /> Reset</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={run} disabled={running}><Play size={11} /> Run sequence</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Authorization Console" icon={Server} subtitle={`target: ${target} · operator: ${operator.callsign}`} bodyClassName="p-0">
          <div className="relative min-h-[420px] bg-[#04080b] p-4">
            <div className="micro-grid pointer-events-none absolute inset-0 opacity-25" />
            <div className="scanlines pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between border-b border-[#1c2a36] pb-2">
                <span className="term text-[10px] uppercase tracking-[0.2em] text-[#79f0b9]">access-sequence.sim</span>
                <span className="term text-[9px] text-ink-3">{running ? 'EXECUTING' : finished ? 'COMPLETE' : 'READY'}</span>
              </div>

              <div className="min-h-[220px] space-y-1.5 font-terminal text-[11px]">
                {lines.map((l, i) => {
                  const done = i <= step
                  const isCurrent = i === step && running
                  return (
                    <div key={l} className={cn('flex items-center gap-2 transition-opacity', done ? 'opacity-100' : 'opacity-25')}>
                      <span className={cn('shrink-0', done ? 'text-[#79f0b9]' : 'text-ink-3')}>{done ? '✔' : '·'}</span>
                      <span className={done ? 'text-[#79f0b9]' : 'text-ink-3'}>{l}</span>
                      {isCurrent && <span className="animate-pulse text-[#79f0b9]">▌</span>}
                      {done && <span className="ml-auto font-mono text-[8.5px] text-ink-3">{pad(i + 1, 2)}</span>}
                    </div>
                  )
                })}
              </div>

              {finished && (() => {
                const cfg = OUTCOME_LABELS[finished]
                const Icon = cfg.icon
                return (
                  <div className={cn('mt-4 border p-4 text-center', cfg.tone)}>
                    <Icon size={26} className="mx-auto" />
                    <p className="mt-2 font-display text-xl font-semibold uppercase tracking-[0.16em]">{cfg.label}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] opacity-70">
                      DEMONSTRATION OUTCOME · {new Date().toISOString().slice(11, 19)}Z
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 text-[9px]">
                      <span className="border border-current px-2 py-0.5 uppercase tracking-wider opacity-70">TARGET {target}</span>
                      <span className="border border-current px-2 py-0.5 uppercase tracking-wider opacity-70">OPERATOR {operator.callsign}</span>
                      <span className="border border-current px-2 py-0.5 uppercase tracking-wider opacity-70">STAGES {lines.length}</span>
                    </div>
                  </div>
                )
              })()}

              {!finished && (
                <div className="mt-4 h-1 w-full overflow-hidden bg-[#101c25]">
                  <div
                    className="h-full bg-[#79f0b9] transition-[width] duration-300"
                    style={{ width: `${((step + 1) / lines.length) * 100}%`, boxShadow: '0 0 10px #79f0b9' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line px-2.5 py-1.5">
            <span className="font-mono text-[8.5px] uppercase tracking-widest text-ink-3">CONTAINMENT ACTIVE · NO NETWORK CALLS</span>
            <StatusPill value={finished ? 'completed' : running ? 'active' : 'pending'} label={finished ? 'FINISHED' : running ? 'RUNNING' : 'IDLE'} />
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Sequence Configuration" icon={Zap}>
            <div className="space-y-3">
              <Select
                label="Target (fictional)"
                value={target}
                onChange={setTarget}
                options={['shadow-sim-node-07', 'shadow-sim-db-02', 'shadow-sim-gw-01', 'demo-vault-03', 'fictional-cctv-hub'].map((t) => ({ value: t, label: t }))}
              />
              <Select
                label="Scripted outcome"
                value={outcome}
                onChange={(v) => setOutcome(v)}
                options={[
                  { value: 'granted', label: 'ACCESS GRANTED' },
                  { value: 'denied', label: 'ACCESS DENIED' },
                  { value: 'terminated', label: 'SESSION TERMINATED' },
                  { value: 'failed', label: 'AUTHORIZATION FAILED' },
                  { value: 'complete', label: 'SIMULATION COMPLETED' },
                ]}
              />
              <Select
                label="Sequence length"
                value={script}
                onChange={(v) => setScript(v)}
                options={[
                  { value: 'standard', label: 'Standard (5 stages)' },
                  { value: 'deep', label: 'Deep (9 stages)' },
                  { value: 'minimal', label: 'Minimal (2 stages)' },
                ]}
              />
              <Slider label="Stage interval" min={180} max={1400} step={20} value={speed} onChange={setSpeed} suffix="ms" />
            </div>
          </Panel>

          <Panel title="Operator Session" icon={ShieldCheck}>
            <KeyValue
              cols={1}
              items={[
                { k: 'Operator', v: operator.callsign },
                { k: 'Clearance', v: operator.clearance },
                { k: 'Unit', v: operator.unit },
                { k: 'Target', v: target },
                { k: 'Mode', v: 'SCRIPTED SIMULATION' },
                { k: 'Network', v: 'DISCONNECTED' },
              ]}
            />
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-ink-2">Feeds reachable</span>
              <span className="mono text-[10px] text-ink-3">{cameras.filter((c) => c.status === 'online').length} demo only</span>
            </div>
          </Panel>

          <Panel title="Presets" icon={ChevronRight}>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Cinematic granted', 'granted', 'deep'],
                ['Access denied', 'denied', 'standard'],
                ['Trace detected', 'terminated', 'standard'],
                ['Auth failure', 'failed', 'minimal'],
              ].map(([label, o, sc]) => (
                <button
                  key={label}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => { setOutcome(o as Outcome); setScript(sc as 'standard' | 'deep' | 'minimal') }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[8.5px] leading-relaxed text-ink-3">
              Presets configure the scripted outcome and pacing for a scene.
            </p>
          </Panel>

          {activeCam && (
            <Panel title="Reference Feed" icon={Server} subtitle={`${activeCam.label} · synthetic`} bodyClassName="p-0">
              <div className="relative aspect-video overflow-hidden bg-[#050a0e]">
                <SyntheticFeed seed={activeCam.id} />
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="font-mono text-[8.5px] uppercase tracking-widest text-ink-3">SYNTHETIC DEMO FOOTAGE</span>
                <StatusPill value={activeCam.status} dot={false} />
              </div>
            </Panel>
          )}
        </div>
      </div>

      <InlineAlert tone="amber" title="No real access">
        The access sequences render pre-written text with a chosen outcome. No authentication is attempted against any
        target, and no server, account or network is contacted.
      </InlineAlert>
    </Screen>
  )
}

export function SyntheticFeed({ seed, color = '#28d8ea' }: { seed: string; color?: string }) {
  const bars = Array.from({ length: 22 }, (_, i) => 12 + ((seed.charCodeAt(i % seed.length) * (i + 5)) % 68))
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <rect width="160" height="90" fill="#050a0e" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={0} y1={i * 10} x2={160} y2={i * 10} stroke={color} strokeOpacity={0.07} strokeWidth={0.4} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`v${i}`} x1={i * 13.5} y1={0} x2={i * 13.5} y2={90} stroke={color} strokeOpacity={0.05} strokeWidth={0.4} />
      ))}
      <rect x="18" y="26" width="46" height="34" fill="none" stroke={color} strokeOpacity={0.55} strokeWidth="0.6" />
      <rect x="72" y="18" width="30" height="52" fill="none" stroke={color} strokeOpacity={0.4} strokeWidth="0.6" />
      <rect x="110" y="34" width="34" height="30" fill="none" stroke={color} strokeOpacity={0.35} strokeWidth="0.6" />
      <circle cx="41" cy="43" r="4" fill={color} fillOpacity="0.18" stroke={color} strokeOpacity="0.7" strokeWidth="0.5">
        <animate attributeName="r" values="3;5;3" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <g opacity="0.6">
        {bars.slice(0, 16).map((h, i) => (
          <rect key={i} x={i * 10 + 2} y={88 - h * 0.12} width="6" height={h * 0.12} fill={color} fillOpacity="0.25" />
        ))}
      </g>
      <text x="6" y="10" fill={color} fontSize="5" fontFamily="IBM Plex Mono, monospace" opacity="0.85">● REC · SIM</text>
      <text x="154" y="10" fill={color} fontSize="5" fontFamily="IBM Plex Mono, monospace" opacity="0.6" textAnchor="end">{seed}</text>
      <text x="6" y="85" fill={color} fontSize="4.5" fontFamily="IBM Plex Mono, monospace" opacity="0.5">SYNTHETIC FEED · NOT A REAL CAMERA</text>
    </svg>
  )
}
