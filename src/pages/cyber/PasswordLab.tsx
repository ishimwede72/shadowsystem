import { useMemo, useState } from 'react'
import { Eye, EyeOff, KeyRound, ShieldCheck, Info, Timer, Bug, ListChecks } from 'lucide-react'
import { Panel, PageHeader, Screen, InlineAlert, Progress, KeyValue, Divider, StatusPill, Collapsible } from '@/components/ui'
import { RadialGauge, PALETTE, BarsTrend, HeatStrip } from '@/components/charts'
import { cn } from '@/lib/utils'

const COMMON = ['password', '123456', 'qwerty', 'letmein', 'admin', 'welcome', 'shadow', 'dragon', 'monkey', 'iloveyou', 'changeme', 'football']

function analyze(pw: string) {
  const length = pw.length
  const hasLower = /[a-z]/.test(pw)
  const hasUpper = /[A-Z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)
  const hasSpace = /\s/.test(pw)
  const unique = new Set(pw).size
  const repeats = length - unique

  let pool = 0
  if (hasLower) pool += 26
  if (hasUpper) pool += 26
  if (hasDigit) pool += 10
  if (hasSymbol) pool += 33
  if (hasSpace) pool += 1
  const entropy = length > 0 && pool > 0 ? Math.round(length * Math.log2(pool)) : 0

  const isCommon = COMMON.some((c) => pw.toLowerCase().includes(c))
  const sequential = /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv)/i.test(pw)

  let score = Math.min(100, entropy * 1.35)
  if (isCommon) score = Math.min(score, 14)
  if (sequential) score -= 18
  if (unique < 4 && length > 3) score -= 12
  score = Math.max(0, Math.round(score))

  const label = score >= 80 ? 'EXCELLENT' : score >= 60 ? 'STRONG' : score >= 40 ? 'MODERATE' : score >= 20 ? 'WEAK' : 'CRITICAL'
  const color = score >= 80 ? PALETTE.green : score >= 60 ? PALETTE.cyan : score >= 40 ? PALETTE.amber : PALETTE.red

  const keyspace = Math.pow(Math.max(pool, 1), Math.max(length, 1))
  const guessesPerSecond = 1e10
  const seconds = keyspace / guessesPerSecond / 2
  const crackTime = formatDuration(seconds)

  return {
    length, hasLower, hasUpper, hasDigit, hasSymbol, hasSpace, unique, repeats,
    entropy, pool, score, label, color, crackTime, isCommon, sequential,
  }
}

