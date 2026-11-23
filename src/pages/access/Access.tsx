import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Fingerprint, KeyRound, Lock, ShieldAlert, ShieldCheck, RotateCcw, Check, X } from 'lucide-react'
import { ShadowMark, SimulationBadge, Wordmark } from '@/components/brand/Logo'
import { cn, pad } from '@/lib/utils'
import { useEngine, selectOperator } from '@/services/engine'
import { audio } from '@/services/audio'
import { usePrefs } from '@/services/prefs'
import { InlineAlert } from '@/components/ui'

const CHALLENGE = [
  'ESTABLISHING SECURE CHANNEL',
  'VERIFYING OPERATOR IDENTIFIER',
  'CHECKING CLEARANCE LEVEL',
  'LOADING SIMULATION SANDBOX',
  'HANDSHAKE COMPLETE',
]

type Phase = 'idle' | 'running' | 'granted' | 'denied'

export default function Access({ mode }: { mode: 'terminal' | 'operator' | 'recovery' }) {
  const navigate = useNavigate()
  const operators = useEngine((s) => s.operators)
  const setOperator = useEngine((s) => s.setOperator)
  const current = useEngine(selectOperator)
  const boot = useEngine((s) => s.boot)
  const soundEnabled = usePrefs((s) => s.soundEnabled)

  const [callsign, setCallsign] = useState(current.callsign)
  const [passcode, setPasscode] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [step, setStep] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [remember, setRemember] = useState(true)
  const [recoverySent, setRecoverySent] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const push = (line: string) => setLog((l) => [...l.slice(-12), line])

  const runAuth = (success: boolean) => {
    setPhase('running')
    setStep(0)
    setLog([])
    const start = Date.now()
    CHALLENGE.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setStep(i)
        push(`[${new Date().toTimeString().slice(0, 8)}] ${line} … ${success ? 'OK' : i === 2 ? 'FAIL' : 'OK'}`)
      }, 420 * i + 120)
      timers.current.push(t)
    })
    const finish = window.setTimeout(() => {
      setPhase(success ? 'granted' : 'denied')
      if (soundEnabled) audio.play(success ? 'granted' : 'denied')
      push(`[${new Date().toTimeString().slice(0, 8)}] ${success ? 'AUTHORIZATION ACCEPTED' : 'AUTHORIZATION REJECTED'}`)
      if (success) {
        const t2 = window.setTimeout(() => {
          boot()
          navigate('/command-center')
        }, 1500)
        timers.current.push(t2)
      }
      void start
    }, 420 * CHALLENGE.length + 500)
    timers.current.push(finish)
  }

  const demoAccess = () => {
    setCallsign(current.callsign)
    setPasscode('DEMO-ACCESS')
    runAuth(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = operators.find((o) => o.callsign.toLowerCase() === callsign.toLowerCase())
    const valid = Boolean(found) && (passcode.length === 0 || passcode === 'DEMO-ACCESS' || passcode.length >= 6)
    if (found) setOperator(found.id)
    if (remember) {
      try {
        localStorage.setItem('ss-remembered-operator', found?.id ?? current.id)
      } catch {
        /* noop */
      }
    }
    runAuth(valid)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg">
      <div className="micro-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_60%)]" />

      <header className="relative z-10 flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <Link to="/"><Wordmark size="sm" /></Link>
        <div className="flex items-center gap-2">
          <SimulationBadge />
          <span className="mono hidden text-[9px] uppercase tracking-[0.2em] text-ink-3 sm:block">SECURE TERMINAL · 7F-2A</span>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="mb-5 flex items-center gap-3">
            <ShadowMark size={44} />
            <div>
              <p className="label-xs text-[var(--accent)]">SHADOW SYSTEMS</p>
              <h1 className="font-display text-xl font-semibold uppercase tracking-[0.14em] text-ink sm:text-2xl">
                OPERATOR AUTHORIZATION TERMINAL
              </h1>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
            {/* left: form */}
            <div className="panel corner-marks">
              <div className="panel-header">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
                  <Fingerprint size={12} className="text-[var(--accent)]" />
                  {mode === 'recovery' ? 'Credential recovery' : mode === 'operator' ? 'Operator profile select' : 'Identity verification'}
                </span>
                <span className={cn('badge', phase === 'granted' ? 'badge-green' : phase === 'denied' ? 'badge-red' : 'badge-cyan')}>
                  {phase === 'idle' ? 'STANDBY' : phase === 'running' ? 'AUTHENTICATING' : phase === 'granted' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                </span>
              </div>

              <div className="p-4">
                {mode === 'recovery' ? (
                  <div className="space-y-3">
                    <p className="text-[11.5px] leading-relaxed text-ink-2">
                      This is a demonstration environment — there are no real credentials to recover. Use the demo access
                      control below to enter, or pick any operator profile from the directory.
                    </p>
                    <div>
                      <label className="field-label" htmlFor="recovery-id">Operator identifier or callsign</label>
                      <input id="recovery-id" className="field" placeholder="e.g. VANTA" value={callsign} onChange={(e) => setCallsign(e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-primary w-full" onClick={() => setRecoverySent(true)}>
                      <KeyRound size={12} /> Request demo recovery link
                    </button>
                    {recoverySent && (
                      <InlineAlert tone="cyan" title="Demonstration only">
                        No recovery message is sent anywhere. Use <strong>DEMO OPERATOR ACCESS</strong> to proceed.
                      </InlineAlert>
                    )}
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-3">
                    <div>
                      <label className="field-label" htmlFor="callsign">Operator callsign</label>
                      <input
                        id="callsign"
                        className="field"
                        value={callsign}
                        onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                        placeholder="VANTA"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <p className="mt-1 font-mono text-[9px] text-ink-3">
                        HINT · Any callsign from the operator directory is accepted in demo mode.
                      </p>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="passcode">Demo passcode (optional)</label>
                      <input
                        id="passcode"
                        type="password"
                        className="field"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="off"
                      />
                      <p className="mt-1 font-mono text-[9px] text-ink-3">
                        Never enter a real password. Anything you type stays in this browser tab.
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--accent)]" />
                      <span className="text-[11px] text-ink-2">Remember operator display preference on this device</span>
                    </label>

                    <button type="submit" className="btn btn-primary w-full" disabled={phase === 'running'}>
                      <Lock size={12} /> {phase === 'running' ? 'Authenticating…' : 'Authorize access'}
                    </button>
                  </form>
                )}

                <div className="my-3 flex items-center gap-2">
                  <span className="hairline flex-1" />
                  <span className="label-xs">or</span>
                  <span className="hairline flex-1" />
                </div>

                <button type="button" className="btn w-full border-[color-mix(in_srgb,var(--accent)_50%,transparent)] text-[var(--accent)]" onClick={demoAccess} disabled={phase === 'running'}>
                  <ShieldCheck size={13} /> DEMO OPERATOR ACCESS — NO REGISTRATION
                </button>
                <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-wider text-ink-3">
                  Fictional credentials · no data transmitted
                </p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
                {[
                  ['SIM SANDBOX', 'ISOLATED'],
                  ['DATA SOURCE', 'GENERATED'],
                  ['NETWORK', 'OFFLINE'],
                ].map(([l, v]) => (
                  <div key={l} className="p-2">
                    <p className="label-xs">{l}</p>
                    <p className="mono mt-0.5 text-[10px] text-green">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* right: terminal + operators */}
            <div className="space-y-3">
              <div className="terminal-window scanlines relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#1c2a36] bg-[#0a1219] px-2.5 py-1.5">
                  <span className="term text-[10px] uppercase tracking-widest text-[#79f0b9]">auth-sequence.log</span>
                  <span className="term text-[9px] text-ink-3">TTY-01</span>
                </div>
                <div className="h-[220px] overflow-y-auto p-3 term text-[10.5px] leading-relaxed">
                  <p className="text-ink-3">Shadow Systems Authorization Subsystem · v4.2.0</p>
                  <p className="text-ink-3">Session {new Date().toISOString().slice(0, 19).replace('T', ' ')}Z</p>
                  <p className="mb-1 text-[#79f0b9]">$ auth --operator {callsign || 'UNSET'} --sandbox</p>
                  {log.map((l, i) => (
                    <p key={i} className={cn(l.includes('REJECTED') || l.includes('FAIL') ? 'text-red' : l.includes('ACCEPTED') || l.includes('OK') ? 'text-[#79f0b9]' : 'text-ink-2')}>
                      {l}
                    </p>
                  ))}
                  {phase === 'running' && (
                    <p className="text-[#79f0b9] caret">{CHALLENGE[Math.min(step, CHALLENGE.length - 1)]}…</p>
                  )}
                  {phase === 'granted' && (
                    <div className="mt-2 border border-[#1b6349] bg-[#0a2a20] p-2">
                      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#79f0b9]">
                        <Check size={12} /> ACCESS GRANTED
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-ink-3">Routing to command center…</p>
                    </div>
                  )}
                  {phase === 'denied' && (
                    <div className="mt-2 border border-[#6e2633] bg-[#2a1016] p-2">
                      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#ff9aa6]">
                        <X size={12} /> ACCESS DENIED
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-ink-3">Identifier not found in the operator directory.</p>
                    </div>
                  )}
                  {phase === 'idle' && <p className="text-ink-3">awaiting credentials _</p>}
                </div>
                <div className="flex items-center justify-between border-t border-[#1c2a36] bg-[#0a1219] px-2.5 py-1">
                  <span className="term text-[9px] text-ink-3">ENCRYPTION: SIM-LOCAL</span>
                  <button type="button" className="term flex items-center gap-1 text-[9px] text-ink-3 hover:text-ink" onClick={() => { setLog([]); setPhase('idle') }}>
                    <RotateCcw size={9} /> clear
                  </button>
                </div>
              </div>

              {mode === 'operator' ? (
                <div className="panel">
                  <div className="panel-header">
                    <span className="label-xs">Operator directory</span>
                    <span className="badge badge-cyan">{operators.length} profiles</span>
                  </div>
                  <div className="max-h-[180px] overflow-y-auto">
                    {operators.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setOperator(o.id); setCallsign(o.callsign); runAuth(true) }}
                        className="flex w-full items-center justify-between gap-2 border-b border-line-soft px-2.5 py-1.5 text-left last:border-0 hover:bg-elevated"
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-[10.5px] text-ink">{o.callsign}</span>
                          <span className="block truncate text-[9.5px] text-ink-3">{o.role}</span>
                        </span>
                        <span className="badge badge-grey">{o.clearance}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="panel p-3">
                  <p className="label-xs mb-2">System status</p>
                  <ul className="space-y-1.5">
                    {[
                      ['Core engine', 'OPERATIONAL', 'green'],
                      ['Simulation sandbox', 'CONTAINED', 'green'],
                      ['Operator registry', '12 PROFILES', 'cyan'],
                      ['Encryption layer', 'LOCAL ONLY', 'green'],
                      ['External network', 'DISCONNECTED', 'grey'],
                    ].map(([l, v, tone]) => (
                      <li key={l} className="flex items-center justify-between">
                        <span className="text-[11px] text-ink-2">{l}</span>
                        <span className={cn('badge', `badge-${tone}`)}>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-3 font-mono text-[9.5px] uppercase tracking-wider text-ink-3">
              <Link to="/access" className={cn('hover:text-ink', mode === 'terminal' && 'text-[var(--accent)]')}>Terminal</Link>
              <Link to="/access/operator" className={cn('hover:text-ink', mode === 'operator' && 'text-[var(--accent)]')}>Select operator</Link>
              <Link to="/access/recovery" className={cn('hover:text-ink', mode === 'recovery' && 'text-[var(--accent)]')}>Recovery</Link>
            </div>
            <Link to="/" className="btn btn-sm btn-ghost">
              <ArrowRight size={10} className="rotate-180" /> Back to landing
            </Link>
          </div>

          <div className="mt-3 flex items-start gap-2 border border-line-soft bg-panel/40 p-2.5">
            <ShieldAlert size={13} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-[10px] leading-relaxed text-ink-3">
              This authorization terminal is a fictional demonstration. It does not collect, store or transmit credentials,
              and cannot access any real system. All operator profiles and sessions are simulated. Session timestamp:{' '}
              <span className="mono">{pad(new Date().getUTCHours())}:{pad(new Date().getUTCMinutes())}Z</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