function formatDuration(seconds: number) {
  if (!isFinite(seconds)) return '—'
  if (seconds < 1) return 'instantly'
  if (seconds < 60) return `${seconds.toFixed(0)} seconds`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`
  if (seconds < 31_536_000) return `${(seconds / 86400).toFixed(0)} days`
  const years = seconds / 31_536_000
  if (years < 1e6) return `${years.toExponential(1)} years`
  if (years < 1e15) return `${(years / 1e6).toFixed(1)} million years`
  return `${years.toExponential(1)} years`
}

export default function PasswordLab() {
  const [pw, setPw] = useState('Sh4d0w!Systems2026')
  const [show, setShow] = useState(true)
  const [simRunning, setSimRunning] = useState(false)
  const [simProgress, setSimProgress] = useState(0)
  const [simResult, setSimResult] = useState<string | null>(null)

  const a = useMemo(() => analyze(pw), [pw])

  const runScriptedGuess = () => {
    setSimRunning(true)
    setSimProgress(0)
    setSimResult(null)
    let p = 0
    const interval = setInterval(() => {
      p += 4
      setSimProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        setSimRunning(false)
        const isWeak = a.score < 45
        setSimResult(
          isWeak
            ? `SCRIPTED DEMO: a fictional dictionary attack against sample passwords of this class would succeed within ${a.crackTime}. This is an illustration, not an attack on your input.`
            : `SCRIPTED DEMO: this sample exceeds the fictional dictionary in this demonstration, so the scripted attack would not succeed in a practical timeframe (estimated ${a.crackTime}).`,
        )
      }
    }, 60)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · PASSWORD LABORATORY"
        title="Password Laboratory"
        subtitle="An educational strength analyser. Everything is computed locally in your browser — nothing is stored or transmitted."
        icon={KeyRound}
        meta={
          <>
            <span className="badge badge-green">LOCAL ONLY</span>
            <span className="badge badge-grey">COMPUTED IN-BROWSER</span>
            <span className="badge badge-amber">NEVER USE A REAL PASSWORD</span>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Sample Password Analysis" icon={KeyRound} subtitle="Enter a throwaway sample only">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="field pr-9 font-mono text-[14px] tracking-wider"
              placeholder="Type a demo sample password…"
              aria-label="Sample password"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide' : 'Show'}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="mt-1 font-mono text-[9px] text-ink-3">Characters: <span className="text-ink-2">{pw.length}</span> · Unique: <span className="text-ink-2">{a.unique}</span></p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <Panel dense className="text-center">
              <RadialGauge value={a.score} color={a.color} label={a.label} height={130} />
            </Panel>
            <div className="space-y-2">
              {[
                ['Length ≥ 12', a.length >= 12],
                ['Lowercase', a.hasLower],
                ['Uppercase', a.hasUpper],
                ['Number', a.hasDigit],
                ['Symbol', a.hasSymbol],
                ['No dictionary term', !a.isCommon],
                ['No sequence', !a.sequential],
              ].map(([label, ok]) => (
                <div key={String(label)} className="flex items-center justify-between border-b border-line-soft/50 pb-1">
                  <span className="text-[10.5px] text-ink-2">{label}</span>
                  <span className={cn('mono text-[9px] uppercase tracking-wider', ok ? 'text-green' : 'text-red')}>{ok ? '✓ PASS' : '✕ FAIL'}</span>
                </div>
              ))}
            </div>
          </div>

          <Divider label="ENTROPY BREAKDOWN" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['ENTROPY', `${a.entropy} bits`],
              ['KEYSYSTEM', `${a.pool} symbols`],
              ['EST. CRACK', a.crackTime],
              ['COMPOSITION', `${a.unique} unique`],
            ].map(([k, v]) => (
              <div key={k} className="border border-line-soft p-2">
                <p className="label-xs">{k}</p>
                <p className="mono mt-0.5 text-[11px] text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button type="button" className="btn btn-sm btn-primary" onClick={runScriptedGuess} disabled={simRunning}>
              <Bug size={11} /> {simRunning ? 'Running scripted demo…' : 'Run scripted dictionary demo'}
            </button>
            {simRunning && <Progress value={simProgress} className="mt-2" color={PALETTE.amber} showValue label="Scripted demo progress" />}
            {simResult && (
              <div className="mt-2 border border-[#1a6472] bg-[#0c2830] p-2.5 text-[10.5px] leading-relaxed text-[#7ff0fb]">{simResult}</div>
            )}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Entropy Explained" icon={Info}>
            <div className="space-y-2 text-[11px] leading-relaxed text-ink-2">
              <p>
                <strong className="text-ink">Entropy</strong> measures how unpredictable a password is, in bits. Each extra bit
                doubles the search space an attacker would need to cover.
              </p>
              <p className="text-ink-3">
                H ≈ length × log₂(pool size). A 12-character password drawn from 94 printable symbols carries roughly
                78 bits — far beyond anything a scripted demonstration would attempt.
              </p>
              <p className="text-ink-3">
                Length beats complexity: 20 random lowercase characters (≈94 bits) are stronger than 8 characters with
                symbols (≈52 bits).
              </p>
            </div>
            <Divider label="COMPOSITION ANALYSIS" />
            <div className="space-y-1.5">
              {[
                ['Lowercase', a.hasLower, 26],
                ['Uppercase', a.hasUpper, 26],
                ['Digits', a.hasDigit, 10],
                ['Symbols', a.hasSymbol, 33],
                ['Repeated chars', a.repeats > 0, a.repeats],
              ].map(([label, present, n]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-2">{label}</span>
                  <span className="mono text-[9.5px] text-ink-3">{present ? `+${n}` : 'absent'}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Fictional Dictionary" icon={ListChecks} subtitle="Sample terms used by the scripted demo">
            <div className="flex flex-wrap gap-1">
              {COMMON.map((c) => (
                <span key={c} className="badge badge-grey">{c}</span>
              ))}
            </div>
            <p className="mt-2 font-mono text-[8.5px] leading-relaxed text-ink-3">
              This is a demonstration list, not a cracking wordlist. It is never used against real credentials or external
              services.
            </p>
          </Panel>

          <Collapsible title="Safety Posture" icon={ShieldCheck} defaultOpen>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
              <li>• Input is analysed in memory and never stored.</li>
              <li>• Nothing is sent to any server, log or analytics provider.</li>
              <li>• The “crack” demo is a scripted progress animation.</li>
              <li>• No external account is ever targeted.</li>
            </ul>
            <div className="mt-2 flex items-center gap-1.5">
              <StatusPill value="active" label="LOCAL PROCESSING" />
              <StatusPill value="inactive" label="NO EGRESS" />
            </div>
          </Collapsible>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Strength by Length" icon={Timer} subtitle="Illustrative entropy curve for a 94-symbol pool">
          <BarsTrend
            data={Array.from({ length: 16 }, (_, i) => ({ t: String(i + 5), bits: Math.round((i + 5) * Math.log2(94)) }))}
            keys={[{ key: 'bits', color: PALETTE.cyan, label: 'Bits' }]}
            height={180}
            xKey="t"
          />
        </Panel>
        <Panel title="Entropy Heat Map" icon={Timer} subtitle="Growing search space per character">
          <HeatStrip data={Array.from({ length: 24 }, (_, i) => Math.log2(Math.pow(94, i + 1)))} colors={['#0c2830', '#125260', '#1aa3b8', '#28d8ea', '#7ff0fb']} />
          <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3"><span>1 CHAR</span><span>24 CHARS</span></div>
          <Divider />
          <KeyValue
            items={[
              { k: 'Current sample entropy', v: `${a.entropy} bits` },
              { k: 'Sample score', v: `${a.score}/100` },
              { k: 'Estimated crack time', v: a.crackTime },
              { k: 'Classification', v: a.label },
            ]}
          />
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Educational simulation only">
        Never enter a real password into a demonstration tool. This laboratory performs local analysis for teaching and
        film production purposes and never attempts to crack external accounts.
      </InlineAlert>
    </Screen>
  )
}
